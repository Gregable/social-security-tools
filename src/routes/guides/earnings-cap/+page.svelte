<script lang="ts">
  import "$lib/global.css";

  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <meta
    name="description"
    content="How do Social Security annual earnings caps work?"
  />
  <title>Social Security Earnings Caps</title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://ssa.tools/guides/earnings-cap"
    },
    "headline": "Article headline",
    "datePublished": "2020-11-28T00:00:00+00:00",
    "dateModified": "2020-11-28T00:00:00+00:00",
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
  <h1>Earnings Caps by year</h1>
  <p class="postdate">August 8, 2023</p>
  <p>
    There is an annual limit on the amount of personal earnings that subject to
    payroll, or Social Security tax. Above that amount, payroll taxes are no
    longer applied to one's earnings. This same limit is applied to how much of
    one's earnings can be applied to their benefit calculation. For 2023, this
    limit is $160,200. Earnings above that amount are not subject to payroll
    tax, and do not affect your social security benefit, <abbr
      title="Primary Insurance
        Amount">PIA</abbr
    >, or
    <abbr title="Average Indexed Monthly Earnings">AIME</abbr>.
  </p>
  <p>
    This cap is updated every year to account for wage growth. In the following
    table, you can see the cap for every year since 1956:
  </p>
  <div class="css-column">
    <div>
      <span>1956</span>
      <span>$4,200</span>
    </div>
    <div>
      <span>1957</span>
      <span>$4,200</span>
    </div>
    <div>
      <span>1958</span>
      <span>$2,400</span>
    </div>
    <div>
      <span>1959</span>
      <span>$4,800</span>
    </div>
    <div>
      <span>1960</span>
      <span>$4,800</span>
    </div>
    <div>
      <span>1961</span>
      <span>$4,800</span>
    </div>
    <div>
      <span>1962</span>
      <span>$4,800</span>
    </div>
    <div>
      <span>1963</span>
      <span>$4,800</span>
    </div>
    <div>
      <span>1964</span>
      <span>$4,800</span>
    </div>
    <div>
      <span>1965</span>
      <span>$4,800</span>
    </div>
    <div>
      <span>1966</span>
      <span>$6,600</span>
    </div>
    <div>
      <span>1967</span>
      <span>$6,600</span>
    </div>
    <div>
      <span>1968</span>
      <span>$7,800</span>
    </div>
    <div>
      <span>1969</span>
      <span>$7,800</span>
    </div>
    <div>
      <span>1970</span>
      <span>$7,800</span>
    </div>
    <div>
      <span>1971</span>
      <span>$7,800</span>
    </div>
    <div>
      <span>1972</span>
      <span>$9,000</span>
    </div>
    <div>
      <span>1973</span>
      <span>$10,800</span>
    </div>
    <div>
      <span>1974</span>
      <span>$13,200</span>
    </div>
    <div>
      <span>1975</span>
      <span>$14,100</span>
    </div>
    <div>
      <span>1976</span>
      <span>$15,300</span>
    </div>
    <div>
      <span>1977</span>
      <span>$16,500</span>
    </div>
    <div>
      <span>1978</span>
      <span>$17,700</span>
    </div>
    <div>
      <span>1979</span>
      <span>$22,900</span>
    </div>
    <div>
      <span>1980</span>
      <span>$25,900</span>
    </div>
    <div>
      <span>1981</span>
      <span>$29,700</span>
    </div>
    <div>
      <span>1982</span>
      <span>$32,400</span>
    </div>
    <div>
      <span>1983</span>
      <span>$35,700</span>
    </div>
    <div>
      <span>1984</span>
      <span>$37,800</span>
    </div>
    <div>
      <span>1985</span>
      <span>$39,600</span>
    </div>
    <div>
      <span>1986</span>
      <span>$42,000</span>
    </div>
    <div>
      <span>1987</span>
      <span>$43,800</span>
    </div>
    <div>
      <span>1988</span>
      <span>$45,000</span>
    </div>
    <div>
      <span>1989</span>
      <span>$48,000</span>
    </div>
    <div>
      <span>1990</span>
      <span>$51,300</span>
    </div>
    <div>
      <span>1991</span>
      <span>$53,400</span>
    </div>
    <div>
      <span>1992</span>
      <span>$55,500</span>
    </div>
    <div>
      <span>1993</span>
      <span>$57,600</span>
    </div>
    <div>
      <span>1994</span>
      <span>$60,600</span>
    </div>
    <div>
      <span>1995</span>
      <span>$61,200</span>
    </div>
    <div>
      <span>1996</span>
      <span>$62,700</span>
    </div>
    <div>
      <span>1997</span>
      <span>$65,400</span>
    </div>
    <div>
      <span>1998</span>
      <span>$68,400</span>
    </div>
    <div>
      <span>1999</span>
      <span>$72,600</span>
    </div>
    <div>
      <span>2000</span>
      <span>$76,200</span>
    </div>
    <div>
      <span>2001</span>
      <span>$80,400</span>
    </div>
    <div>
      <span>2002</span>
      <span>$84,900</span>
    </div>
    <div>
      <span>2003</span>
      <span>$87,000</span>
    </div>
    <div>
      <span>2004</span>
      <span>$87,900</span>
    </div>
    <div>
      <span>2005</span>
      <span>$90,000</span>
    </div>
    <div>
      <span>2006</span>
      <span>$94,200</span>
    </div>
    <div>
      <span>2007</span>
      <span>$97,500</span>
    </div>
    <div>
      <span>2008</span>
      <span>$102,000</span>
    </div>
    <div>
      <span>2009</span>
      <span>$106,800</span>
    </div>
    <div>
      <span>2010</span>
      <span>$106,800</span>
    </div>
    <div>
      <span>2011</span>
      <span>$106,800</span>
    </div>
    <div>
      <span>2012</span>
      <span>$110,100</span>
    </div>
    <div>
      <span>2013</span>
      <span>$113,700</span>
    </div>
    <div>
      <span>2014</span>
      <span>$117,000</span>
    </div>
    <div>
      <span>2015</span>
      <span>$118,500</span>
    </div>
    <div>
      <span>2016</span>
      <span>$118,500</span>
    </div>
    <div>
      <span>2017</span>
      <span>$127,200</span>
    </div>
    <div>
      <span>2018</span>
      <span>$128,400</span>
    </div>
    <div>
      <span>2019</span>
      <span>$132,900</span>
    </div>
    <div>
      <span>2020</span>
      <span>$137,700</span>
    </div>
    <div>
      <span>2021</span>
      <span>$142,800</span>
    </div>
    <div>
      <span>2022</span>
      <span>$147,000</span>
    </div>
    <div>
      <span>2023</span>
      <span>$160,200</span>
    </div>
  </div>
  <p>
    The cap for years 1937 - 1974 and for 1979 - 1981 was set by statute. The
    cap for all other years is set by an automatic calculation as specified by
    the Social Security Act.
  </p>
  <p>
    The formula for a given year X takes the National Average Wage Index (AWI)
    for year (X - 2), divides this by $22,935.42 which was the AWI in 1992, and
    multiplies it by $60,600 which was the cap in 1994.
  </p>
  <p>Useful Links:</p>
  <ul>
    <li>
      <a href="https://www.ssa.gov/oact/cola/cbb.html">
        Contribution and Benefit Base
      </a>
      [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/cbbdet.html">
        Contribution and Benefit Base Determination
      </a>
      [ssa.gov]
    </li>
    <li>
      <a href="https://www.ssa.gov/oact/cola/AWI.html">
        Average Wage Index since 1951
      </a>
      [ssa.gov]
    </li>
  </ul>

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

  .css-column {
    column-count: 4;
    width: 90%;
    column-rule: 1px solid lightblue;
    margin: 2em;
  }

  .css-column span {
    margin-right: 1.5em;
    margin-left: 1.5em;
    font-size: 14px;
  }
</style>