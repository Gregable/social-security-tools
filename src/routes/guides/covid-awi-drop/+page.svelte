<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";

  import HeroImage from "./covid-19.jpg";
  import CovidAimeImage from "./covid-aime.jpg";
  import CovidEarningsImage from "./covid-earnings.jpg";
  import CovidPiaImage from "./covid-pia.jpg";
  import CovidPia2Image from "./covid-pia-2.jpg";

  const title = "Effect of Covid-19 on Social Security Benefits";
  const description =
    "Will a weak economy in 2020 result in a benefits decrease for those born in 1960?";
  const publishDate = new Date("2020-12-01T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/covid-awi-drop"; // Corrected URL
  schema.title = title;
  schema.image = HeroImage;
  schema.datePublished = publishDate.toISOString();
  schema.description = description; // Pass the description to the schema
</script>

<svelte:head>
  <meta name="description" content={description} />
  <title>
    {title} | SSA.tools
  </title>
  {@html schema.render()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <img class="hero" src={HeroImage} alt="Artist depiction of Covid-19 virus" />
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>
  <p>
    Reddit user <a href="https://www.reddit.com/user/jgatcomb/">jgatcomb</a>
    started an interesting thread about the
    <a
      href="https://www.reddit.com/r/financialindependence/comments/k4rlv8/91_permanent_reduction_in_social_security/"
    >
      impact of Covid-19 on Social Security recipients born in 1960
    </a>. In it, jgatcomb referred to a
    <a
      href="https://www.morningstar.com/news/marketwatch/20200912157/a-drop-in-social-securitys-average-wage-index-could-hurt-four-million-people"
    >
      morningstar article
    </a> suggesting that those born in 1960 will potentially have their benefits
    permanently reduced by 9.1%. How true is this? Let's use the SSA.Tools calculator
    to understand this better.
  </p>
  <br style="clear:both" />
  <p>We want to simulate a earner who:</p>
  <ul>
    <li>Has 35 years of average earnings records.</li>
    <li>Their last record will be 2020.</li>
    <li>They were born in 1960.</li>
  </ul>
  <p>
    I've created a data file with exactly this setup. You can try it for
    yourself by copying the entire file at
    <a href="/covidpaste.txt">covidpaste.txt</a> and then pasting it in to the
    text box on the <a href="/calculator">SSA.tools Calculator</a>. After doing
    so, select a birthday in 1960, but not Jan 1, because with Social Security
    law, you attain an age the day before your standard birthday.
  </p>
  <p>The resulting earnings table will look like this:</p>
  <img
    src={CovidEarningsImage}
    style="margin: 2em auto 2em auto; display: block; border: 1px solid black"
    alt="Earnings table screenshot"
  />
  <p>
    From this table, Social Security will calculate your AIME or Average Indexed
    Monthly Earnings. If you have 35 vaules, it's really just the average of all
    of the values in the "Indexed Earnings" column divided by 12 to get from
    annual to monthly. The calculation is a little further down the page:
  </p>
  <img
    src={CovidAimeImage}
    style="margin: 2em auto 2em auto; display: block; border: 1px solid black"
    alt="AIME calculation resulting in $4,375"
  />
  <p>
    At this point, we can start to think about how Covid-19 might affect the
    AIME calculation for this 1960-born earner. The key is the "Multiplier"
    collumn in the earnings table. The ssa.tools calculator doesn't currently
    explain where these multipliers come from, since the user has no control
    over them, but I will attempt to do so now.
  </p>
  <p>
    These multipliers are only estimates until a person turns 62. In the year
    one turns 62, the final multipliers are calculated for all years up to and
    including age 60. All later years, the multiplier will always be 1.0. For
    the years up to and including age 60, the multipler for a given year will be
    the Average Wage Index (AWI) in the year you turned 60 divided by the AWI of
    the multiplier year. So, for someone who turns 60 in year 2020:
  </p>

  <table style="margin: auto">
    <tr>
      <td rowspan="2" style="padding: 6px; text-align: center;"
        >Multiplier (year X) =</td
      >
      <td
        style="border-bottom: 1px solid black; padding: 6px; text-align: center;"
        >AWI (year 2020)</td
      >
    </tr>
    <tr>
      <td style="padding: 6px; text-align: center;">AWI (year X)</td>
    </tr>
  </table>
  <p>
    We can then multiply this by Taxed Earnings to see how AWI affects the
    Indexed Earnings in each year:
  </p>
  <table style="margin: auto">
    <tr>
      <td rowspan="2" style="padding: 6px; text-align: center;"
        >Indexed Earnings (year X) =</td
      >
      <td
        style="border-bottom: 1px solid black; padding: 6px; text-align: center;"
        >Taxed Earnings (year X) x
        <b>AWI (year 2020)</b>
      </td>
    </tr>
    <tr>
      <td style="padding: 6px; text-align: center;">AWI (year X)</td>
    </tr>
  </table>
  <p>
    We can also see why calculations are made 2-years "late". The AWI for a
    given year is not known until taxes are filed the following year. So the AWI
    for 2020 won't be known until late in 2021. By the start of 2022, we will
    know the AWI correctly.
  </p>
  <p>
    Typically multipliers only increase every year, because typically AWI only
    increases every year, but this is not guaranteed. In fact, you can see the
    2008 multiplier is slightly lower than the 2009 multiplier (1.31 vs 1.33)
    because of the 2008 recession.
  </p>
  <p>
    How does Covid-19 factor into this? If the AWI (year 2020) is reduced by
    9.1% for example, then <u>every</u> Indexed Earnings value is also reduced
    by 9.1%. If <u>every</u> Indexed Earnings value is reduced by 9.1%, then the
    AIME is also reduced by 9.1% since it is just an average of the top 35 years
    of Indexed Earnings values.
  </p>
  <p>
    The morningstar article suggest that AWI could be 9.1% less than expected
    (or 5.9% less than 2019 depending on what you are comparing it to). This is
    based on the Social Security Trustees report, so it is probably a good
    estimate.
  </p>
  <p>
    The number one really cares about is the Primary Insurance Amount (PIA), not
    AIME, since PIA is the number that benefits are based on. However, since the
    bend points in the PIA formula are also adjusted by AWI, the effect on PIA
    is also very close to the same as on AIME. The calculator provides no easy
    means for manually modifying bend points to demonstrate easily, but we can
    do so manually for this example.
  </p>
  <p>
    First, let's see what the calculator predicts as the PIA if there was not a
    covid related drop:
  </p>
  <img
    src={CovidPiaImage}
    style="margin: 2em auto 2em auto; display: block; border: 1px solid
      black"
    alt="PIA without covid, predicted at $1,977.60"
  />

  <p>Next, adjust both the AIME and the bendpoints downward by 9.1%:</p>
  <img
    src={CovidPia2Image}
    style="margin: 2em auto 2em auto; display: block; border: 1px solid
      black"
    alt="PIA with covid, predicted at $1,798.40"
  />
  <p>
    Going from $1,977.60 to $1,798.40 is a 9.06% drop, very similar to the 9.1%
    number we started with. In conclusion, a significant drop in AWI in a single
    year can have an similarly outsized effect on the Social Security benefits
    for those who turn 60 in that year. In the history of the Social Security
    program, there has not been such a dramatic drop in AWI from one year to the
    next like Covid appears to have produced, so this has never been much of an
    issue until now.
  </p>
  <GuideFooter />
</div>
