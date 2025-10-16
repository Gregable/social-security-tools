<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import EarlyFileImage from './early-file.png';
import EarlyFile100Image from './early-file-100.png';
import HeroImage from './hero.png';
import LateFileImage from './late-file.png';
import LateFile100Image from './late-file-100.png';

const title = 'Deep look at Spousal Benefits and Filing Dates';
const description =
  'Spousal Benefits are sometimes commonly misunderstood to be equal to ' +
  "half of the other spouse's benefit. This guide takes a deep dive into " +
  'how spousal benefits are calculated and how different filing dates can ' +
  'affect the final benefit calculation in confusing ways.';
const publishDate = new Date('2023-09-06T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/spousal-benefit-filing-date';
schema.title = title;
schema.image = HeroImage;
schema.datePublished = publishDate.toISOString();
schema.description = description; // Pass the description to the schema
schema.imageAlt =
  'Laptop with piggybank representing Social Security spousal benefits';
schema.tags = [
  'Spousal Benefits',
  'Social Security',
  'Filing Strategy',
  'Marriage',
];
</script>

<svelte:head>
  <meta name="description" content={description} />
  <title>
    {title} | SSA.tools
  </title>
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <div>
    <h1>{title}</h1>

    <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

    <figure class="hero-image">
      <img
        src={HeroImage}
        width="628"
        height="579"
        alt="Screenshot of benefit chart for two users, Alex and Chris. Both have filed for benefits at age 67. Alex's benefit is $1,000 / mo and Chris's benefit is $500 / mo."
      />
    </figure>

    <p>
      A spousal benefit is the benefit a person can receive based on their
      spouse's earning record.
    </p>
    <p>
      In the simplest case, this can be half of the spouse's own benefit. For
      example, if:
    </p>
    <ul>
      <li>Alex has a $1,000 / mo Primary Insurance Amount.</li>
      <li>Chris has no earnings.</li>
      <li>Alex and Chris both file for benefits at Normal Retirement Age.</li>
    </ul>

    <p>
      In this situation, Spouse B will receive a spousal benefit of $500 / mo.
    </p>

    <p>
      You can explore this example with <a
        href="https://ssa.tools/calculator#pia1=1000&dob1=1965-09-21&name1=Alex&pia2=0&dob2=1965-09-28&name2=Chris"
        >this link</a
      >.
    </p>

    <br class="clear" />

    <figure class="float-right">
      <img
        src={EarlyFileImage}
        width="636"
        height="575"
        alt="Screenshot of benefit chart for two users, Alex and Chris. Both have filed for benefits at age 62 and 1 month. Alex's benefit is $704 / mo and Chris's benefit is $345 / mo."
      />
    </figure>

    <h3>Early Filing</h3>

    <p>
      What would happen instead if Alex and Chris filed earlier than Normal
      Retirement Age, such as at age 62 and 1 month?
    </p>

    <p>
      In this case, Alex would receive a reduced benefit of $704 / mo, and Chris
      would receive a reduced spousal benefit of $345 / mo.
    </p>
    <p>
      No longer is Chris's benefit half of Alex's benefit. Alex's personal
      benefit is reduced by 6.67% for the first 3 years and 5% for each
      additional year filed early. Chris's Spousal benefit uses a different
      reduction formula: 8.33% for the first 3 years and 5% for each additional
      year filed early.
    </p>
    <p>
      There is a larger penalty for extra early filing for spousal benefits than
      for personal benefits.
    </p>
  </div>

  <br class="clear" />

  <figure class="float-right">
    <img
      src={LateFileImage}
      width="625"
      height="581"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Both have filed for benefits at age 67. Alex's benefit is $1,240 / mo and Chris's benefit is $500 / mo."
    />
  </figure>

  <h3>Late Filing</h3>

  <p>
    What would happen instead if Alex and Chris filed later than Normal
    Retirement Age, such as at age 70?
  </p>

  <p>
    In this case, Alex's benefit would be increased by 8% for each year filed
    late making the final benefit $1,240 / mo.
  </p>
  <p>
    Chris's spousal benefit would remain the same at $500 / mo. This is because
    unlike personal benefits, spousal benefits do not increase from delayed
    credits for filing after Normal Retirement Age.
  </p>

  <br class="clear" />

  <h2>Personal and Spousal Benefits</h2>

  <figure class="float-right">
    <img
      src={HeroImage}
      width="628"
      height="579"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Both have filed for benefits at age 67. Alex's benefit is $1,000 / mo and Chris's benefit is $500 / mo."
    />
  </figure>

  <h3>Normal Retirement Age</h3>

  <p>
    In all of the above examples, the lower earning spouse (Chris) has $0 in
    earnings. What happens if Chris has earnings of their own?
  </p>

  <p>
    Let's imagine that Chris also has a $100 / mo personal benefit. This is
    small enough relative to Alex's benefit that Chris still is eligible for a
    spousal benefit.
  </p>

  <p>
    You can use <a
      href="https://ssa.tools/calculator#pia1=1000&dob1=1965-09-21&name1=Alex&pia2=100&dob2=1965-09-28&name2=Chris"
      >this link</a
    > to explore the scenario.
  </p>

  <p>
    If Alex and Chris both file at Normal Retirement Age, nothing is changed.
    Chris's total benefit is still $500 / mo, which is $100 / mo from their own
    benefit and $400 / mo from the spousal benefit.
  </p>

  <p>
    This leads to a misunderstanding that the spousal benefit is simply the
    higher of your own benefit or half of your spouse's benefit. This only works
    out this way if both spouses file for all benefits at their own Normal
    Retirement Age.
  </p>

  <br class="clear" />

  <h3>Early Filing</h3>

  <figure class="float-right">
    <img
      src={EarlyFile100Image}
      width="621"
      height="565"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Alex filed at 67 while Chris filed at 62. Alex's benefit is $1,000 / mo and Chris's combined benefit is now $470 / mo."
    />
  </figure>

  <p>What happens if Chris files early at age 62 and 1 month?</p>
  <p>
    In this case, Chris's personal benefit is reduced to $70 / mo due to filing
    early. Chris's spousal benefit is not reduced because that component didn't
    start until Chris's Normal Retirement Age at 67.
  </p>

  <p>
    If Alex had filed earlier as well, Chris's spousal benefit would have been
    reduced as well. If Alex had filed at age 62 and 1 month, Chris's spousal
    benefit would have been reduced also.
  </p>

  <p>
    Here we can see where the concept of the spousal benefit being half of the
    higher earning spouse's benefit doesn't work. In this case, Chris's spousal
    benefit is $400 / mo, not $500.
  </p>

  <br class="clear" />

  <h3>Late Filing</h3>

  <figure class="float-right">
    <img
      src={LateFile100Image}
      width="620"
      height="566"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Alex filed at 67 while Chris filed at 70. Alex's benefit is $1,000 / mo and Chris's combined benefit is now $500 / mo."
    />
  </figure>

  <p>What happens if Chris files late at age 70?</p>
  <p>
    In this case, Chris's personal benefit is increased to $124 / mo due to
    delayed credits from filing late.
  </p>
  <p>
    However, the spousal benefit cannot increase the combined benefit for Chris
    to an amount greater than half of Alex's PIA. So, the spousal benefit is
    reduced by $24 / mo to $376 / mo to keep the total benefit at $500 / mo. [<a
      href="https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615694">ssa.gov</a
    >].
  </p>
  <p>
    The resulting total is $500 / mo, which is $124 / mo from Chris's personal
    and $376 / mo from the spousal benefit.
  </p>

  <br class="clear" />

  <h2>Primary Earner Filing Date</h2>

  <p>Is Chris's spousal benefit amount affected by when Alex files?</p>

  <p>
    No. The spousal benefit is based on your spouse's Primary Insurance Amount,
    not their benefit amount. So, in this scenario, Chris's spousal benefit is
    always $400 / mo.
  </p>

  <p>
    However, the spousal benefit is reduced if Chris files for it before Chris's
    Normal Retirement Age. Chris cannot file for spousal benefits until Alex has
    filed for their own benefits. So, in some sense, Alex's filing date does
    affect Chris's spousal benefit in that it determines when Chris can file for
    spousal benefits.
  </p>

  <p>
    Note that in the case of divorced couples where one is eligible for benefits
    on an ex-spouse's record, the filing date of the primary earner does not
    affect the spousal benefit amount. There are <a
      href="https://www.ssa.gov/benefits/retirement/planner/applying7.html#h4"
      >additional rules</a
    > for this scenario not described here.
  </p>
  <GuideFooter />
</div>
