<script lang="ts">
  import "$lib/global.css";

  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <meta
    name="description"
    content="What happens if Social Security runs out of money?"
  />
  <title>Will Social Security run out and what happens next | SSA.tools</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://ssa.tools/guides/will-social-security-run-out"
    },
    "headline": "Will Social Security run out and what happens next?",
    "datePublished": "2023-08-11T00:00:00+00:00",
    "dateModified": "2023-08-11T00:00:00+00:00",
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
  <div>
    <h1>Will Social Security run out and what happens next?</h1>
    <p class="postdate">Published: Aug 11, 2023</p>
    <h2>Running out of money</h2>
    <p>
      You may have heard that the Social Security program is running out of
      money. This is technically true, but only part of the story. Social
      Security is both paying out money to retirees and also collecting money
      from workers at the same time. Over its 80-year history, the program has
      collected more money than it has paid out. The current surplus is $3
      trillion. However, in recent years the program is paying out more than it
      is collecting, and so the fund is shrinking. Current estimates are that
      the fund will run out in 2034.
    </p>
    <h2>What happens next</h2>
    <p>
      Once the surplus runs out, the program will still be collecting money, and
      those collections will cover all but 26% of the current payments. So, if
      nothing changes by 2035, the calculated benefit may be be reduced by 26%,
      but the payments will still continue. This is probably the 'worst case'
      scenario.
    </p>
    <p>
      More information: <a
        href="https://www.ssa.gov/policy/docs/ssb/v70n3/v70n3p111.html"
        >The Future Financial Status of the Social Security Program</a
      >
    </p>
    <p>
      There are multiple mechanisms by which Congress could conceivably 'fix'
      the Social Security deficit, which would have less of an impact than the
      'worst case' scenario. What will ultimately happen is unknown. Some of the
      ideas that have been <a
        href="https://www.ssa.gov/OACT/solvency/provisions/index.html"
        >proposed</a
      >
      include:
    </p>
    <ul>
      <li>Increase the payroll tax which funds the program.</li>
      <li>Raise the ages at which benefits begin.</li>
      <li>
        Change the method by which inflation adjustments are made to a more
        slowly rising value.
      </li>
      <li>
        Change the bend points or ratios for the curve of annual indexed
        earnings.
      </li>
      <li>Reduce the number of years from which benefits are calculated.</li>
      <li>Reduce the spousal benefit.</li>
      <li>Invest a percentage of the fund in equities.</li>
    </ul>
    <p>
      What approach will be taken is unknown. It is up to Congress to decide how
      to address the issue. It is likely that some combination of the above will
      be used. It is also unlikely that the program will go away entirely, due
      to it's popularity.
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
