<script lang="ts">
  import "$lib/global.css";

  import Header from "$lib/components/Header.svelte";
</script>

<svelte:head>
  <meta
    name="description"
    content="Learn more about how Social Security law is affected by the day of the month one was born in."
  />
  <title>
    Extra rules for those born on the 1st or 2nd of the month | SSA.tools
  </title>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://ssa.tools/guides/1st-and-2nd-of-month"
    },
    "headline": "Extra rules for those born on the 1st or 2nd of the month",
    "image": [
      "https://ssa.tools/calendar.svg"
    ],
    "datePublished": "2022-06-05T00:00:00+00:00",
    "dateModified": "2023-01-07T00:00:00+00:00",
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
    <h1>Extra rules for those born on the 1st or 2nd of the month</h1>
    <img
      class="hero"
      src="/calendar.svg"
      width="233"
      height="200"
      alt="Clipart of a calendar"
    />

    <p class="postdate">Published: Jun 05, 2022</p>
    <p class="postdate">Updated: Jan 07, 2023</p>
    <p>
      Social Security calculates and pays benefits <i>monthly</i>. However there
      are still several rules that are affected by the day of the month that you
      were born.
    </p>
    <div style="clear: both;" />
    <h2>Eligibility</h2>
    <p>
      Eligibility rules have to do with what month you are first eligible to
      recieve social security benefits. There are a couple rules that interact
      with the day of the month:
    </p>
    <ol>
      <li>
        Social Security is based on English Common Law which states that you
        "attain" a particular age on the day before your birthday. So, if you
        are born on May 1, you will attain age 62 on April 30.
      </li>
      <li>
        You are eligible for a benefit on the first month that you are a
        particular age through the entire month.
      </li>
    </ol>
    <br style="clear:all" />
    <p>
      Rule #2 interacts with rule #1. Let's illustrate with three example
      birthdays:
    </p>
    <ul>
      <li>
        <b>May 1, 1960</b>: Attained 62 on April 30, 2022. First month age 62
        through the entire month is <b>May</b>, 2022.
      </li>
      <li>
        <b>May 2, 1960</b>: Attained 62 on May 1, 2022. First month age 62
        through the entire month is <b>May</b>, 2022.
      </li>
      <li>
        <b>May 3, 1960</b>: Attained 62 on May 2, 2022. First month age 62
        through the entire month is <b>June</b>, 2022.
      </li>
    </ul>
    Some resources will tell you that the first month you can begin benefits is 62
    + 1 month. The third example above shows where this comes from, but it doesn't
    apply if you were born on the 1st or 2nd of a month.

    <h2>Benefit Payment Date</h2>
    In most cases, the date of payment is also based on the day of the month you
    were born:
    <ul>
      <li>
        If you were born on the 1st through the 10th of the month, you’ll be
        paid on the second Wednesday of the month.
      </li>
      <li>
        If you were born on the 11th through the 20th of the month, you’ll be
        paid on the third Wednesday of the month.
      </li>
      <li>
        If you were born after the 20th of the month, you’ll be paid on the
        fourth Wednesday of the month.
      </li>
    </ul>
    <p>
      There are some exceptions though. If you recieve a benefit based on
      someone else's work record, such as a spousal benefit, this will be paid
      the same day as the primary beneficiary.
    </p>
    <p>
      There are also certain recipients who may recieve payment on the 3rd of
      the month:
    </p>
    <ul>
      <li>You filed for benefits before May 1, 1997</li>
      <li>You also receive a Supplemental Security Income (SSI) payment;</li>
      <li>Your Medicare premiums are paid for by the state where you live.</li>
      <li>You live in a foreign country.</li>
    </ul>
    <p>
      And finally federal holidays or weekends bump the payment to the
      non-holiday weekday immediately preceding the scheduled date.
    </p>
    <p>
      Another way to view the payment date is the <a
        href="https://www.ssa.gov/pubs/EN-05-10031-2023.pdf"
        >Schedule of Social Security Benefit Payments 2023</a
      >:
    </p>
    <a href="https://www.ssa.gov/pubs/EN-05-10031-2023.pdf">
      <img
        src="/PaymentSchedule2023.png"
        alt="Social Security Payment Schedule 2023"
        width="781"
        height="1023"
        loading="lazy"
      />
    </a>
    <br /><br /><br />
    <p>
      When you enter your birthdate into the <a href="/calculator"
        >SSA.Tools Calculator</a
      >, these rules are taken into account for you.
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

  @media screen and (max-width: 420px) {
    img.hero {
      max-width: 20em;
      margin: 0 2em 2em 0;
    }
  }

  @media screen and (min-width: 421px) {
    img.hero {
      max-width: 20em;
      position: relative;
      float: left;
      margin: 0 2em 2em 0;
    }
  }
</style>