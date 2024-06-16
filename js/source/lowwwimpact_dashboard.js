/*

Ciao! Just a little note: I'm not exactly a developer, I know my way around and 
got enough time to spend (or lose since AI will replace coding) to try and code
some stuff such as this prototype

I did my best, I know it is not perfect, nor the most efficient coding you will
see (so much for preaching for sustainable web practices). By hoping that my 
code makes sense to you, feel free to fork it and improve it.

Cheers, 
Vanderlanth.

*/


//=============================================================================
//=============================================================================
// General Infos ==============================================================
let print_project_name          = document.querySelector('.project_name')
let data_project_name           = 'No name' 
let site_url;
let installed_on                = '00-0000'
let refresh                     = false
let first_load                  = true
let resize_ended
let graphic_view                = 'days'



// Data to display ============================================================
let data_visits                 = 0
let data_bandwidth_usage        = 0
let data_bandwidth_usage_high   = 0
let data_energy_usage           = 0
let data_energy_usage_high      = 0
let data_co2e                   = 0
let data_co2e_high              = 0
let data_energy_mix             = 0
let data_energy_fossil_free     = 0
let log_files                   = []
let data_to_display             = []
let pages                       = []
let url_keys                    = []
let days                        = []
let days_keys                   = []


// Main stats =================================================================
let print_visits                = document.querySelector('.block_visits .value')
let print_bandwidth_usage       = document.querySelector('.block_bandwidth .value')
let print_energy_usage          = document.querySelector('.block_energy .value')
let print_co2e                  = document.querySelector('.block_co2 .value')
let print_energy_mix            = document.querySelector('.block_mix .value')
let monitored_container         = document.querySelector('.monitored_graph .graphic')


// Equivalences ===============================================================
let print_equiv_title           = document.querySelector('.equiv_weight')
let print_equiv_tree            = document.querySelector('.equiv_tree .sentence')
let print_equiv_thermic_car     = document.querySelector('.equiv_car .sentence')
let print_equiv_evbike          = document.querySelector('.equiv_evbike .sentence')
let print_equiv_bee             = document.querySelector('.equiv_bees .sentence')


// Period selection ===========================================================
let distribution_container      = document.querySelector('.distribution ul')
let month_selector              = document.querySelector('#month-selector')
let year_selector               = document.querySelector('#year-selector')
let apply                       = document.querySelector('.apply')
let button_refresh              = document.querySelector('.refresh_data')


// SWD Electricity Grid =======================================================
let ratio_networks              = 0.24
let ratio_devices               = 0.54
let ratio_datacenters           = 0.22
let kwh_per_gb                  = 0.194 // operationnal
let intensity_default           = 494
let intensity_greenhosted       = 50
let intensity_datacenters       = intensity_default
let is_green_hosted;
let avg_mix;

let kwh_dt                      = 0.055
let kwh_network                 = 0.059
let kwh_device                  = 0.08





//=============================================================================
//=============================================================================
// Init =======================================================================

// Gets the config file
function init_lowwwimpact(){
    fetch('/lowwwimpact_stats/config.json')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        installed_on        = data.installed_on
        data_project_name   = data.project_name
        site_url            = data.site_url
        is_green_hosted     = data.is_green_hosted

        if (is_green_hosted == true) {
            intensity_datacenters = intensity_greenhosted
        }

        print_project_name.textContent = data_project_name
        document.title                  = data_project_name + ' · lowwwimpact.stats'
        log_files.push(installed_on);

        list_logs(installed_on);
    });
}

// Defines the period tracked, each month/year is added to the select input
function list_logs(from) {
    let today           = new Date();
    let to_mm           = Number(today.getMonth() + 1); //January is 0
    let to_yyyy         = today.getFullYear();
    let to              = to_yyyy + '-' + to_mm;

    let from_split      = from.split('-');

    let current_mm      = Number(from_split[1]); 
    let current_from    = Number(from_split[0]); 

    addyear(current_from);

    //preselect the current month, hides the empty value options
    let month_active = month_selector.querySelector('option[data-month="' + to_mm + '"]').textContent;
    month_selector.querySelector('option[value="empty"]').setAttribute('hidden', 'hidden')
    month_selector.value = month_active

    // this loop defines and stores all the time period tracked.
    while (current_from + '-' + current_mm != to_yyyy + '-' + to_mm) {
        if (current_mm == 12) {
            current_mm = 1
            current_from++
            addyear(current_from);
        } else {
            current_mm++
        }

        let mm = current_mm
        if (mm < 10) {
            mm = '0' + mm;
        }

        let file = current_from + '-' + mm;
        log_files.push(file)
    }

    select_year(to_yyyy);
}

// Defines the year to display (coupled with the selected month)
// Adapts the possible month options based on the selected year
function select_year(yyyy){

    // selects the year and hides the empty default
    year_selector.value = yyyy;
    year_selector.querySelector('option[value="empty"]').setAttribute('hidden', 'hidden')

    //adapts months
    for (let month = 1; month <= 12; month++) {
        let mm = month
        if (mm < 10) {
            mm = '0' + mm;
        }

        let period = yyyy + '-' + mm
        if (log_files.includes(period)) {
            month_selector.querySelector('option[data-month="' + month + '"]').removeAttribute('disabled')
        } 
        else {
            month_selector.querySelector('option[data-month="' + month + '"]').setAttribute('disabled', 'disabled')
        }
    }

    // loading logs from this function only after a page refresh / on DOM ready.
    if (first_load == true) {
        first_load = false;
        load_logs();
    }
}

// Checks if the current time/period selection is ok
function check_selection(){
    if (document.querySelector('.time_selector input[name="time"]:checked').id != 'alltime') {
        if (month_selector.value != 'empty' && year_selector.value != 'empty') {
            apply.removeAttribute('disabled')
            apply.classList.remove('hidden')
            return true;
        } 
        else if (year_selector.value != 'empty' && document.querySelector('.time_selector input[name="time"]:checked').id == 'year') {
            apply.removeAttribute('disabled')
            apply.classList.remove('hidden')
            return true;
        }
        else {
            apply.setAttribute('disabled', 'disabled')
            return false;
        }
    } 
    else if(document.querySelector('.time_selector input[name="time"]:checked').id == 'alltime') {
        return true;
    }
}

// Loading the datas to display, with the less computations as possible
function load_logs(reload) {
    let can_load = check_selection();

    if(can_load == true){
        apply.classList.add('hidden')

        let files_to_get        = [];
        let data_to_display     = [];
        let length              = 0;
        let radio               = document.querySelector('input[name="time"]:checked').id;

        // Selects the appropriate log files to load
        if (radio == 'year') {
    
            graphic_view    = 'months'
            let yyyy        = year_selector.value;

            log_files.forEach(element => {
                if (element.includes(yyyy)) {
                    files_to_get.push(element);
                }
            });
        } 
        else if(radio == 'month') {

            graphic_view    = 'days'
            let yyyy        = year_selector.value
            let month       = month_selector.value
            let mm          = month_selector.options[month_selector.selectedIndex].getAttribute('data-month');

            if (mm < 10) {
                mm = '0' + mm;
            }

            let from = yyyy + '-' + mm

            if (log_files.includes(from)) {
                files_to_get.push(from);
            }
        }
        else {
            files_to_get = log_files;
            graphic_view = 'months'
        }

        // Compile theor each selected files
        length = files_to_get.length
        files_to_get.forEach(sheet => {

            reset_parsing()

            // before making server request, the function checks if there is the data saved in localstorage
            // and if yes, if the data is still valid (expires only applies to the current month)
            let expire          = localStorage[sheet] ? JSON.parse(localStorage[sheet]).expire : false
            let stamp           = Date.now()
            let now             = new Date(stamp);
            let has_expired     = expire < Date.parse(now);

            //gets data from localstorage
            if (localStorage[sheet] != undefined && has_expired == false) {
                let parsed = JSON.parse(localStorage[sheet])
                data_to_display.push(parsed);
            }
            // data in localstorage does not exists or is expired
            // checks if the server has the data cached and pass it to the localstorage (less computations)
            // if not, then the code loads the logfile (more computations)
            else if(reload == true){
                fetch('/lowwwimpact_stats/log/' + sheet + '.log?url=FALSE&stamp='+stamp)
                .then(function(response) {
                    return response.text();
                })
                .then(function(data) {
                    data_logs = data.split('\n')
                    data_logs.pop()
                    let parsed = parse_data(sheet, data_logs)
                    data_to_display.push(parsed);
                });
            }
            else {
                fetch('/lowwwimpact_stats/cache/' + sheet + '.json?url=FALSE&stamp='+stamp)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    window.localStorage.setItem(sheet, JSON.stringify(data));
                    data_to_display.push(data);
                })
                .catch(error => {
                    fetch('/lowwwimpact_stats/log/' + sheet + '.log?url=FALSE&stamp='+stamp)
                    .then(function(response) {
                        return response.text();
                    })
                    .then(function(data) {
                        data_logs = data.split('\n')
                        data_logs.pop()
                        let parsed = parse_data(sheet, data_logs)
                        data_to_display.push(parsed);
                    });
                });
            }
        });

        // Waits for all the data to be loaded before displaying it
        let int = setInterval(() => {
            if (data_to_display.length == length) {
                clearInterval(int);

                // if the data is loaded through a manual refresh -> shows visual feedbacks
                if (refresh === true) {
                    refresh = false
                    document.querySelector('.lowwwimpact_banner.success').classList.add('active')
                    document.querySelector('.lowwwimpact main').classList.remove('loading')
                    setTimeout(() => {
                        document.querySelector('.lowwwimpact_banner.refresh').classList.remove('active')
                        document.querySelector('.lowwwimpact_banner.success').classList.remove('active')
                    }, 4000);
                }

                //show data
                setTimeout(() => {
                    document.querySelector('.lowwwimpact_banner.refresh').classList.remove('active')

                    if (graphic_view == 'days') {
                        display_data_days(data_to_display)
                    }
                    else {
                        display_data_months(data_to_display)
                    }

                }, 1000);
                
                document.querySelector('.lowwwimpact main').classList.remove('loading') 
            }
        }, 100);        
    
    }
}

// Log files are raw datas which need to be compiled a bit in order to make more sense and be usable
function parse_data(period, data){

    // Keeps the last logs together, 
    // If 2 timestamps are similar they can get merged.
    // This can happen when you switch apps while visiting the websites
    let recents      = []
    let recents_max  = 5

    reset_parsing()
    
    data.forEach(thislog => {
        let plus_one = 1

        // structure data and get time
        let log                     = thislog.split(', ')
        let timestamp               = log[0]

        // count bandwidth
        data_bandwidth_usage        = data_bandwidth_usage + Number(log[5])
        data_bandwidth_usage_high   = data_bandwidth_usage_high + Number(log[6])


        //count per day
        let time                    = new Date(Number(log[0]));
        let dd                      = time.getDate();


        // check if timestamps is recorded already
        // if yes, plus_one becomes zero and the existing will be updated below
        if (recents.includes(log[0]) == true) {
            plus_one = 0
        } 
        else {
            data_visits++
            data_energy_fossil_free     += Number(log[3])
            data_energy_mix             += Number(log[4])
        }

        // Rassembling visits and bandwidth usage per page
        let page_index;
        let new_page = true;

        if (url_keys.includes(log[1]) == false) {
            url_keys.push(log[1])
            page_index = url_keys.length - 1
        } 
        else {
            page_index = url_keys.indexOf(log[1])
            new_page = false;
        }

        // Entry = page, bandwidth, visits
        let page_entry = [log[1], Number(log[5]) + Number(log[6]), plus_one]
        if (new_page == true) {
            pages.push(page_entry)
        }
        else {
            let dest = pages[page_index]
            let new_entry = [
                log[1], 
                Number(dest[1]) + Number(log[5]) + Number(log[6]),
                Number(dest[2]) + plus_one
            ]
            pages[page_index] = new_entry;
        }


        // Rassembling visits and bandwidth usage per day
        let day_index;
        let new_day = true;

        if (days_keys.includes(dd) == false) {
            days_keys.push(dd)
            day_index = days_keys.length - 1
        } 
        else {
            day_index = days_keys.indexOf(dd)
            new_day = false
        }

        // Entry = day, min. bandwidth, add. bandwidth, visits
        let day_entry = [dd, Number(log[5]), Number(log[6]), plus_one]
        if (new_day == true) {
            days.push(day_entry)
        } 
        else {
            let dest = days[day_index]
            let new_entry = [
                dd,
                Number(log[5]) + Number(dest[1]), 
                Number(log[6]) + Number(dest[2]),
                Number(dest[3]) + plus_one
            ]
            days[day_index] = new_entry;
        }   
                
        // updates recent entries
        recents.push(log[0])
        if (recents.length > recents_max) {
            recents.shift()
        }
    }); 


    // check if last month (if yes, it can expires)
    // the current month is the only period that can change, so it can expire and be reloaded
    // the expire date is exactly one day after loading the log file.
    let can_expire = false 

    if (log_files[log_files.length-1] == period) {
        can_expire          = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
        can_expire          = Date.parse(can_expire);
    }

    let storage = {
        period :            period,
        views :             data_visits,
        fsp :               data_energy_fossil_free/data_visits,
        mix :               data_energy_mix/data_visits,
        min_bandwidth :     data_bandwidth_usage,
        plus_bandwidth :    data_bandwidth_usage_high,
        distribution :      pages,
        daily :             days,
        expire :            can_expire
    }
    
    // Sends to server the data to be cached (and avoid all the computations for the next visit)
    if (navigator.sendBeacon){
        let url   = '/lowwwimpact_stats/cache.php?url=TRUE';
        let blob  = new Blob([JSON.stringify(storage)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
    }

    // And sends also the data to localstorage, so the visitor has limited interactions with the server.
    window.localStorage.setItem(period, JSON.stringify(storage));
    return storage;
}

//view days
function display_data_days(dt) {    
    let to_display                      = merge_data_days(dt)
    
    let b_to_gb                         = 1000000000
    let bd                              = to_display.bandwidth / b_to_gb


    //Main stats ==================================================================================
    print_visits.textContent            = format_nb(to_display.views, 0)
    print_bandwidth_usage.textContent   = format_nb(bd, 3)
    print_energy_usage.textContent      = format_nb((bd * kwh_per_gb), 3);

    avg_mix                             = (to_display.mix * ratio_devices) + (intensity_default * ratio_networks) + (ratio_datacenters * intensity_datacenters) 
    print_energy_mix.textContent        = format_nb(avg_mix, 2)


    let segment_devices                 = bd * kwh_device * avg_mix
    let segment_centers                 = bd * kwh_dt * avg_mix
    let segment_networks                = bd * kwh_network * avg_mix

    let footprint                       = segment_centers + segment_devices + segment_networks
    print_co2e.textContent              = format_nb(footprint, 2)


    //equiv print =================================================================================
    print_equiv_title.textContent                         = format_nb(footprint, 2)
    document.querySelector('.equiv_unit').textContent     = 'gr'

    if (footprint >= 1000) {
        let kg_footprint = footprint / 1000
        document.querySelector('.equiv_unit').textContent = 'kg'
        print_equiv_title.textContent                     = format_nb(kg_footprint, 2)
    }

    print_equiv_tree.textContent        = 'An adult Oak would absorb this within ' + tree_equivalence(footprint) + '.'
    print_equiv_bee.textContent         = "It weights the same as " + bees_equivalence(footprint) + " bees."
    print_equiv_evbike.textContent      = distance_equivalence(footprint, 0.002) + ' with an EV-Bike.'
    print_equiv_thermic_car.textContent = distance_equivalence(footprint, 0.152) + ' with a thermic car.'


    // Emissions per page =========================================================================
    let distribution_sort = [] 

    // sort pages
    to_display.distribution[0].forEach(page => {
        let index       = to_display.distribution[0].indexOf(page)
        let associate   = [to_display.distribution[1][index][0], to_display.distribution[1][index][1], page]

        distribution_sort.push(associate)
        distribution_sort.sort(function(a, b){return b[0] - a[0]})
    });

    //merge lowest page emission (rest of website) 
    let visit_other            = 0
    let bit_other              = 0
    let distribution_other     = 1 //starts ast 0. 1 = 2 items, then rest of website

    for (let index = 0; index < distribution_sort.length; index++) {
        if(index >= distribution_other){
            let item    = distribution_sort[index]
            visit_other += item[1]
            bit_other   += item[0]
        }
    }

    for (let index = 0; index < distribution_sort.length; index++) {
        if(index >= distribution_other){
            distribution_sort.splice(index, 1)
        }
    }

    if (bit_other != 0 && visit_other != 0) {
        let others = [bit_other, visit_other, 'Rest of website']
        distribution_sort.push(others)
    }

    // append stats in UI
    distribution_container.innerHTML = ''


    distribution_sort.forEach(item => {
        let clone                                               = document.querySelector('.template_url').content.cloneNode(true);
        clone.querySelector('a').textContent                    = item[2]
        clone.querySelector('.visits').textContent              = format_nb(item[1], 0)
        clone.querySelector('a').setAttribute('href', item[2])

        let scale = 1;
        
        let page_share = (item[0] / 1000000000) * avg_mix
        if (page_share >= 1000) {
            page_share = page_share/1000
            scale = 1000
            clone.querySelector('.page_share_unit').textContent = 'kg'
        }
        clone.querySelector('.view_gr').textContent             = format_nb((page_share * scale) / item[1], 2)
        clone.querySelector('.total_kg').textContent            = format_nb((page_share), 2)

        distribution_container.appendChild(clone)
    });

    // GRAPHIC
    // find min, max
    let sort_days               = to_display.daily.slice()
    let sort_bandwidth          = sort_days.sort(function(a, b){return (b[1]+b[2]) - (a[1]+a[2])});

    let highest_bandwidth       = (sort_bandwidth[0][2] + sort_bandwidth[0][1])
    let lowest_bandwidth        = 0

    let scale                   = highest_bandwidth.toString().length

    let round_highest_bandwidth = roundUp(highest_bandwidth, scale)
    let round_lowest_bandwidth  = roundDown(lowest_bandwidth, scale)

    let highest_co2             = (highest_bandwidth / 1000000000) * avg_mix
    let lowest_co2              = 0

    let round_highest_co2       = roundUp(highest_co2, 2)
    let round_lowest_co2        = roundDown(lowest_co2, 2)

    let steps_co2               = graphic_steps(round_lowest_co2, round_highest_co2);              
    let steps_bandwidth         = graphic_steps(round_lowest_bandwidth, round_highest_bandwidth);   
    let row_nb                  = 0;



    // define bandwidth scale (mb or gb?) (input -> bytes)
    let bandwidth_unit = 1000000 //mb
    document.querySelector('.bandwidth-unit').textContent = '(mb)';

    if (highest_bandwidth >= 1000000000) {
        bandwidth_unit = 1000000000 //gb
        document.querySelector('.bandwidth-unit').textContent = '(gb)';
    }

    // define co2eq scale (gr or kg)
    let co2_unit = 1 //gr
    document.querySelector('.co2-unit').textContent = '(gr)';

    if (highest_co2 >= 1000) {
        bandwidth_unit = 1000 //kg
        document.querySelector('.co2-unit').textContent = '(kg)';
    }


    document.querySelectorAll('.col-sticky .row').forEach(row => {
        row.querySelector('.row-co2').textContent = format_nb(steps_co2[row_nb] / co2_unit, 3)
        row.querySelector('.row-bandwidth').textContent = format_nb(steps_bandwidth[row_nb] / bandwidth_unit, 3)
        row_nb++;
    });


    //fill populate with empty cols aswell
    let filled_cols     = to_display.daily.slice()
    let month_to_test   = to_display.period
    
    let col_amount      = getDaysInMonth(month_to_test[0], month_to_test[1])

    filled_cols         = filled_cols.sort(function(a, b){return a[0] - b[0]})
    let cols            = []

    for (let fill = 1; fill <= col_amount; fill++) {
        if (filled_cols[0] != undefined && filled_cols[0][0] == fill) {
            let item = filled_cols[0]
            filled_cols.shift()
            cols.push(item)
        }
        else {
             cols.push([fill, 0, 0, 0])
        }
    }

    let ratio                                                       =  16 * 16 / 100
    monitored_container.querySelector('.graphic-data').innerHTML    = ''

    cols.forEach(col => {
        let col_str       = document.querySelector('.template_day').content.cloneNode(true);

        //get size mb
        let mb_bottom     = (100 / round_highest_bandwidth * col[1]) * ratio
        let mb_up         = (100 / round_highest_bandwidth * (col[1] + col[2])) * ratio
        let mb_h          = mb_up - mb_bottom

        if (mb_h == 0) {
            mb_h = 5
        }

        let mb_style = 'height: ' + (mb_h) + 'px; bottom:' + mb_bottom + 'px'
        col_str.querySelector('.col-item-graphic-bandwidth').setAttribute('style', mb_style)


        //get size co2
        let co2_min        = (col[1] / b_to_gb) * avg_mix
        let co2_max        = ((col[1] + col[2]) / b_to_gb) * avg_mix 
        
        let co2_bottom     = (100 / round_highest_co2 * co2_min) * ratio
        let co2_up         = (100 / round_highest_co2 * co2_max) * ratio
        let co2_h          = co2_up - co2_bottom

        if (co2_h == 0) {
            co2_h = 5
        }

        let co2_style = 'height: ' + (co2_h) + 'px; bottom:' + co2_bottom + 'px'
        col_str.querySelector('.col-item-graphic-co2').setAttribute('style', co2_style)
        


        col_str.querySelector('.col-item-graphic').setAttribute('data-min', col[1])
        col_str.querySelector('.col-item-graphic').setAttribute('data-max', col[1] + col[2])

        col_str.querySelector('.col-item-number').textContent = col[0]
        col_str.querySelector('.col-item-visits').textContent = col[3]

        monitored_container.querySelector('.graphic-data').appendChild(col_str)
    });

    document.querySelector('.col-item-number').textContent = 'Day'

}

function merge_data_days(dt) {
    data_visits                 = 0
    data_bandwidth_usage        = 0
    data_bandwidth_usage_high   = 0
    data_energy_mix             = 0
    data_energy_fossil_free     = 0

    let distribution_pages      = []
    let distribution_data       = []

    let arr_length = dt.length

    dt.forEach(element => {

        data_visits             += element.views
        data_bandwidth_usage    += element.min_bandwidth
        data_energy_mix         += element.mix
        data_days               = element.daily
        data_period             = element.period

        element.distribution.forEach(page => {

            let key = page[0]
            let value = [page[1], page[2]]

            if(distribution_pages.includes(key)){
                
                let index   = distribution_pages.indexOf(key)
                let dest    = distribution_data[index]

                let new_entry = [
                    Number(dest[0]) + Number(page[1]), 
                    Number(dest[1]) + Number(page[2])
                ]
                distribution_data[index] = new_entry;
            } 
            else {
                distribution_pages.push(key)
                distribution_data.push(value)
            }
        });

    });

    let to_display = {
        period: data_period,
        views : data_visits,
        bandwidth : data_bandwidth_usage,
        mix: data_energy_mix / arr_length,
        distribution: [distribution_pages, distribution_data],
        daily: data_days
    }

    return to_display
    
}


// same but with months
function display_data_months(dt) {
    let to_display                      = merge_data_months(dt)
    
    let b_to_gb                         = 1000000000
    let bd                              = to_display.bandwidth / b_to_gb


    //Main stats ==================================================================================
    print_visits.textContent            = format_nb(to_display.views, 0)
    print_bandwidth_usage.textContent   = format_nb(bd, 3)
    print_energy_usage.textContent      = format_nb((bd * kwh_per_gb), 3);

    let avg_mix                         = (to_display.mix * ratio_devices) + (intensity_default * ratio_networks) + (ratio_datacenters * intensity_datacenters) 
    print_energy_mix.textContent        = format_nb(avg_mix, 2)

    let segment_devices                 = bd * kwh_device * avg_mix
    let segment_centers                 = bd * kwh_dt * avg_mix
    let segment_networks                = bd * kwh_network * avg_mix

    let footprint                       = segment_centers + segment_devices + segment_networks
    print_co2e.textContent              = format_nb(footprint, 2)


    //equiv print =================================================================================
    print_equiv_title.textContent                         = format_nb(footprint, 2)
    document.querySelector('.equiv_unit').textContent     = 'gr'

    if (footprint >= 1000) {
        let kg_footprint = footprint / 1000
        document.querySelector('.equiv_unit').textContent = 'kg'
        print_equiv_title.textContent                     = format_nb(kg_footprint, 2)
    }

    print_equiv_tree.textContent        = 'An adult Oak would absorb this within ' + tree_equivalence(footprint) + '.'
    print_equiv_bee.textContent         = "It weights the same as " + bees_equivalence(footprint) + " bees."
    print_equiv_evbike.textContent      = distance_equivalence(footprint, 0.002) + ' with an EV-Bike.'
    print_equiv_thermic_car.textContent = distance_equivalence(footprint, 0.152) + ' with a thermic car.'


    // Emissions per page =========================================================================
    let distribution_sort = [] 

    // sort pages
    to_display.distribution[0].forEach(page => {
        let index       = to_display.distribution[0].indexOf(page)
        let associate   = [to_display.distribution[1][index][0], to_display.distribution[1][index][1], page]

        distribution_sort.push(associate)
        distribution_sort.sort(function(a, b){return b[0] - a[0]})
    });

    //merge lowest page emission (rest of website) 
    let visit_other            = 0
    let bit_other              = 0
    let distribution_other     = 1 //starts ast 0. 1 = 2 items, then rest of website

    for (let index = 0; index < distribution_sort.length; index++) {
        if(index >= distribution_other){
            let item    = distribution_sort[index]
            visit_other += item[1]
            bit_other   += item[0]
        }
    }

    for (let index = 0; index < distribution_sort.length; index++) {
        if(index >= distribution_other){
            distribution_sort.splice(index, 1)
        }
    }

    if (bit_other != 0 && visit_other != 0) {
        let others = [bit_other, visit_other, 'Rest of website']
        distribution_sort.push(others)
    }

    // append stats in UI
    distribution_container.innerHTML = ''

    distribution_sort.forEach(item => {
        let clone                                               = document.querySelector('.template_url').content.cloneNode(true);
        clone.querySelector('a').textContent                    = item[2]
        clone.querySelector('.visits').textContent              = format_nb(item[1], 0)
        clone.querySelector('a').setAttribute('href', item[2])

        let scale = 1;
        
        let page_share = (item[0] / 1000000000) * avg_mix
        if (page_share >= 1000) {
            page_share = page_share/1000
            scale = 1000
            clone.querySelector('.page_share_unit').textContent = 'kg'
        }
        clone.querySelector('.view_gr').textContent             = format_nb((page_share * scale) / item[1], 2)
        clone.querySelector('.total_kg').textContent            = format_nb((page_share), 2)

        distribution_container.appendChild(clone)
    });

    // GRAPHIC
    // find min, max
    let sort_days               = to_display.monthly.slice()
    let sort_bandwidth          = sort_days.sort(function(a, b){return (b[1]+b[2]) - (a[1]+a[2])});

    let highest_bandwidth       = (sort_bandwidth[0][2] + sort_bandwidth[0][1])
    let lowest_bandwidth        = 0

    let scale                   = highest_bandwidth.toString().length

    let round_highest_bandwidth = roundUp(highest_bandwidth, scale)
    let round_lowest_bandwidth  = roundDown(lowest_bandwidth, scale)

    let highest_co2             = (highest_bandwidth/b_to_gb) * avg_mix
    let lowest_co2              = 0 

    let round_highest_co2       = roundUp(highest_co2, 1)
    let round_lowest_co2        = roundDown(lowest_co2, 1)

    let steps_co2               = graphic_steps(round_lowest_co2, round_highest_co2);              
    let steps_bandwidth         = graphic_steps(round_lowest_bandwidth, round_highest_bandwidth);   
    let row_nb                  = 0;


    // define bandwidth scale (mb or gb?) (input -> bytes)
    let bandwidth_unit = 1000000 //mb
    document.querySelector('.bandwidth-unit').textContent = '(mb)';

    if (highest_bandwidth >= 1000000000) {
        bandwidth_unit = 1000000000 //gb
        document.querySelector('.bandwidth-unit').textContent = '(gb)';
    }


    // define co2eq scale (gr or kg)
    let co2_unit = 1 //gr
    document.querySelector('.co2-unit').textContent = '(gr)';

    if (highest_co2 >= 1000) {
        bandwidth_unit = 1000 //kg
        document.querySelector('.co2-unit').textContent = '(kg)';
    }

    document.querySelectorAll('.col-sticky .row').forEach(row => {
        row.querySelector('.row-co2').textContent = format_nb(steps_co2[row_nb] / co2_unit, 3)
        row.querySelector('.row-bandwidth').textContent = format_nb(steps_bandwidth[row_nb] / bandwidth_unit, 3)
        row_nb++;
    });


    //fill populate with empty cols aswell
    let filled_cols     = to_display.monthly.slice()

    col_amount          = to_display.period
    
    filled_cols         = filled_cols.sort()
    let cols            = []

    if (col_amount == 12) {
        for (let fill = 0; fill < col_amount; fill++) {
            if (filled_cols[fill] != undefined) {
                let split = filled_cols[fill][0].split('-')
                let mm = Number(split[1])
                if (mm == fill+1) {
                    let item = filled_cols[fill]
                    item[0] = mm
                    cols.push(item)
                }
            }
            else {                
                cols.push([fill+1, 0, 0, 0])
            }
        }
    }
    else{
        cols = filled_cols.slice()
    }


    let ratio                                                       =  16 * 16 / 100
    monitored_container.querySelector('.graphic-data').innerHTML    = ''

    cols.forEach(col => {
        let col_str       = document.querySelector('.template_day').content.cloneNode(true);

        //get size mb
        let mb_bottom     = (100 / round_highest_bandwidth * col[1]) * ratio
        let mb_up         = (100 / round_highest_bandwidth * (col[1] + col[2])) * ratio
        let mb_h          = mb_up - mb_bottom

        if (mb_h == 0) {
            mb_h = 5
        }

        let mb_style = 'height: ' + (mb_h) + 'px; bottom:' + mb_bottom + 'px'
        col_str.querySelector('.col-item-graphic-bandwidth').setAttribute('style', mb_style)


        //get size co2
        let co2_min        = (col[1] / b_to_gb) * avg_mix
        let co2_max        = ((col[1] + col[2]) / b_to_gb) * avg_mix 
        
        let co2_bottom     = (100 / round_highest_co2 * co2_min) * ratio
        let co2_up         = (100 / round_highest_co2 * co2_max) * ratio
        let co2_h          = co2_up - co2_bottom

        if (co2_h == 0) {
            co2_h = 5
        }

        let co2_style = 'height: ' + (co2_h) + 'px; bottom:' + co2_bottom + 'px'
        col_str.querySelector('.col-item-graphic-co2').setAttribute('style', co2_style)
        
        col_str.querySelector('.col-item-graphic').setAttribute('data-min', col[1])
        col_str.querySelector('.col-item-graphic').setAttribute('data-max', col[1] + col[2])

        col_str.querySelector('.col-item-number').textContent = col[0]
        col_str.querySelector('.col-item-visits').textContent = col[3]

        monitored_container.querySelector('.graphic-data').appendChild(col_str)
    });

    document.querySelector('.col-item-number').textContent = 'Month'

}

function merge_data_months(dt) {
    data_visits                 = 0
    data_bandwidth_usage        = 0
    data_bandwidth_usage_high   = 0
    data_energy_mix             = 0
    data_energy_fossil_free     = 0

    let distribution_pages      = []
    let distribution_data       = []

    let months                  = []

    let arr_length = dt.length

    let data_period = 12
    if (arr_length > 12) {
        data_period = arr_length
    }

    dt.forEach(element => {

        data_visits             += element.views
        data_bandwidth_usage    += element.min_bandwidth
        data_energy_mix         += element.mix

        let min = 0
        let max = 0
        let v = 0 

        element.daily.forEach(month => {
            min += Number(month[1])
            max += Number(month[2])
            v += Number(month[3])
        })
        let entry = [element.period, min, max, v]
        months.push(entry)

        element.distribution.forEach(page => {

            let key = page[0]
            let value = [page[1], page[2]]

            if(distribution_pages.includes(key)){
                
                let index   = distribution_pages.indexOf(key)
                let dest    = distribution_data[index]

                let new_entry = [
                    Number(dest[0]) + Number(page[1]), 
                    Number(dest[1]) + Number(page[2])
                ]
                distribution_data[index] = new_entry;
            } 
            else {
                distribution_pages.push(key)
                distribution_data.push(value)
            }
        });

    });


    let to_display = {
        period: data_period,
        views : data_visits,
        bandwidth : data_bandwidth_usage,
        mix: data_energy_mix / arr_length,
        distribution: [distribution_pages, distribution_data],
        monthly: months
    }

    return to_display 
}


//=============================================================================
//=============================================================================
// Utilitaries ================================================================

// define the number scale to be displayed 
// on the left side of the graphic.
function graphic_steps(min, max){
    let steps_between = 3
    let steps = [max]
    
    for (let index = 1; index <= steps_between; index++) {
        let value = ((max - min) / (steps_between+1) * index) + min
        steps.push(value)
    }

    steps.sort(function(a, b){return b - a});
    return steps;
}

// returns round up values, possibility to add decimals
// only used within format_nb
function round(value, decimals) {
    return Number(Math.ceil(value+'e'+decimals)+'e-'+decimals);
}

// returns clean numbers as string -> 1000000 becomes 1'000'000
function format_nb(x, d) {
    x = round(x, d);
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1'$2");
    return x;
}

// returns a distance in kilometers for equivalences sections
function distance_equivalence(footprint, kg_emission){
    let emission_per_km     = kg_emission * 1000
    let unit                = ' kilometer'
    let distance            = format_nb(1 / emission_per_km * footprint, 1) 

    if (1 / emission_per_km * footprint > 2) {
        unit = ' kilometers'
    }

    distance = distance + unit;
    return distance
}

// returns a number of bees for equivalences sections
function bees_equivalence(footprint){
    let bee_weight_gr       = 0.11
    let total               = format_nb(footprint / bee_weight_gr, 0)
    return total
}

// returns the time it would take to an oak to absorp it.
function tree_equivalence(footprint){
    let oak_absorbtion      = 18.87 * 1000 //gr per year https://www.fortomorrow.eu/en/blog/co2-tree
    let unit                = ' year'
    let time                = format_nb(1 / oak_absorbtion * footprint, 2)

    if (1 / oak_absorbtion * footprint > 2) {
        unit = ' years'
    }

    time = time + unit;
    return time;
}

// returns the number of days of a specific month (including leap year)
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

function roundUp(num, sc) {
    let scale = Math.pow(10, sc) * 0.1
    return Math.ceil(num / scale) * scale;
}

function roundDown(num, sc) {
    let scale = Math.pow(10, sc) * 0.1
    return Math.floor(num / scale) * scale;
}

// Adds an option to the year selection input.
function addyear(yyyy){
    let option = document.createElement("option");
    option.text = yyyy;
    year_selector.add(option);
}

// just makes sure that the compiled data are all to zero/empty before
// loading a new time period.
function reset_parsing() {
    days                        = []
    days_keys                   = []
    url_keys                    = []
    pages                       = []

    data_visits                 = 0
    data_bandwidth_usage        = 0
    data_bandwidth_usage_high   = 0
    data_energy_usage           = 0
    data_energy_usage_high      = 0
    data_co2e                   = 0
    data_co2e_high              = 0
    data_energy_mix             = 0
    data_energy_fossil_free     = 0
}

//=============================================================================
//=============================================================================
// UI Related =================================================================
function toggleAccordion(el, event){
    if (event.target.nodeName == 'H4' || event.target.nodeName == 'DIV') {
        el.classList.toggle('open');

        let parent  = el.parentNode
        let h       = el.querySelector('.accordion-content').getBoundingClientRect().height
        let ph       = el.getBoundingClientRect().height

        if (el.getAttribute('style') == false ||
            el.getAttribute('style') == undefined) {
                el.setAttribute('style', 'height:' + (h + ph + 32) + 'px')
        } 
        else {
            el.removeAttribute('style')
        }
    }
}

// Adapt the UI depending on the options month/year/alltime 
// Choosing the option "all time" instantly loads everything.
function timeselect(el){
    let radio = el.querySelector('input[name="time"]:checked').id;
    
    if (radio == 'year') {
        year_selector.classList.remove('hide')        
        year_selector.querySelector('option[value="empty"]').removeAttribute('hidden')
        year_selector.value = 'empty'

        month_selector.classList.add('hide')

        apply.classList.remove('hidden')
        apply.setAttribute('disabled', 'disabled')
    } 
    else if(radio == 'month') {
        year_selector.classList.remove('hide')
        year_selector.querySelector('option[value="empty"]').removeAttribute('hidden')
        year_selector.value = 'empty'
        
        month_selector.classList.remove('hide') 
        month_selector.querySelector('option[value="empty"]').removeAttribute('hidden')
        month_selector.value = 'empty'

        apply.classList.remove('hidden')
        apply.setAttribute('disabled', 'disabled')
    }
    else {
        year_selector.classList.add('hide')
        month_selector.classList.add('hide')

        apply.setAttribute('disabled', 'disabled')
        apply.classList.add('hidden')

        load_logs();
    }
}

function reset_accordion(){
    document.querySelectorAll('.accordion').forEach(function(el){
        el.classList.remove('open')
        el.removeAttribute('style')
	})
}

window.onresize = function(){
  clearTimeout(resize_ended);
  resize_ended = setTimeout(reset_accordion, 50);
};

// when selecting a new year, the month selection needs to be updated as well
function updateMonthsAvailable(el) {
    let radio   = document.querySelector('.time_selector input[name="time"]:checked').id;
    let ys      = document.querySelector('#year-selector')
    let ms      = document.querySelector('#month-selector')

    year_selector.querySelector('option[value="empty"]').setAttribute('hidden', 'hidden')

    if (radio == 'month') {
        let yyyy = el.value
        select_year(yyyy)
        month_selector.querySelector('option[value="empty"]').removeAttribute('hidden')
        month_selector.value = 'empty'
    } 

    check_selection();
}

// removes the empty value when selecting a month
function removeEmptyMonth(){
    if (month_selector.value != 'empty'){
        month_selector.querySelector('option[value="empty"]').setAttribute('hidden', 'hidden')
    }

    check_selection();
}

// manual refresh, remove current period from localstorage and load newest data available
function refresh_data() {
    let last = log_files[log_files.length-1];
    
    localStorage.removeItem(last);

    let parts               = last.split('-')
    year_selector.value     = Number(parts[0])
    month_selector.value    = month_selector.querySelector('option[data-month="'+Number(parts[1])+'"]').getAttribute('value');
    refresh                 = true;

    window.scrollTo(0,0);
    load_logs(true);
    document.querySelector('.lowwwimpact_banner.refresh').classList.add('active')
    document.querySelector('.lowwwimpact main').classList.add('loading')
}

function colhover(el) {
    let min = el.querySelector('.col-item-graphic').getAttribute('data-min') / 1000000 //bytes
    let max = el.querySelector('.col-item-graphic').getAttribute('data-max') / 1000000 //bytes
    let unit_b = 'mb'

    let co2_min = (min / 1000) * avg_mix //gr
    let co2_max = (max / 1000) * avg_mix //gr
    let unit_c = 'gr'

    //scale
    if (max >= 1000) {
        max = max / 1000
        min = min / 1000
        unit_b = 'gb'
    }

    if (co2_max >= 1000) {
        co2_max = co2_max / 1000
        co2_min = co2_min / 1000
        unit_c = 'kg'
    }

    //format
    min = format_nb(min, 2)
    max = format_nb(max, 2)
    co2_min = format_nb(co2_min, 2)
    co2_max = format_nb(co2_max, 2)

    let b = min + ' - ' + max + unit_b

    if(min == max){
        b = max + unit_b
    }

    let c = co2_min + ' - ' + co2_max + unit_c

    if (co2_max == co2_min) {
        c = co2_max + unit_c
    }

    let hover_data = 'Bandwidth: ' + b + '\n' + 'CO2eq: ' + c
    el.setAttribute('data-hover', hover_data)
}


//=============================================================================
//=============================================================================
// Execute File ===============================================================
document.addEventListener('DOMContentLoaded', init_lowwwimpact, false);
