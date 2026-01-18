<script lang="ts">
  import { GuidesSchema, renderFAQSchema, type FAQItem } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import EarlyFile100Image from "./early-file-100.png";
  import EarlyFileImage from "./early-file.png";
  import HeroImage from "./hero.png";
  import LateFile100Image from "./late-file-100.png";
  import LateFileImage from "./late-file.png";

  const title = "Spousal Benefits and Filing Dates: A Deep Dive";
  const description =
    "Spousal benefits aren't always half of your spouse's benefit. Learn how filing dates affect spousal benefits, why early filing reduces them more than personal benefits, and why delayed credits don't increase spousal benefits.";
  const publishDate = new Date("2023-09-06T00:00:00+00:00");
  const updateDate = new Date("2023-09-06T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/spousal-benefit-filing-date";
  schema.title = title;
  schema.image = HeroImage;
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt = "Benefit chart showing spousal benefits for Alex and Chris";
  schema.tags = [
    "Spousal Benefits",
    "Social Security",
    "Filing Strategy",
    "Marriage",
    "Retirement Planning",
  ];

  // FAQ structured data for featured snippets
  const faqs: FAQItem[] = [
    {
      question: "Is the spousal benefit always 50% of my spouse's benefit?",
      answer:
        "No. The spousal benefit is 50% of your spouse's Primary Insurance Amount (PIA), not 50% of their actual benefit. If your spouse delays past Full Retirement Age and receives more than their PIA, your spousal benefit is still based on the PIA, not the higher amount.",
    },
    {
      question: "Do spousal benefits increase if I delay past Full Retirement Age?",
      answer:
        "No. Unlike personal retirement benefits, spousal benefits do not earn delayed retirement credits. Your maximum spousal benefit is reached at your Full Retirement Age. Delaying further provides no additional increase to the spousal benefit.",
    },
    {
      question: "Does my spouse's filing date affect my spousal benefit amount?",
      answer:
        "The filing date doesn't affect the spousal benefit amount directly (it's always based on their PIA). However, you cannot file for spousal benefits until your spouse has filed for their own benefits. So their filing date determines when you can start receiving spousal benefits.",
    },
    {
      question: "What happens to spousal benefits if I file early?",
      answer:
        "If you file for spousal benefits before your Full Retirement Age, they are permanently reduced. The reduction is 8.33% per year for the first 3 years early, and 5% per year for additional years. This is a higher penalty than for personal benefits (6.67% per year for first 3 years).",
    },
  ];
</script>

<svelte:head>
  <title>{title} | SSA.tools</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={schema.url} />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>

  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <div class="key-takeaways">
    <h3>Key Points</h3>
    <ul>
      <li>
        <strong>Spousal benefit = 50% of spouse's PIA</strong> — not 50% of their
        actual benefit
      </li>
      <li>
        <strong>Early filing penalty is higher</strong> — 8.33%/year for first 3
        years vs 6.67% for personal benefits
      </li>
      <li>
        <strong>No delayed credits</strong> — spousal benefits don't increase for
        filing after FRA
      </li>
      <li>
        <strong>Filing dates interact</strong> — both spouses' filing ages affect
        the final amounts
      </li>
    </ul>
  </div>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="628"
      height="579"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Both have filed for benefits at age 67. Alex's benefit is $1,000 / mo and Chris's benefit is $500 / mo."
    />
  </figure>

  <h2>The Basics: What is a Spousal Benefit?</h2>

  <p>
    A spousal benefit is the benefit a person can receive based on their
    spouse's earning record. In the simplest case, this can be half of the
    spouse's <a href="/guides/pia">Primary Insurance Amount (PIA)</a>.
  </p>

  <p>For example, if:</p>
  <ul>
    <li>Alex has a $1,000/mo Primary Insurance Amount</li>
    <li>Chris has no earnings</li>
    <li>Alex and Chris both file for benefits at Full Retirement Age</li>
  </ul>

  <p>In this situation, Chris will receive a spousal benefit of $500/mo.</p>

  <p>
    You can explore this example with <a
      href="https://ssa.tools/calculator#pia1=1000&dob1=1965-09-21&name1=Alex&pia2=0&dob2=1965-09-28&name2=Chris"
      >this calculator link</a
    >.
  </p>

  <br class="clear" />

  <h2>How Filing Age Affects Spousal Benefits</h2>

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
    What would happen instead if Alex and Chris filed earlier than Full
    Retirement Age, such as at age 62 and 1 month?
  </p>

  <p>
    In this case, Alex would receive a reduced benefit of $704/mo, and Chris
    would receive a reduced spousal benefit of $327/mo.
  </p>

  <p>
    Notice that Chris's benefit is no longer half of Alex's benefit. This is
    because the reduction formulas are different:
  </p>

  <ul>
    <li>
      <strong>Personal benefits:</strong> reduced 6.67% for the first 3 years, 5%
      for each additional year filed early
    </li>
    <li>
      <strong>Spousal benefits:</strong> reduced 8.33% for the first 3 years, 5%
      for each additional year filed early
    </li>
  </ul>

  <p>
    There is a larger penalty for early filing for spousal benefits than for
    personal benefits.
  </p>

  <br class="clear" />

  <figure class="float-right">
    <img
      src={LateFileImage}
      width="625"
      height="581"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Both have filed for benefits at age 70. Alex's benefit is $1,240 / mo and Chris's benefit is $500 / mo."
    />
  </figure>

  <h3>Late Filing</h3>

  <p>
    What would happen instead if Alex and Chris filed later than Full Retirement
    Age, such as at age 70?
  </p>

  <p>
    Alex's benefit would be increased by 8% for each year filed late, making the
    final benefit $1,240/mo.
  </p>

  <p>
    However, <strong>Chris's spousal benefit would remain at $500/mo</strong>.
    Unlike personal benefits, spousal benefits do not increase from delayed
    retirement credits for filing after Full Retirement Age.
  </p>

  <br class="clear" />

  <h2>When Both Spouses Have Earnings</h2>

  <figure class="float-right">
    <img
      src={HeroImage}
      width="628"
      height="579"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Both have filed for benefits at age 67. Alex's benefit is $1,000 / mo and Chris's benefit is $500 / mo."
    />
  </figure>

  <h3>Filing at Full Retirement Age</h3>

  <p>
    In all of the above examples, the lower earning spouse (Chris) has $0 in
    earnings. What happens if Chris has earnings of their own?
  </p>

  <p>
    Let's imagine that Chris also has a $100/mo personal benefit. This is small
    enough relative to Alex's benefit that Chris still qualifies for a spousal
    benefit.
  </p>

  <p>
    You can use <a
      href="https://ssa.tools/calculator#pia1=1000&dob1=1965-09-21&name1=Alex&pia2=100&dob2=1965-09-28&name2=Chris"
      >this link</a
    > to explore the scenario.
  </p>

  <p>
    If Alex and Chris both file at Full Retirement Age, Chris's total benefit is
    still $500/mo, which is $100/mo from their own benefit and $400/mo from the
    spousal benefit.
  </p>

  <div class="warning-box">
    <strong>Common Misconception:</strong> Many people assume the spousal benefit
    is simply "the higher of your own benefit or half of your spouse's benefit."
    This only works out this way if both spouses file at their Full Retirement Age.
  </div>

  <br class="clear" />

  <h3>When Chris Files Early</h3>

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
    Chris's personal benefit is reduced to $70/mo due to filing early. However,
    Chris's spousal benefit is not reduced because that component didn't start
    until Chris's Full Retirement Age at 67 (when Alex filed).
  </p>

  <p>
    If Alex had filed earlier as well, Chris's spousal benefit would have been
    reduced also.
  </p>

  <p>
    Here we can see where the concept of the spousal benefit being half of the
    higher earning spouse's benefit breaks down. In this case, Chris's spousal
    component is $400/mo, not $500/mo, because Chris receives $70/mo from their
    own reduced benefit plus $400/mo spousal = $470/mo total.
  </p>

  <br class="clear" />

  <h3>When Chris Files Late</h3>

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
    Chris's personal benefit is increased to $124/mo due to delayed retirement
    credits.
  </p>

  <p>
    However, the spousal benefit cannot increase the combined benefit for Chris
    to an amount greater than half of Alex's PIA. So, the spousal benefit is
    reduced by $24/mo to $376/mo to keep the total benefit at $500/mo. (<a
      href="https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615694"
      >SSA reference</a
    >)
  </p>

  <p>
    The resulting total is $500/mo: $124/mo from Chris's personal benefit and
    $376/mo from the spousal benefit.
  </p>

  <br class="clear" />

  <h2>Does the Primary Earner's Filing Date Matter?</h2>

  <p>Is Chris's spousal benefit amount affected by when Alex files?</p>

  <p>
    <strong>No.</strong> The spousal benefit is based on Alex's Primary Insurance
    Amount, not their actual benefit amount. So, in this scenario, Chris's spousal
    benefit is always based on $1,000/mo (Alex's PIA), regardless of when Alex files.
  </p>

  <p>
    However, Chris cannot file for spousal benefits until Alex has filed for
    their own benefits. So, in some sense, Alex's filing date does affect
    Chris's spousal benefit because it determines when Chris can begin receiving
    spousal benefits.
  </p>

  <h3>Exception: Divorced Spouses</h3>

  <p>
    In the case of divorced couples where one is eligible for benefits on an
    ex-spouse's record, the filing date of the primary earner does not affect
    the spousal benefit amount. If you were married for at least 10 years and
    are now divorced, see our <a href="/guides/divorced-spouse">divorced spouse
    benefits guide</a> for the complete eligibility rules, including how to
    claim even if your ex hasn't filed yet.
  </p>

  <h2>Related Guides</h2>

  <ul>
    <li>
      <a href="/guides/pia">Primary Insurance Amount (PIA)</a> — The foundation
      for all spousal benefit calculations
    </li>
    <li>
      <a href="/guides/aime">AIME Guide</a> — How earnings are averaged to determine
      your PIA
    </li>
    <li>
      <a href="/guides/maximum">Maximum Benefit</a> — The highest possible spousal
      benefit comes from a spouse with maximum PIA
    </li>
    <li>
      <a href="/guides/work-credits">Work Credits</a> — Spousal benefits don't
      require you to have earned any credits
    </li>
    <li>
      <a href="/guides/divorced-spouse">Divorced Spouse Benefits</a> — Special
      rules for claiming benefits from an ex-spouse after divorce
    </li>
    <li>
      <a href="/guides/filing-date-chart">Filing Date Chart Guide</a> — How to
      read the interactive chart showing combined benefits for couples
    </li>
  </ul>

  <h2>Try It Yourself</h2>

  <p>
    Use the <a href="/calculator">SSA.tools calculator</a> to explore how different
    filing dates affect spousal benefits for your specific situation.
  </p>

  <GuideFooter />
</div>

<style>
  .postdate {
    color: #666;
    font-style: italic;
    margin-bottom: 1.5rem;
  }

  .key-takeaways {
    background-color: #e8f4fd;
    border: 2px solid #4a90e2;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #2c5282;
    font-size: 1.2em;
  }

  .key-takeaways ul {
    margin: 0;
    padding-left: 20px;
  }

  .key-takeaways li {
    margin: 10px 0;
    line-height: 1.5;
  }

  .warning-box {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .hero-image {
    margin: 20px 0;
    text-align: center;
  }

  .hero-image img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .float-right {
    float: right;
    margin: 0 0 20px 20px;
    max-width: 50%;
  }

  .float-right img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .clear {
    clear: both;
  }

  ul {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    .float-right {
      float: none;
      margin: 20px 0;
      max-width: 100%;
    }
  }
</style>
