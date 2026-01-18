<script lang="ts">
import { renderWebsiteSocialMeta } from '$lib/schema-org';

const pageTitle = 'Social Security Guides & Resources - SSA.tools';
const pageDescription =
  'Explore comprehensive guides on Social Security benefits, eligibility, taxes, and retirement planning. Find answers to common questions and understand how Social Security works.';
const pageUrl = 'https://ssa.tools/guides';
const pageImageAlt = 'Social Security guides and educational resources';
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <link rel="canonical" href={pageUrl} />

  <!-- Open Graph / Social Meta Tags -->
  {@html renderWebsiteSocialMeta({
    url: pageUrl,
    title: pageTitle,
    description: pageDescription,
    imageAlt: pageImageAlt,
  })}
</svelte:head>

<main>
  <div>
    <h1>Social Security Guides</h1>
    <ul class="guides">
      <li>
        <span class="postdate">Jan 18, 2026</span>
        <h3 class="posttitle">
          <a href="/guides/divorced-spouse"
            >Social Security Benefits for Divorced Spouses</a
          >
        </h3>
        <p class="description">
          Can you collect Social Security from your ex-spouse? Learn the divorced
          spouse benefit rules, including the 10-year marriage requirement, how
          much you can receive (up to 50% of your ex's benefit), and whether your
          ex needs to know or consent.
        </p>
      </li>

      <li>
        <span class="postdate">Jan 17, 2026</span>
        <h3 class="posttitle">
          <a href="/guides/nra">Normal Retirement Age (NRA)</a>
        </h3>
        <p class="description">
          Learn about Normal Retirement Age (NRA), also called Full Retirement
          Age (FRA), how it varies by birth year from 65 to 67, and why it
          matters for calculating your Social Security benefits. Understand how
          filing before or after NRA affects your monthly payment.
        </p>
      </li>

      <li>
        <span class="postdate">Jan 16, 2026</span>
        <h3 class="posttitle">
          <a href="/guides/wep">Windfall Elimination Provision (WEP)</a>
        </h3>
        <p class="description">
          For 42 years, the Windfall Elimination Provision reduced Social
          Security benefits for teachers, firefighters, and other public
          servants. Learn what WEP was, who it affected, and why it no longer
          applies after the Social Security Fairness Act of 2025.
        </p>
      </li>

      <li>
        <span class="postdate">Jan 14, 2026</span>
        <h3 class="posttitle">
          <a href="/guides/privacy">Privacy & Security</a>
        </h3>
        <p class="description">
          SSA.tools is designed with privacy as a core principle. Learn how your
          Social Security earnings data never leaves your computer. All
          calculations happen entirely in your browser with no server storage.
        </p>
      </li>

      <li>
        <span class="postdate">Dec 20, 2025</span>
        <h3 class="posttitle">
          <a href="/guides/integrations">Third-Party Integrations</a>
        </h3>
        <p class="description">
          Learn about third-party tools that integrate with SSA.tools to provide
          enhanced retirement planning capabilities. Discover how to connect
          your Social Security data with other financial planning platforms.
        </p>
      </li>

      <li>
        <span class="postdate">Oct 7, 2025</span>
        <h3 class="posttitle">
          <a href="/guides/url-parameters"
            >Sharing Social Security Scenarios with URL Parameters</a
          >
        </h3>
        <p class="description">
          Learn how to use URL parameters to link directly to the SSA.tools
          calculator with preloaded scenarios. Perfect for financial advisors,
          educators, or sharing examples with family and friends. Create
          shareable links with specific Primary Insurance Amounts and
          birthdates.
        </p>
      </li>

      <li>
        <span class="postdate">Sep 30, 2025</span>
        <h3 class="posttitle">
          <a href="/guides/government-shutdown"
            >How Government Shutdowns Affect Social Security</a
          >
        </h3>
        <p class="description">
          Government shutdowns never stop Social Security payments, but they
          severely disrupt services. Learn what continues, what stops, and how
          to protect yourself during funding gaps. Understand the current
          shutdown threat and prepare for potential service disruptions.
        </p>
      </li>

      <li>
        <span class="postdate">Sep 19, 2025</span>
        <h3 class="posttitle">
          <a href="/guides/aime">Averaged Indexed Monthly Earnings (AIME)</a>
        </h3>
        <p class="description">
          Understanding how Social Security calculates your Averaged Indexed
          Monthly Earnings (AIME) and its impact on your benefits. Learn about
          the three-step process, common misconceptions, and strategies to
          maximize your AIME.
        </p>
      </li>

      <li>
        <span class="postdate">Sep 19, 2025</span>
        <h3 class="posttitle">
          <a href="/guides/pia">Primary Insurance Amount (PIA)</a>
        </h3>
        <p class="description">
          Learn how Social Security calculates your Primary Insurance Amount
          (PIA) using bendpoints, the implications of earning more money late in
          your career, and how PIA forms the foundation of all Social Security
          benefits.
        </p>
      </li>

      <li>
        <span class="postdate">Jun 15, 2025</span>
        <h3 class="posttitle">
          How much Social Security will I get based on my income?
        </h3>
        <p class="description">
          A series of guides estimating your Social Security benefits based on
          different annual income levels.
        </p>
        <ul>
          <li><a href="/guides/25k-income">If you make $25,000 / year</a></li>
          <li><a href="/guides/40k-income">If you make $40,000 / year</a></li>
          <li><a href="/guides/60k-income">If you make $60,000 / year</a></li>
          <li><a href="/guides/80k-income">If you make $80,000 / year</a></li>
          <li><a href="/guides/100k-income">If you make $100,000 / year</a></li>
        </ul>
      </li>

      <li>
        <span class="postdate">Apr 29, 2025</span>
        <h3 class="posttitle">
          <a href="/guides/agency-changes"
            >Navigating Social Security During Administrative Changes</a
          >
        </h3>
        <p class="description">
          If you've tried to access Social Security services recently, you may
          have encountered longer wait times, website outages, or difficulty
          reaching representatives. These challenges are not coincidental but
          stem from significant administrative changes implemented by the Trump
          administration in 2025.
        </p>
      </li>

      <li>
        <span class="postdate">Feb 26, 2023</span>
        <h3 class="posttitle">
          <a href="/guides/work-credits">Social Security Work Credits</a>
        </h3>
        <p class="description">
          Social Security work credits determine your eligibility for benefits.
          This guide explains how these credits are earned throughout your
          working life and the number required to qualify for retirement,
          disability, and survivor benefits.
        </p>
      </li>

      <li>
        <span class="postdate">Sep 12, 2023</span>
        <h3 class="posttitle">
          <a href="/guides/earnings-record-paste"
            >Possible causes of Parsing Errors
          </a>
        </h3>
        <p class="description">
          SSA.tools relies on accurate parsing of your earnings record from the
          Social Security Administration's website. If your earnings data isn't
          loading correctly, this guide identifies common reasons for parsing
          errors and provides troubleshooting tips to help you resolve them.
        </p>
      </li>

      <li>
        <span class="postdate">Sep 6, 2023</span>
        <h3 class="posttitle">
          <a href="/guides/spousal-benefit-filing-date"
            >Deep look at Spousal Benefits and Filing Dates
          </a>
        </h3>
        <p class="description">
          Spousal Benefits are sometimes commonly misunderstood to be equal to
          half of the other spouse's benefit. This guide takes a deep dive into
          how spousal benefits are calculated and how different filing dates can
          affect the final benefit calculation in confusing ways.
        </p>
      </li>

      <li>
        <span class="postdate">Aug 18, 2023</span>
        <h3 class="posttitle">
          <a href="/guides/filing-date-chart">Navigate the Filing Date Chart</a>
        </h3>
        <p class="description">
          The SSA.tools calculator features a detailed chart illustrating how
          different Social Security filing dates impact your benefit amount.
          This guide demystifies the chart, helping you interpret its data to
          make informed decisions about when to claim your benefits.
        </p>
      </li>

      <li>
        <span class="postdate">Aug 11, 2023</span>
        <h3 class="posttitle">
          <a href="/guides/will-social-security-run-out">
            Will Social Security Run Out?
          </a>
        </h3>
        <p class="description">
          And what happens if it does? Learn more about the Social Security
          Trust Fund, how it's slowly running out, and how what happens next
          could affect your benefits.
        </p>
      </li>

      <li>
        <span class="postdate">Apr 29, 2023</span>
        <h3 class="posttitle">
          <a href="/guides/delayed-january-bump">
            Bump in delayed benefits after January
          </a>
        </h3>
        <p class="description">
          If you delay claiming Social Security benefits past your Normal
          Retirement Age, you earn delayed retirement credits. This guide
          explains a specific nuance: a small portion of these credits may be
          delayed until the January following the year you become eligible,
          impacting your initial payments.
        </p>
      </li>

      <li>
        <span class="postdate">Dec 4, 2022</span>
        <h3 class="posttitle">
          <a href="/guides/federal-taxes">
            Federal Taxation of Social Security Benefits
          </a>
        </h3>
        <p class="description">
          A Comprehensive Guide to Calculating the Taxability of Social Security
          Benefits Based on AGI.
        </p>
      </li>

      <li>
        <span class="postdate">Jun 26, 2022</span>
        <h3 class="posttitle">
          <a href="/guides/international-agreements">
            International Agreements
          </a>
        </h3>
        <p class="description">
          Working abroad can impact your Social Security benefits. This guide
          explains how international agreements, known as Totalization
          Agreements, coordinate Social Security coverage and benefits between
          the U.S. and other countries, helping you understand your eligibility.
        </p>
      </li>

      <li>
        <span class="postdate">Jun 5, 2022</span>
        <h3 class="posttitle">
          <a href="/guides/1st-and-2nd-of-month">
            Rules for those born on the 1st or 2nd of the month
          </a>
        </h3>
        <p class="description">
          Social Security rules can sometimes have surprising details. This
          guide explains a specific regulation that affects individuals born on
          the 1st or 2nd day of the month, potentially impacting their
          eligibility for benefits or the timing of their payments.
        </p>
      </li>

      <li>
        <span class="postdate">Dec 28, 2020</span>
        <h3 class="posttitle">
          <a href="/guides/indexing-factors">
            Why does ssa.tools use the current year's indexing factors for
            someone younger than 62?
          </a>
        </h3>
        <p class="description">
          The Social Security Administration uses indexing factors to adjust
          past earnings for inflation. This guide delves into why SSA.tools uses
          current year indexing factors for younger individuals, rather than
          projected future factors, and the implications of this approach for
          benefit estimates.
        </p>
      </li>

      <li>
        <span class="postdate">Dec 1, 2020</span>
        <h3 class="posttitle">
          <a href="/guides/covid-awi-drop">
            The effect of AWI declining in 2020 due to Covid
          </a>
        </h3>
        <p class="description">
          The Average Wage Index (AWI) plays a crucial role in calculating
          Social Security benefits. This guide examines how the unexpected
          decline in AWI during 2020 due to the COVID-19 pandemic specifically
          impacts the lifetime benefits of individuals born in 1960.
        </p>
      </li>

      <li>
        <span class="postdate">Nov 28, 2020</span>
        <h3 class="posttitle">
          <a href="/guides/earnings-cap">Earnings Caps</a>
        </h3>
        <p class="description">
          Social Security applies an annual earnings cap, meaning income above a
          certain threshold is not subject to Social Security taxes and does not
          count towards your benefit calculation. This guide explains how these
          earnings caps work, their historical changes, and their impact on your
          Social Security benefits.
        </p>
      </li>

      <li>
        <span class="postdate">Aug 3, 2019</span>
        <h3 class="posttitle">
          <a href="/guides/maximum">Maximum Benefits </a>
        </h3>
        <p class="description">
          Curious about the highest possible Social Security benefit? This guide
          explains the factors that determine the maximum monthly payment,
          including your earnings history and the age at which you claim
          benefits, providing insight into the upper limits of Social Security.
        </p>
      </li>
      <li>
        <span class="postdate">Nov 23, 2018</span>
        <h3 class="posttitle">
          <a href="/guides/inflation">Social Security and Inflation </a>
        </h3>
        <p class="description">
          Inflation significantly impacts the value of your Social Security
          benefits. This guide differentiates between two key types of
          inflation (wage increases and the Consumer Price Index) and explains
          how each uniquely influences the calculation and purchasing power of
          your Social Security payments.
        </p>
      </li>
    </ul>
  </div>
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
  p.description {
    text-align: justify;
    margin: 0 0 0 1em;
  }
  ul.guides {
    padding: 0 2em;
    margin: 0 auto;
  }
  ul.guides > li {
    list-style-type: none;
    margin-bottom: 2em; /* Add space between list items */
  }
  ul.guides > li > span.postdate {
    float: right;
    color: #666;
    font-size: 0.9em;
    margin-left: 30px;
    vertical-align: text-top;
  }
  ul.guides > li > p {
    font-size: 1.4em;
  }

  @media (max-width: 768px) {
    main {
      padding: 0 1em; /* Add padding to main for consistent spacing */
    }
    p.description {
      text-align: left; /* Remove justify on mobile */
      margin: 0; /* Adjust margin for better mobile spacing */
    }
    ul.guides > li > p {
      font-size: 1.1em; /* Smaller font size for descriptions on mobile */
    }
    ul.guides > li > span.postdate {
      float: none; /* Remove float on mobile */
      display: block; /* Make it a block element */
      margin-left: 0; /* Remove left margin */
      text-align: left; /* Align to left */
      font-size: 0.8em; /* Slightly smaller postdate */
      margin-bottom: 0.5em; /* Add space below postdate */
    }
    ul.guides {
      padding: 0; /* Remove padding from ul.guides as main now has it */
    }
    ul.guides > li > h3.posttitle {
      margin-top: 0.5em; /* Add space above heading */
    }
  }
</style>
