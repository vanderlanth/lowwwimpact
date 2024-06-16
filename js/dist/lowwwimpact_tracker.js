let code,intensity,power,loggin,bytes=0,bytes_high=0,paths=[],lowwwimpact_saved=!1,page=window.location.pathname,last=null,timestamp=Date.now();function lowww(t){switch(t.nodeName){case"IMG":lowww_image(t);break;case"VIDEO":case"AUDIO":lowww_media(t)}}function lowwwimpact(){lowww_network(),document.querySelectorAll(".lowww_auto").forEach((t=>{let e=1e3*Number(t.getAttribute("data-lowww"));bytes+=e}))}function lowww_network(){let t=performance.getEntries();for(let e=0;e<t.length;e++){let n=t[e].name;paths.includes(n)||(paths.push(n),"transferSize"in t[e]&&(bytes+=t[e].transferSize,null!=intensity&&carbon_rating()))}performance.clearResourceTimings()}function lowww_image(t){void 0===t.currentSrc?lowwwimpact_getsize(t.src):lowwwimpact_getsize(t.currentSrc)}function lowww_media(t){let e;t.removeAttribute("onplay"),e=void 0===t.currentSrc?t.src:t.currentSrc;let n=window.location.href,o=e.replace(n,"");fetch("lowwwimpact_stats/getMediaSize.php?url="+o).then((function(t){return t.json()})).then((function(t){bytes_high+=t,null!=intensity&&carbon_rating()}))}function lowww_custom(t){let e=1e3*Number(t.getAttribute("data-lowww"));bytes_high+=e,null!=intensity&&carbon_rating();t.parentNode.innerHTML='<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/hswqVIDA_Kc?si=nvTs1rX3tOblMndC&autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'}function lowwwimpact_getsize(t){if(!paths.includes(t)){let e=performance.getEntriesByName(t)[0];bytes+=e.transferSize,null!=intensity&&carbon_rating(),paths.push(t)}}if(localStorage.clear(),document.addEventListener("DOMContentLoaded",(function(){lowwwimpact()}),!1),window.onload=t=>{lowww_network()},null!=localStorage.getItem("lowwwimpact")){let t=localStorage.getItem("lowwwimpact").split(","),e=t[3],n=new Date(Date.now());Date.parse(e)>Date.parse(n)?(code=t[0],power=t[1],intensity=t[2]):ipinfo()}else ipinfo();async function ipinfo(){fetch("./lowwwimpact_stats/ipinfo.php").then((function(t){return t.json()})).then((function(t){code=t,"default"!=t?(getZonePower(),getZoneIntensity()):(intensity=481,power=30);let e=setInterval((function(){if(null!=power&&null!=intensity){let t=new Date(Date.now()+6048e5),n=[code,power,intensity,t];localStorage.setItem("lowwwimpact",n),clearInterval(e)}}),100)}))}async function getZonePower(){fetch("./lowwwimpact_stats/electricityMaps.php?url="+("power-breakdown/latest?zone="+code)).then((function(t){return t.json()})).then((function(t){power=t}))}async function getZoneIntensity(){fetch("./lowwwimpact_stats/electricityMaps.php?url="+("carbon-intensity/latest?zone="+code)).then((function(t){return t.json()})).then((function(t){intensity=t,carbon_rating()}))}let logVisit=function(){if(!navigator.sendBeacon)return!0;if(loggin=timestamp+", "+page+", "+code+", "+power+", "+intensity+", "+bytes+", "+bytes_high,loggin!=last&&bytes!=bytes_high){let t="./lowwwimpact_stats/logs.php?url=TRUE";const e=new Blob([JSON.stringify(loggin)],{type:"application/json"});navigator.sendBeacon(t,e),bytes=0,bytes_high=0,last=loggin}};window.addEventListener("visibilitychange",(function(){"hidden"==document.visibilityState&&logVisit()}));let ratings_co2={F:.847,E:.846,D:.656,C:.493,B:.341,A:.186,"A+":.095};function carbon_rating(){let t,e=(bytes+bytes_high)/1e9,n=.055*e*50+.08*e*intensity+.059*e*494,o=format_nb(n,2);for(const[e,o]of Object.entries(ratings_co2))n<=o?t=e:n>=.847&&(t="F");document.querySelector(".lowww_ecoscore").textContent=t,document.querySelector(".lowww_co2").textContent=o}function format_nb(t,e){t=(t=round(t,e)).toString();for(var n=/(-?\d+)(\d{3})/;n.test(t);)t=t.replace(n,"$1'$2");return t}function round(t,e){return Number(Math.ceil(t+"e"+e)+"e-"+e)}
//# sourceMappingURL=lowwwimpact_tracker.js.map