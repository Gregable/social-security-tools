// Only load Google Analytics code if the site is being accessed at
// https://socialsecurity.tools/ 
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
//    to the socialsecurity.tools domain (ie: first-party cookies).
//    See: https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage
if (document.location.hostname.search('socialsecurity.tools') !== -1) {
  // Google Analytics Code.
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
  window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};

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
}
