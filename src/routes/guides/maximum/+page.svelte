<script lang="ts">
  import "$lib/global.css";

  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <meta
    name="description"
    content="What is the maximum monthly social security
  benefit that someone can reach, and what does it take to reach this maximum?"
  />
  <title>Social Security Maximum</title>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://ssa.tools/guide/maximum.html"
    },
    "headline": "Article headline",
    "datePublished": "2019-08-03T00:00:00+00:00",
    "dateModified": "2022-06-05T00:00:00+00:00",
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
    <h1>Maximum possible Social Security benefit in 2023</h1>
    <p class="postdate">August 8, 2023</p>
    <p>
      Few people will receive the maximum possible benefit, but how high is the
      maximum? The short answer is that the maximum monthly Social Security
      benefit that an individual who files a claim in 2023 can receive is:
    </p>
    <blockquote style="font-size: 18px">
      <b>$4,555 / month</b>
    </blockquote>
    <p>In order to reach this high of a benefit, someone must have:</p>
    <ul>
      <li>Waited until age 70 to file for benefits</li>
      <li>
        Earned at least the maximum taxable earnings for at least 35 years of
        their life.
      </li>
    </ul>
    <p>
      You can see what the per-year maximum taxable earnings are from the Social
      Security Adminstration's
      <a href="https://www.ssa.gov/OACT/COLA/cbb.html"
        >maximum taxble income table</a
      >.
    </p>

    <h2>Different filing ages</h2>
    <p>At other filing ages, the maximum possible benefit would be smaller:</p>
    <p />
    <ul>
      <li>$3,627 / month at age 66</li>
      <li>$2,572 / month at age 62</li>
    </ul>
    <p>
      The <a href="/">social security calculator</a> will allow you to see the benefit
      at any starting age, for any earnings record.
    </p>
    <h2>Spousal benefit</h2>
    <p>
      The spouse of someone earning the maximum monthly benefit would also be
      eligible to earn a spousal benefit on the same record of as much as half
      of the primary earner's benefit.
    </p>
    <p>
      In the case of the primary earner earning the maximum benefit of $4,555 /
      month, the spouse would also be eligible for an additional maximum benefit
      of $2,277 / month. This would take the total benefit for this family to
      $6,832 / month. If the spouse also had maxed out his or her own record,
      the total benefit for the two maximum personal benefits is simply double a
      single personal benefit, which is $9,110 / month.
    </p>
  </div>

  <div id="homelink" style="display: flex; justify-content: center">
    <div>
      <h1>Try SSA.tools to see your personalized maximum</h1>
      <span style="font-size: 16px;">
        <p>
          Look at your personal benefit data find out how it will compare to
          these maximums.
        </p>
        <p>Ask other 'What If?' questions. The tool is absolutely free.</p>
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
