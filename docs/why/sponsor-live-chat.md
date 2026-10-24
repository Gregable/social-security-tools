# Why the sponsor's live chat is a link, not a widget

## The request

The sponsor, Social Security Advisors, asked us to add their LiveChat
widget so readers could chat with an advisor instead of only booking a
call. The snippet they sent loads `cdn.livechatinc.com/tracking.js` into
every page.

## Why not the widget

A widget script runs in the same origin as the calculator. Once loaded, it
can read the page, including a pasted earnings record, a birthdate, and the
computed benefit. It also sets cookies and records the visit. That breaks
the promise in the privacy guide that a reader's data never leaves the
browser, and it is code we do not control running on every page.

## What we did instead

LiveChat also hosts a chat page for each account at
`https://direct.lc.chat/<license>/`. We link to it. The chat happens on
their domain, in a new tab, and nothing of theirs runs on ssa.tools.

The snippet's own fallback link, `livechat.com/chat-with/<license>/`, is not
a chat page: it redirects to LiveChat's "enable JavaScript" help article
even in a browser with JavaScript on. Use the `direct.lc.chat` link.

## Where it shows

Chat is a trial on the two busiest guides that already carry the sponsor
card: divorced spouse and spousal benefits. On those guides, the sponsor
card and the footer sponsor block show "Start a Live Chat" with the same
weight as "Schedule a Free Call". Every other placement is unchanged.

The card used to be one big link. Two real links cannot nest, so on trial
guides the card is a plain block. The Schedule link carries an invisible
overlay that covers the whole card, so a click anywhere still schedules as
before. The Chat link sits above that overlay.

## Measuring it

Clicks go through the usual "Outbound: Clicked" event. Chat clicks use the
placements `guide-inline-chat` and `guide-footer-chat`, beside the existing
`guide-inline` and `guide-footer` for scheduling. Both buttons share one
impression per card. Because the overlay counts clicks on the card body as
scheduling, schedule has the larger target, and a raw comparison slightly
favors it.
