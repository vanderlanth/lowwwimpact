# Lowwwimpact.stats
## An open-source carbon footprint analytics tool (or tracker, or something like that) for your website.

---

### Demo
🔗 [Tracker](https://stats.lowwwimpact.com/)
🔗 [Dashboard](https://stats.lowwwimpact.com/lowwwimpact)

### Disclaimer
I’m not a dev but I know enough to come up with a prototype like this one. If there is a dev out there willing to improve it, or to collaborate, [hit me up](mailto:ciao@vanderlanth).

### How it works
This tool relies on 3 API’s:
- JS Performance API to track the bandwidth usage
- IPinfo to check the visitor country code (free up to 50k requests per month)
- ElectricityMaps to get carbon intensity of electricity based on the visitor location (free tier available for non-commercial projects)

Then using the same methodology proposed by the SWD it is possible to estimate the carbon footprint impact of your website.

Although the code is not the best you will ever see (cf. disclaimer up top) I tried limit the amount of computations using by caching data on the local storage and directly on the server

### Is it this code safe ?
Within the limits of my knowledge I tried to make it safe. The data send to the server is always sanitized and escaped.  Please ensure that you have a secure server installation (with DDOS protection) if you intend to use it. I do not take any responsibility in case of trouble.

### Setup
1. Get an API key from [IPinfo](https://ipinfo.io/) which you will put in the file **lowwimpact_stats/ipinfo.php**
2. To do the same with [Electricity Maps](https://app.electricitymaps.com/). Place your API key in **lowwimpact_stats/electricityMaps.php**
3. You will need to load the tracking script in every page you want to track. Add the following line at the end of the head tag:

 ``<script src="js/dist/lowwwimpact_tracker.js"></script> ``

4. In **lowwwimpact_stats/config.json** there are a few parameters you can fill.
	- **project_name** seems quite self-explenatory.
	- **site_url** as well.
	- **is_green_hosted** : you can check if your website is green-hosted from the [Green Web Foundation website](https://www.thegreenwebfoundation.org/).
	- **installed_on** : helps to limit the computation when loading the log files in the dashboard. If you first tracked your website impact in June 2024, just write 2024-06 (always use the format YYYY-MM)

If installed correctly, the plugin will automatically log every page view. But since users scroll and more contents get loaded after the DOM is ready, the plugin has few specifics features.

### Lazy loaded images
The function  ``onload="lowww(this)"``  will trigger the tracker. It's important to use width and height attributes as it helps the browser when to load the asset.

```html
    <picture>
      <source srcset="img.webp">
      <img src="img.png" loading="lazy" onload="lowww(this)">
    </picture>
```

### HTML5 Video & Audio
Like for the lazy images, the function ``onload="lowww(this)"`` will trigger the tracker. To reduce your wbesite impact, you should avoid preloading content whenever you can.

```html
    <video loop controls webkit-playsinline playsinline preload="none" onplay="lowww(this)">
      <source src="720.webm" type="video/webm">
      <source src="480.mp4" type="video/mp4">
    </video>

    <audio controls preload="none" onplay="lowww(this)">
      <source src="audio.mp3" type="audio/mpeg">
    </audio>
```

### Video.js
If you use video.js plugin, the tracking would work the same as HTML5 Video.

```html
    <video class="video-js" controls preload="none" width="1280" height="720" data-setup="{}" onplay="lowww(this)"">
      <source src="720.webm" type="video/webm">
      <source src="480.mp4" type="video/mp4">
    </video>
```

### On-demand embedded content · Experimental and not precise
Using the function ``lowww_custom`` on click with the attribute ``data-lowww`` which should contain a manually estimated kb size, it is possible to roughly track external content bandwidth usage and impact. The function ``lowww_custom`` can load on demand an external content such as a Youtube video is the example below.

```html
    <div id="player-container">
      <button name="iframe-loading" id="player" data-lowww="25000" onclick="lowww_custom(this)">Load me</button>
    </div>
```

In **lowwwimpact_stats/lowwwimpact_tracker.js**
```javascript
     function lowww_custom(element) {
      //Update tracking
      let estimated_size = Number(element.getAttribute('data-lowww')) * 1000;
      bytes = bytes + estimated_size;
      carbon_rating();
      //console.log(bytes);
    
      //Load external content
      let code = '<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/hswqVIDA_Kc?si=nvTs1rX3tOblMndC&autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
      '
      element.parentNode.innerHTML= code
    }
```

### Auto-loading embedded content · Experimental and not precise
Recommendation: for a lower impact, avoid loading external content. If you do, then you should avoid to preload it. This tool is unable to track external requests so if you have to preload external content like a youtube video or a calendly embed (like in the example below), add the class ``lowww_auto`` to the embed with the attribute ``data-lowww`` which should contain a manually estimated kb size.

```html
   <div class="lowww_auto calendly-inline-widget" data-lowww="2500" data-url="https://calendly.com/lowwwimpact"></div>
    <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

### Known limitations
- Embedding content such as CDN-Served images, Youtube videos or a Calendly will not work consistently.
- Audio and video content might are sometimes delayed in the tracking depending on the browser/device/hosting services.
- If the APIs do not manage to retrieve the necessary variables (Country Code and Energy Mix) to measure the impact of a session, then default values are applied.
- There is not yet a strong consensus on how much energy use a gigabyte of data, depending on the model used it can vary from 1.8 kWh/gb to 0.06 kWh/gb. For this prototype, this is value is equal to 0.194 kWh/gb according to the Sustainable Web Design [V3 model for operationnal emissions](https://sustainablewebdesign.org/estimating-digital-emissions/). Here’s another article if you want to learn more aout [internet energy consumption](https://www.wholegraindigital.com/blog/website-energy-consumption/) and digital footprint calculators limitations.

### Should you use it ? 
If you aim to simply get know you site impact, calculators such as websitecarbon.com are sufficient for this usage. Analytics tools use energy and store data more than necessary. If you are not aiming to use it to improve it or to reduce and offset the incompressible emission of your website, then maybe this tool is not made for you as to track your website sustainability progression.

### Ideas to make it better
- Graphic responsiveness.
- Add fossil/clean energies ratio
- Improve javascript globally (less lines, less computations)
- Make a visual graphic for the pages impact distribution
- Include the embodied emissions with visualisations of the different segments.
- Make a version which does not require prepros.app to work.

### Support open-source
Lowwwimpact is a solo-project by Nicolas Lanthemann during his free time. The code of this tool is accessible on Github, alongside a list of ideas to improve it.

This analytic tool is free. However, if it is beneficial for a commercial project of yours, I'd greatly appreciate if you consider supporting this lowwwimpact. If my work has helped you profit, then I believe it's reasonable to ask for a token of appreciation in return, don't you agree?

[Support Open Source](https://buymeacoffee.com/lowwwimpact) ☕️

