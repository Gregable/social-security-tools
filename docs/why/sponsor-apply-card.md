# Why four guides carry a second sponsor card

## What we saw

Each sponsor guide shows the sponsor card once in the body, beside the
decision the guide is about, and once in the footer. Comparing card
impressions with guide page views from 2026-09-29 to 2026-11-16 showed how
few readers reach either one:

| Guide             | Device  | Saw the body card | Saw the footer |
| ----------------- | ------- | ----------------- | -------------- |
| divorced-spouse   | Desktop | 68%               | 14%            |
| divorced-spouse   | Mobile  | 51%               | 11%            |
| spousal-benefits  | Desktop | 73%               | 11%            |
| spousal-benefits  | Mobile  | 54%               | 7%             |
| survivor-benefits | Desktop | 69%               | 10%            |
| survivor-benefits | Mobile  | 52%               | 8%             |

The footer is nearly invisible, and the body card sits roughly 40% of the
way down. A reader who skips to "How to Apply" passes neither.

## What we did

Four guides get a second card directly above the section that tells the
reader how to act: "How to Apply" on divorced-spouse, spousal-benefits, and
survivor-benefits, and "What to Do Now" on retroactive-survivor-benefits.
That is where a reader has decided to claim, which is what the sponsor
sells help with.

Only these four, because they are where sponsor clicks come from. From
2026-09-07 to 2026-11-16 the first three produced about two thirds of
sponsor clicks across every placement on the site, and survivor cases
appear over-represented among the sponsor's sign-ups, though the sample is
small. A second ad on every guide would cost reader goodwill for clicks
that mostly are not there.

## The copy

The second card has its own pitch in each guide (`applySponsorCopy`). The
first card argues for getting advice before deciding; the second assumes
the decision is made and is about filing correctly. Showing the same card
twice would read as an ad repeated, not as a second, different offer.

On the two survivor guides the section below the card tells the reader to
call Social Security at once, because that call fixes the filing date. The
pitch must never read as a reason to delay that call, so its opening
sentence puts the call first. A bullet repeats it, but phones do not show
the bullets, so the sentence has to carry it alone.

## Measuring it

The second card reports as placement `guide-inline-apply`, and on the chat
trial guides its chat link as `guide-inline-apply-chat`. The first card
keeps `guide-inline`, so its click rate stays comparable with everything
measured before this change, including the chat trial baseline.

Judge the card on clicks per page view for the guide as a whole, not on its
own click rate alone: if it only moves clicks down the page from the first
card, it has added an ad and no value.

## Changing it

The four guides are listed in `guide-sponsor-copy-sync.test.ts`
(`APPLY_CARD_GUIDES`), which fails if a guide gains or loses the card
without the list changing. To remove the card from a guide, delete its
`<InlineCTA placement="guide-inline-apply" />` and `applySponsorCopy`, and
take the guide out of that list.

A sticky bar on phones was tried earlier and removed: four months at a 0.1%
click rate, as the most intrusive placement on the site.
