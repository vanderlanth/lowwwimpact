let code, intensity, power
let loggin
let bytes               = 0
let bytes_high          = 0
let paths               = []
let lowwwimpact_saved   = false
let page                = window.location.pathname
let last                = null
let timestamp           = Date.now()

localStorage.clear()

function lowww(element) {
  switch (element.nodeName) {
    case 'IMG':
      lowww_image(element)
      break;
    case 'VIDEO':
      lowww_media(element)
      break;
    case 'AUDIO':
      lowww_media(element)
      break;
    default:
      break;
  }
}

//Listen bandwidth =========================================================================================
document.addEventListener('DOMContentLoaded', function(){
  lowwwimpact()
}, false);

window.onload = (event) => {
  lowww_network();
};

function lowwwimpact() {
  lowww_network();

  //add autoloaded event - Experimental
  document.querySelectorAll('.lowww_auto').forEach((element) => {
    let estimated_size = Number(element.getAttribute('data-lowww')) * 1000;
    bytes = bytes + estimated_size;
  })
}

function lowww_network() {
  let list = performance.getEntries()

  for (let i=0; i < list.length; i++) {

    let path = list[i].name;

    if (!paths.includes(path)) {
      paths.push(path);
      if ("transferSize" in list[i]){
        bytes = bytes + list[i].transferSize;
        if (intensity != undefined) {
          carbon_rating();
        }
      }
    }
  }
  performance.clearResourceTimings();
}

//Lazyload images===========================================================================================
function lowww_image(element){
  if (typeof element.currentSrc === "undefined"){
    lowwwimpact_getsize(element.src);
  } else {
    lowwwimpact_getsize(element.currentSrc);
  }
}

//Lazyload other medias=====================================================================================
function lowww_media(element){

  element.removeAttribute('onplay')

  let media;

  if (typeof element.currentSrc === "undefined"){
    media = element.src;
  } else {
    media = element.currentSrc;
  }

  let url_strip = window.location.href
  let file = media.replace(url_strip, '')


  fetch('lowwwimpact_stats/getMediaSize.php?url='+file)
  .then(function(response) {
    return response.json();
  })
  .then(function(size) {
    bytes_high = bytes_high + size;
    if (intensity != undefined) {
      carbon_rating();
    }
  });
}

//Custom Loading - Experimental=============================================================================
function lowww_custom(element) {

  //update tracking
  let estimated_size = Number(element.getAttribute('data-lowww')) * 1000;
  bytes_high = bytes_high + estimated_size;
  if (intensity != undefined) {
    carbon_rating();
  }

  //ADD CUSTOM CONTENT
  let code = '<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/hswqVIDA_Kc?si=nvTs1rX3tOblMndC&autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
  element.parentNode.innerHTML= code

}

function lowwwimpact_getsize(path){
  if (!paths.includes(path)) {

    let size = performance.getEntriesByName(path)[0];
    bytes = bytes + size.transferSize;
    if (intensity != undefined) {
      carbon_rating();
    }

    paths.push(path);
  }
}

//get ipinfo================================================================================================
if (localStorage.getItem('lowwwimpact') != undefined) {

  let ls = localStorage.getItem('lowwwimpact').split(',');
  let delay = ls[3];
  let now = new Date(Date.now());

  if (Date.parse(delay) > Date.parse(now)) {
    code = ls[0]
    power = ls[1]
    intensity = ls[2]
  } else {
    ipinfo();
  }

} 
else {
  ipinfo();
}

async function ipinfo() {

  fetch('./lowwwimpact_stats/ipinfo.php')
  .then(function(response) {
    return response.json();
  })
  .then(function(data_code) {

    code = data_code;

    if (data_code != 'default') {
      getZonePower();
      getZoneIntensity();
    }
    else {
      intensity = 481 // https://ourworldindata.org/grapher/carbon-intensity-electricity?tab=table&showSelectionOnlyInTable=1
      power     = 30  // https://ourworldindata.org/grapher/per-capita-electricity-fossil-nuclear-renewables?country=OWID_WRL~CHN~IND~USA~GBR~FRA~AUS~SWE~ZAF~JPN~BRA
    }

    let interval = setInterval(function () {
      if (power != null && intensity != null) {
        let delay = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        let visit = [code, power, intensity, delay];

        localStorage.setItem('lowwwimpact', visit);

        clearInterval(interval)
      }
    }, 100)
    
  });
 
}

//get electricitymaps=======================================================================================
async function getZonePower() {
  let url = 'power-breakdown/latest?zone=' + code;

  fetch('./lowwwimpact_stats/electricityMaps.php?url='+url)
  .then(function(response) {
    return response.json();
  })
  .then(function(data_power) {
    power = data_power
  });
}

async function getZoneIntensity() {
  let url = 'carbon-intensity/latest?zone=' + code;

  fetch('./lowwwimpact_stats/electricityMaps.php?url='+url)
  .then(function(response) {
    return response.json();
  })
  .then(function(data_intensity) {
    intensity = data_intensity
    carbon_rating()
  });

}

//log file==================================================================================================
let logVisit = function() {
  if (!navigator.sendBeacon) return true;

  loggin      = timestamp + ', ' + page + ', ' + code + ', ' + power + ', ' + intensity + ', ' + bytes + ', ' + bytes_high;

  if (loggin != last && bytes != bytes_high) {
    let url     = './lowwwimpact_stats/logs.php?url=TRUE';
    const blob  = new Blob([JSON.stringify(loggin)], { type: 'application/json' });
    navigator.sendBeacon(url, blob);
  
    bytes = 0
    bytes_high = 0

    last = loggin
  }

};

window.addEventListener('visibilitychange', function () {
  if (document.visibilityState == 'hidden' ) {
    logVisit()
  }
})



//update badge===============================================================================================
let ratings_co2 = {
  'F': 0.847,
  'E': 0.846,
  'D': 0.656,
  'C': 0.493,
  'B': 0.341,
  'A': 0.186,
  'A+': 0.095,
}

function carbon_rating(){

  let gb          = ((bytes + bytes_high) / 1000000000) 

  //operationnal energy use (kWh/gb)
  let kwh_dt      = 0.055
  let kwh_network = 0.059
  let kwh_device  = 0.08
  let kwh_per_gb  = kwh_dt + kwh_network + kwh_device // operationnal

  //carbon intensity (co2/kWh)
  let intensity_default           = 494
  let intensity_greenhosted       = 50
  let intensity_datacenters       = intensity_greenhosted //switch with default if based on hosting, valid only for non-embedded data.
  
  //carbon footprint per segment
  let segment_devices             = gb * kwh_device * intensity
  let segment_centers             = gb * kwh_dt * intensity_datacenters
  let segment_networks            = gb * kwh_network * intensity_default

  let co2_gr                      = segment_centers + segment_devices + segment_networks
  let co2_display                 = format_nb(co2_gr, 2)

  let rating
  
  for (const [key, value] of Object.entries(ratings_co2)) {
    if (co2_gr <= value) {
      rating = key
    } 
    else if (co2_gr >= 0.847) {
      rating = 'F'
    }
  }

  document.querySelector('.lowww_ecoscore').textContent = rating
  document.querySelector('.lowww_co2').textContent = co2_display

}

function format_nb(x, d) {
  x = round(x, d);
  x = x.toString();
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
      x = x.replace(pattern, "$1'$2");
  return x;
}

function round(value, decimals) {
  return Number(Math.ceil(value+'e'+decimals)+'e-'+decimals);
}

