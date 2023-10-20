<script lang="ts">
  import "$lib/global.css";
</script>

<svelte:head>
  <title>Social Security Calculator - Guides</title>
</svelte:head>

<div>
  <h1>Social Security Guides</h1>
  <ul class="guides">
    <li>
      <span class="postdate">Sep 12, 2023</span>
      <h3 class="posttitle">
        <a href="/guides/earnings-record-paste"
          >Possible causes of Parsing Errors
        </a>
      </h3>
      <p class="description">
        SSA.tools accepts a copy and pasted earnings record from the Social
        Security Administration's website. This guide explains If your earnings
        record is not being parsed correctly, this guide may help you understand
        why and how to fix it.
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
        This site's calculator shows a information dense chart of how filing
        dates affect your benefits. The chart can be a little confusing at
        first, so here's a guide to help you understand it.
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
        And what happens if it does? Learn more about the Social Security Trust
        Fund, how it's slowly running out, and how what happens next could
        affect your benefits.
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
        For those starting benefits after Normal Retirement Age, there is a
        small delay in some of the delayed credits until the following January.
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
      <p class="description">How does working abroad affect social security?</p>
    </li>

    <li>
      <span class="postdate">Jun 5, 2022</span>
      <h3 class="posttitle">
        <a href="/guides/1st-and-2nd-of-month">
          Rules for those born on the 1st or 2nd of the month
        </a>
      </h3>
      <p class="description">
        Learn more about how Social Security law is affected by the day of the
        month one was born in.
      </p>
    </li>

    <li>
      <span class="postdate">Dec 28, 2020</span>
      <h3 class="posttitle">
        <a href="/guides/indexing-factors">
          Why does ssa.tools use the current year's indexing factors for someone
          younger than 62?
        </a>
      </h3>
      <p class="description">
        SSA.gov publishes estimated future indexing factors based on economic
        projections. Should ssa.tools use these factors and why?
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
        For earners who were born in 1960, the effect of a potentially much
        lower average wage in 2020 may have an outsized impact on their lifetime
        benefit.
      </p>
    </li>

    <li>
      <span class="postdate">Nov 28, 2020</span>
      <h3 class="posttitle">
        <a href="/guides/earnings-cap">Earnings Caps</a>
      </h3>
      <p class="description">
        How do Social Security annual earnings caps work?
      </p>
    </li>

    <li>
      <span class="postdate">Aug 3, 2019</span>
      <h3 class="posttitle">
        <a href="/guides/maximum">Maximum Benefits </a>
      </h3>
      <p class="description">
        What is the maximum possible Social Security benefit that someone can
        receive?
      </p>
    </li>
    <li>
      <span class="postdate">Nov 23, 2018</span>
      <h3 class="posttitle">
        <a href="/guides/inflation">Social Security and Inflation </a>
      </h3>
      <p class="description">
        Learn how two different types of inflation, wage increase and consumer
        price index, each interact to affect your social security benefit.
      </p>
    </li>
  </ul>
</div>

<style>
  a {
    color: #337ab7;
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
</style>
