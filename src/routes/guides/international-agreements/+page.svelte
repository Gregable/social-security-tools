<script lang="ts">
  import "$lib/global.css";

  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <meta
    name="description"
    content="How does working abroad affect social
  security?"
  />
  <title>Social Security International Agreements</title>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://ssa.tools/guides/international-agreements"
    },
    "headline": "Article headline",
    "image": [
      "https://ssa.tools/handshake.svg",
     ],
    "datePublished": "2022-06-26T00:00:00+00:00",
    "dateModified": "2022-06-26T00:00:00+00:00",
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
    <h1>Social Security International Agreements</h1>
    <p class="postdate">June 26, 2022</p>
    <p>
      SSA.tools calculates social security benefits based on a person's earnings
      record, copy/pasted from ssa.gov. In cases of work abroad, this record may
      be insufficient to estimate one's benefit.
    </p>
    <p>
      Since the late 1970's, the United States has established a network of
      bilateral Social Security agreements that coordinate the U.S. Social
      Security program with the comparable programs of other countries.
      International Social Security agreements, often called "Totalization
      agreements", help fill gaps in benefit protection for workers who have
      divided their careers between the United States and another country.
    </p>
    <p>
      The ssa.gov website maintains a full list of all <a
        href="https://www.ssa.gov/international/agreements_overview.html"
        >Totalization Agreements</a
      >.
    </p>
    <p>
      These agreements allow earned income credits to be earned overseas and
      still count towards the minimum of 40 credits required for benefits in the
      US. They also allow for an adjusted benefit based on the amount of time
      employed in each location.
    </p>
    <p>
      This website does not provide a way to directly enter overseas earnings
      nor to compute the related benefits. It should be used as a starting
      point, but not the final answer, in a case of a multinational career.
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
          <a class="bigbtn" href="/calculator" role="button">Try it Now</a>
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