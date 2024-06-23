import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  // Old calculator URL, redirect to root:
  if (event.url.pathname.startsWith("/calculator.html")) {
    return new Response(null, { status: 301, headers: { location: "/" } });
  }
  // Sponsor
  if (event.url.pathname.startsWith("/mint-mobile")) {
    return new Response(null, {
      status: 301,
      headers: { location: "http://fbuy.me/tqYrC" },
    });
  }

  const oldGuideUrl = /^\/guide\/(.*)\.html$/;
  let matches = event.url.pathname.match(oldGuideUrl);
  if (matches) {
    return new Response(null, {
      status: 301,
      headers: { location: `/guides/${matches[1]}/` },
    });
  }

  const response = await resolve(event);
  return response;
};
