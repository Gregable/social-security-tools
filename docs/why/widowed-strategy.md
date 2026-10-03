# Why /strategy has a widowed mode

## The gap

A widow or widower who used `/strategy` had two wrong options. "Just me"
models only their own retirement benefit, so it never considers the survivor
benefit, which is often the larger one. Couple mode builds a death
distribution for both people from today, so it cannot represent a spouse who
has already died, and it starts any survivor benefit automatically instead of
treating its start date as a choice.

The widow(er)'s real decision is two start dates on one life: when to start
the survivor benefit (as early as 60) and when to start their own retirement
benefit (62 to 70). Survivor benefits are exempt from deemed filing, so one
can start first and the other later. The best plan is usually "survivor
first, switch to own at 70" or "own first, switch to survivor at survivor
full retirement age", and which one depends on the amounts and on how long
the person lives.

## The rules

Each rule was checked against POMS, the CFR, or the Act; the sources sit
next to the code that applies them.

- The survivor benefit starts from 100% of the late spouse's PIA, or from
  their benefit with delayed credits if they claimed, or died, after full
  retirement age.
- Claimed before survivor full retirement age, it is reduced linearly to
  71.5% at 60. Survivor full retirement age has its own table.
- If the late spouse claimed early, the reduced amount is then capped at the
  larger of their reduced benefit and 82.5% of their PIA (the widow(er)'s
  limit, or RIB-LIM). The cap applies after the age reduction, so the
  benefit stops growing before survivor full retirement age, and waiting
  past that point gains nothing.
- Once both benefits are being paid, SSA pays the larger.
- An application covers both benefits unless it is restricted, so the page
  tells people to restrict it.

The code used to apply the age reduction to the capped amount. That
understated every survivor benefit claimed early after an early claim by the
late spouse, in couple mode too, so the formula was fixed everywhere it
lived.

## Design choices

- **A third mode, not an option on single mode.** The inputs (a death month,
  what the late spouse had claimed) and the results (two start dates) differ
  enough that folding them into either existing mode would have made both
  harder to follow.
- **PIA as the input for the late spouse.** It is the figure SSA works from.
  Widows often know what their spouse was paid instead, but converting that
  back would mix in COLAs from different years.
- **Exact search, cheap evaluation.** Each plan pays at most three constant
  amounts in turn, so its value is a few prefix-sum lookups. Every pair of
  start dates is evaluated for each death age and for the expected value,
  which takes about a tenth of a second even for a survivor decades from 60.
  The monthly amounts come from the same functions the payment timeline
  uses, and tests compare the fast values with the slow ones.
- **Same discounting as the other modes.** Widowed figures use the
  optimizer's existing payment timing, so they are comparable with single
  and couple results for the same benefits.
- **"Not needed" instead of a tie-break date.** Many plans pay identical
  streams, for example any survivor start once a larger own benefit is being
  paid. Rather than show whichever date the search happened to keep, the
  page says the benefit is not needed.

## Limits

Remarriage before 60, a child in the survivor's care, the family maximum,
and disabled widow(er)s under 60 change the rules and are not modeled; the
form says so. A spouse who died before 62 may have a higher PIA for
survivors under "widow(er)'s indexing"; the form asks for SSA's figure. As
elsewhere in the optimizer, retroactive months are not valued, so they shape
only the "ask SSA to backdate" advice.
