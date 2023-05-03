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
//    See:
//   https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage


if (document.location.hostname.search('ssa.tools') !== -1 || true) {
  // Google Analytics Code.
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-N9W0Q9SQVP';
  script.async = true;
  document.head.appendChild(script);
}

window.dataLayer = window.dataLayer || [];
export function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());

gtag('config', 'G-N9W0Q9SQVP');
// https://developers.google.com/analytics/devguides/collection/ga4/reference/config
gtag('set', 'cookie_domain', 'ssa.tools');

// Disable advertising features:
gtag('set', 'allow_google_signals', true);

// The default cookie expiration is 2 years. We don't want our cookies
// around that long. We only want just long enough to see analytics on
// repeat visits. Instead, limit to 31 days. Field is in seconds:
// 31 * 24 * 60 * 60 = 2678400
gtag('set', 'cookie_expires', 2678400);

gtag('event', 'TestEvent', {});
