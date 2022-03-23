 // Web Vitals Module
import { getCLS, getFID, getLCP } from 'https://unpkg.com/web-vitals?module';

// Web Vitals Data Reporting
function sendToGoogleAnalytics({name, delta, id}) {
  // Assumes the global `ga()` function exists, see:
  // https://developers.google.com/analytics/devguides/collection/analyticsjs
  ga('send', 'event', {
    eventCategory: 'Web Vitals',
    eventAction: name,
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    eventLabel: id,
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    eventValue: Math.round(name === 'CLS' ? delta * 1000 : delta),
    // Use a non-interaction event to avoid affecting bounce rate.
    nonInteraction: true,
    // Use `sendBeacon()` if the browser supports it.
    transport: 'beacon',

    dimension1: String(isSXG),
    dimension2: document.referrer,
  });
}

// Only load Google Analytics code if the site is being accessed at
// https://socialsecurity.tools/ or https://ssa.tools/
//
// If the source code has been downloaded and run locally or from some other
// location, do not want to record anything. I encourage security-conscious
// folks with the technical ability to run this locally or even offline.
//
// Google Analytics is great for our security design because:
//  - It does not allow the site owner to access any Personally Identifiable
//    Information (PII) such as IP address.
//    See: https://support.google.com/analytics/answer/2795983
//  - Cookies are used to log repeat visits / stay time, but are scoped just
//    to the socialsecurity.tools or ssa.tools domain (ie: first-party cookies).
//    See: https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage
if (document.location.hostname.search('socialsecurity.tools') !== -1 ||
    document.location.hostname.search('ssa.tools') !== -1) {
  // Google Analytics Code.
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
  window.ga = window.ga || function () { (ga.q = ga.q || []).push(arguments) };

  getCLS(sendToGoogleAnalytics);
  getFID(sendToGoogleAnalytics);
  getLCP(sendToGoogleAnalytics);
} else {
  // Otherwise, register a window.ga dummy function.
  //
  // A few places in the code will send some very generic events for
  // non-user-data tracking. For example an simple event that indicates a
  // user entered data, to determine what kind of success rate users have
  // with the copy/paste functionality. None of these send any user-entered
  // data, such as an earnings value or user birthdate, however.
  //
  // We register a dummy function here so that these calls don't throw
  // exceptions.
  window.ga=function(){}
}

// https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference#cookieExpires
ga('create', 'UA-243468-11', 'auto', {
    // The default cookie expiration is 2 years. We don't want our cookies
    // around that long. We only want just long enough to see analytics on
    // repeat visits. Instead, limit to 31 days. Field is in seconds:
    // 31 * 24 * 60 * 60 = 2678400
    'cookieExpires': 2678400,
    // We don't need a cookie to track campaign information, so remove that
    // too.
    'storeGac': false});
// Anonymize the ip address of the user on the client side.
ga('set', 'anonymizeIp', true);
// Always send all data over SSL. Unnecessary, since the site only loads on
// SSL, but defense in depth.
ga('set', 'forceSSL', true);
// Beacon transport is slightly more efficient for the client.
ga('set', 'transport', 'beacon');
// Now, record 1 pageview event.
ga('send', 'pageview');

// We want to know if users print the page. This helps prioritize bugs related
// to print media formatting. If few users print the page, we shouldn't focus
// on this as much. This sets up a event triggered by a print media query match
// if the browser supports it (all modern browsers do).
if (window.matchMedia) {
  var mediaQueryList = window.matchMedia('print');
  mediaQueryList.addListener(function(mql) {
    if (!mql.matches)
      ga('send', 'event', 'PrintIntent', 'true');
  });
}
