<script lang="ts">
  import "$lib/global.css";

  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <meta
    name="description"
    content="For those starting benefits after Normal Retirement Age, there is a
  small delay in some of the delayed credits until the following January."
  />
  <title>
    Bump in delayed Social Security benefits after January - ssa.tools
  </title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://ssa.tools/guide/delayed-january-bump"
    },
    "headline": "Article headline",
    "image": {
      @type: "ImageObject",
      "url": "https://ssa.tools/delayed-bump.png",
      "width": 285,
      "height": 508
     ],
    "datePublished": "2023-12-29T00:00:00+00:00",
    "dateModified": "2023-04-29T00:00:00+00:00",
    "author": {
      "@type": "Person",
      "name": "Greg Grothaus"
    },
     "publisher": {
      "@type": "Organization",
      "name": "SSA.Tools",
      "logo": {
        "@type": "ImageObject",
        "url": "https://ssa.tools/laptop-piggybank.jpg"
      }
    }
  }
  </script>
</svelte:head>

<Header active="Guides" />
<main>
  <h1>Bump in delayed Social Security benefits after January</h1>
  <p class="postdate">Apr 29, 2023</p>

  <p>
    When using the ssa.tools calculator, you may have noticed a small notch or
    bump in the income chart when choosing a benefits start date later than the
    Normal Retirement Age. Here's an example of what this might look like for
    someone retiring at the age of 68 and 5 months. Initially, the recipient's
    benefit is $2,258 / mo but in the following January it jumps to $2,392 / mo:
  </p>

  <img
    src="/delayed-bump.png"
    width="285"
    height="503"
    style="margin: 40px 40px 40px 40px; display: block; border: 1px solid"
    alt="Screenshot of benefit chart showing a bump in January"
  />

  <p>If this is not a bug, what's going on?</p>

  <p>
    When someone chooses to delay collecting social security past the Normal
    Retirement Age (typically 65), they earn delayed credits that increase their
    benefit by 6.67% per year (0.56% per month) in exchange for waiting a little
    longer.
  </p>

  <p>
    However, due to a little known quirk in the way the credits work, you only
    earn credits based on the months delayed in the previous calendar year.
  </p>

  <p>
    In the example image above, the recipient began their benefit in November
    2018, so intially the benefit was based only on months delayed in 2017. The
    additional 10 months of delayed credits were in 2018 and are not yet
    credited to the recipient. In Jan 2019, those credits kick in and the
    additional bump in benefits does as well.
  </p>

  <p>There are a few cases where this bump does not appear:</p>

  <ol>
    <li>
      <u>Early Benefit Reductions</u>: This rule only affects credits from
      delaying after Normal Retirement age, it does not affect reductions from
      starting benefits early.
    </li>
    <li>
      <u>Age 70</u>: If the recipient starts the benefit at age 70, even if that
      is in the middle of the year, the full credits are applied.
    </li>
    <li>
      <u>Spousal Benefits</u>: Spousal benefits are not affected by delayed
      credits and so are unaffected by this rule.
    </li>
  </ol>

  <p>
    This is not related to Cost of living adjustments (COLA). COLA is also
    applied in January, but in addition to this rule.
  </p>

  <div id="homelink" style="display: flex; justify-content: center">
    <div>
      <h1>Try SSA.tools to see your personalized benefit</h1>
      <span style="font-size: 16px;">
        <p>
          See your personal benefit data and ask 'What If?' Questions. The tool
          is 100% free.
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
