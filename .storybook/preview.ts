import type { Preview } from "@storybook/svelte";

// Mock Treasury API responses to prevent visual churn in Chromatic
// The real API returns varying rates over time, so we fix it at 2.50% for consistent snapshots
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input.toString();

  // Mock Treasury Department API - return XML with fixed 2.50% rate
  if (url.includes("home.treasury.gov") && url.includes("daily_treasury_real_yield_curve")) {
    const mockXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <content type="application/xml">
      <m:properties xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices">
        <d:NEW_DATE>2025-01-15T00:00:00</d:NEW_DATE>
        <d:TC_20YEAR>2.50</d:TC_20YEAR>
      </m:properties>
    </content>
  </entry>
</feed>`;
    return new Response(mockXml, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  // Mock FRED API - return CSV with fixed 2.50% rate
  if (url.includes("fred.stlouisfed.org") && url.includes("DFII20")) {
    const mockCsv = `DATE,DFII20\n2025-01-15,2.50`;
    return new Response(mockCsv, {
      status: 200,
      headers: { "Content-Type": "text/csv" },
    });
  }

  // Pass through all other requests
  return originalFetch(input, init);
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: {
        small: {
          name: "Small (< 675px)",
          styles: { width: "640px", height: "900px" },
        },
        medium: {
          name: "Medium (675-1024px)",
          styles: { width: "900px", height: "900px" },
        },
        large: {
          name: "Large (> 1024px)",
          styles: { width: "1280px", height: "900px" },
        },
      },
    },
  },
};

export default preview;
