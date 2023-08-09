<script lang="ts">
  import "$lib/global.css";

  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <meta
    name="description"
    content="How do various measures of inflation affect
  the calculation of social security benefits in retirement?"
  />
  <title>Social Security Inflation Calculator</title>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://ssa.tools/guide/inflation.html"
    },
    "headline": "Article headline",
    "image": [
      "https://ssa.tools/static/example-earnings-record-simplified.jpg",
     ],
    "datePublished": "2018-11-23T00:00:00+00:00",
    "dateModified": "2020-07-19T00:00:00+00:00",
    "author": {
      "@type": "Person",
      "name": "Greg Grothaus"
    },
     "publisher": {
      "@type": "Organization",
      "name": "SSA.Tools",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ssa.tools/static/laptop-piggybank.jpg"
      }
    }
  }
  </script>
</svelte:head>

<Header active="Guides" />
<main>
  <div>
    <h1>How inflation rate affects Social Security benefit calculations.</h1>
    <p class="postdate">November 23, 2018</p>
    <p>
      Many people know that the inflation rate reduces the real value of their
      savings every year. For example, using CPI data, $1 had the same spending
      power in year 1950 as $7.13 did in year 2000. Therefore, when considering
      social security benefits over multiple decades, it is worth understanding
      how the inflation index will impact those benefits.
    </p>
    <p>
      The short answer is that the Social Security program is designed to
      account for inflation, as is this site's
      <a href="/">social security calculator tool</a>. The benefit estimates
      that the Social Security Administration and this tool will give you are in
      "today's dollars" meaning that the actual benefits will be higher to match
      the increase in inflation between today and the benefit date, but will
      have the same purchasing power at that time as the estimate has today.
    </p>
    <p>
      For example, if this tool estimates your benefit at $1,000 per year
      starting in 20 years, but there is 350% inflation during those 20 years,
      then the actual benefit will be $3,500 ($1,000 x 350%).
    </p>
    <p>
      If you want to understand this in even more detail, read on below to
      understand how different measures of inflation affect different parts of
      the social security computation.
    </p>
    <h2>Wage Growth Adjustments during your working years</h2>
    <p>Consider the following example earnings record from 2005 to 2017:</p>
    <img
      src="/example-earnings-record-simplified.jpg"
      style="margin: auto; display: block"
      alt="Example earnings record"
    />
    <p>
      This person receives a 2.5% raise every year to keep up with inflation. In
      2005, they earned $40,000 and in 2016 they earned $56,483, a 31.2%
      increase.
    </p>
    <p>
      The "Primary Insurance Amount" for this person, which is the earnings
      computation upon which their benefit is based, is computed from the
      rightmost column, labelled Indexed Earnings. Note that the indexed
      earnings value in 2005 is roughly the same as in 2016.
    </p>
    <p>
      This difference in Indexed Earnings is because of the multiplier applied.
      That multiplier is 1.32 in 2005, representing the fact that there has been
      ~32% inflation between 2005 and 2016. As such, older earnings records get
      adjusted upwards for inflation. Every year until you first collect your
      benefit, the multiplier for all previous years will be adjusted upwards
      further.
    </p>
    <p>
      This adjustment is made based on the
      <a href="https://www.ssa.gov/oact/cola/awidevelop.html">
        Average Wage Index (AWI).
      </a> That is, if the average wage increased by 3% in a year, so will the Average
      Wage Index and thus all of the prior year's indexed earnings values.
    </p>
    <p>
      The Social Security Administration maintains estimated (a guess) indexing
      factors for future years. You can see the estimates
      <a href="https://www.ssa.gov/oact/TR/TRassum.html">here</a> and calculate
      your estimated indexing factors based on your year of eligibility
      <a href="https://www.ssa.gov/oact/cola/awifactors.html">here</a>. If you
      don't know which year you are eligible for benefits, use the
      <a href="/">social security calculator tool</a> to compute it.
    </p>
    <h2>Cost of Living Adjustments during your benefit years</h2>
    <p>
      Once you have filed for your benefit, you no longer receive additional
      Wage Growth Adjustments. At this point, your Primary Insurance amount, and
      thus your benefit, are adjusted annually by
      <a href="https://www.ssa.gov/cola">Cost of Living Adjustments</a>.
    </p>
    <p>
      These adjustments are based on the
      <a href="https://www.ssa.gov/oact/STATS/cpiw.html">
        Consumer Price Index (CPI-W)</a
      >. Every year, benefits are increased by a few percent. There has never
      been a decrease, but there have been years with no increase when there was
      little to no actual inflation.
    </p>
    <p>
      Future Cost of Living Adjustments are not shown in the
      <a href="/">social security calculator tool</a> since the actual adjustment
      value won't be known until the future. Therefore any benefits shown by this
      calculator are displayed in "today's dollars".
    </p>
  </div>

  <div id="homelink" style="display: flex; justify-content: center">
    <div>
      <h1>Try SSA.tools to see your personalized benefit</h1>
      <span style="font-size: 16px;">
        <p>
          See your personal benefit data and ask 'What If?' Questions. The tool
          is absolutely free.
        </p>
        <p style="text-align: center">
          <a class="bigbtn" href="/calculator" role="button">Get Started</a>
        </p>
      </span>
    </div>
  </div>
</main>

<style>
  a {
    color: #337ab7;
  }
  main {
    max-width: 1080px;
    margin: 0 auto;
  }

  a.bigbtn {
    background-color: #5cb85c;
    border-color: #4cae4c;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    color: #fff;
    white-space: nowrap;
    padding: 14px 24px;
    font-weight: 400;
    text-decoration: none;
    display: inline-block;
    font-size: 2rem;
  }

  a.bigbtn:hover {
    background-color: #449d44;
    border-color: #398439;
  }
</style>
