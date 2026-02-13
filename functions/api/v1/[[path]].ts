const POSTHOG_ORIGIN = "https://app.posthog.com";
const PATH_PREFIX = "/api/v1";

export const onRequest = async ({ request }: { request: Request }) => {
  try {
    const url = new URL(request.url);
    const upstreamPath = url.pathname.startsWith(PATH_PREFIX)
      ? url.pathname.slice(PATH_PREFIX.length) || "/"
      : url.pathname;
    const target = new URL(upstreamPath + url.search, POSTHOG_ORIGIN);

    const headers = new Headers(request.headers);
    headers.delete("cookie");
    headers.delete("authorization");
    headers.set("host", target.hostname);

    const isBodyAllowed = !["GET", "HEAD"].includes(request.method);
    const proxyRequest = new Request(target, {
      method: request.method,
      headers,
      body: isBodyAllowed ? request.body : undefined,
    });

    return await fetch(proxyRequest);
  } catch (error) {
    console.error("PostHog proxy error", {
      method: request.method,
      url: request.url,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response("Bad Gateway", { status: 502 });
  }
};
