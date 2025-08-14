<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import GuideFooter from '../guide-footer.svelte';
  import HeroImage from './hero.png';

  const title = 'Social Security Indexing Factors';
  const description =
    "Why use the current year's indexing factors for someone younger than 62?";
  const publishDate = new Date('2020-12-28T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/indexing-factors';
  schema.title = title;
  schema.image = HeroImage; // Added HeroImage to schema
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
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="Chalkboard with unintelligble mathematics writing"
    />
  </figure>

  <p>
    Yesterday, Josh Scandlen posted a <a
      href="https://www.youtube.com/watch?v=JZXymvFm8uw&t=78s">YouTube video</a
    >
    discussing the <a href="/">SSA.tools Calculator</a>. One of the concerns
    raised in the video was that for folks currently under age 62, SSA.tools
    uses incorrect Indexing Factors. In the example, the user was born in 1970
    and is thus 50 years old in 2020. The indexing factors for a 1970 year old
    will be determined in 2032, at the age that the recipient turns 62.
    SSA.tools makes all of its calculations using index factors for someone
    turning 62 in 2021 however, which seems initially incorrect.
  </p>
  <h2>Short version. tl;dr:</h2>
  <p>
    SSA.tools uses the latest current indexing factors rather than future
    estimated values so that all of the numbers presented in the report are in
    "today's dollars". Another way to think of this is that the values are
    adjusted for future inflation. If you use estimated indexing factors for
    2032 while the current year is 2020, the report will present benefits in
    inflated 2032 dollars amounts, which can give an extra rosy interpretation
    of one's benefits when comparing against one's current
    not-inflation-adjusted expenses.
  </p>
  <p>
    The reports that the Social Security Administration presents operate the
    same way, using the latest index factors rather than the future estimated
    values.
  </p>
  <h2>Longer version</h2>
  <p>
    For the sake of illustration, let's consider a social security recipient
    named Alex born in 1970 and the year is currently 2020. After Alex enters
    her social security earnings record into ssa.tools, it displays a table that
    looks like this:
  </p>
  <img
    src="/indexing-factors-guide-earnings-record.jpg"
    style:margin="auto"
    style:display="block"
    alt="Earnings record for a hypothetical user"
  />
  <p>
    We see that in 1984, Alex earned $16,035 which is multiplied by an earnings
    factor of <b>3.35</b> for an indexed earnings value of $16,035 x 3.35 = $53.765.
  </p>
  <p>
    Alex then looks at the official <a
      href="https://www.ssa.gov/oact/cola/awifactors.html"
      >ssa.gov Index Factors for Earnings</a
    > which explains that Alex's year of eligibility will be 2032 when Alex turns
    62. Alex enters 2032 and ssa.gov displays a table that looks like this:
  </p>
  <img
    src="/indexing-factors-guide-awi-factors.jpg"
    style:margin="auto"
    style:display="block"
    alt="ssa.gov's index factors for 2032"
  />
  <p>
    The ssa.tools calculator shows an index factor for 1984 of <b>3.35</b>
    while ssa.gov shows <b>5.0878930</b>, clearly disagreeing. In fact every
    index factor seems off. Every year is off by approximately the same amount
    too: the ssa.gov numbers are all 52% higher than the ssa.tools numbers. Why?
  </p>
  <p>
    On <a href="https://www.ssa.gov/oact/cola/awifactors.html"
      >ssa.gov's Indexing Factors page</a
    >, there is a clue to what's going on:
  </p>
  <img
    src="/indexing-factors-guide-year-of-eligibility.jpg"
    style:margin="auto"
    style:display="block"
    style:border="1px solid #aaa"
    alt="Year of eligibility: Note if you select a year after 2021, we will use
    the average wage changes that were estimated under the intermediate
    assumptions in the latest Trustees Report."
  />
  <p>
    If Alex instead enters 2021 as the year of eligibility, Alex will get the
    exact same numbers as ssa.tools uses: 3.35 in 1984 and so on. So, which
    number is correct?
  </p>
  <p>
    We first need to understand how the indexing factors are determined. These
    numbers are not just selected by a governing body; there is instead a simple
    formula that determines them. The calculation will actually be made in the
    year that Alex turns 62, which is 2032. In 2032, index factors are
    calculated for Alex for every year up to and including the year she turned
    60. Every year after that, the multiplier will always be 1.0. For the years
    up until 60, the multiplier for a given year will be the Average Wage Index
    (AWI) in the year she turned 60 divided by the AWI of the multiplier year:
  </p>

  <table style:margin="auto">
    <tbody>
      <tr>
        <td rowspan="2" style:padding="6px" style:text-align="center"
          >Multiplier (year X) =</td
        >
        <td
          style:border-bottom="1px solid black"
          style:padding="6px"
          style:text-align="center">AWI (year 2030)</td
        >
      </tr>
      <tr>
        <td style:padding="6px" style:text-align="center">AWI (year X)</td>
      </tr>
    </tbody>
  </table>

  <p>
    The problem is that until 2032, we don't know these values. AWI stands for
    the "Average Wage Index". It is the average of all of the wages reported by
    everyone in the country in that year. We can't know that value until at
    least the following year. The data is based on tax returns, so with late
    filing and so forth, the actual number won't really be known until very late
    in the following year, which makes it available for use in the year after
    that (2 years later). This is why 2030 numbers are used in 2032.
  </p>
  <p>
    The AWI numbers that ssa.gov displays for eligibility years after 2021 are
    all just estimates based on models of what wages might be like in the
    future. Nobody knows this for certain yet, but we can make reasonable
    guesses. The guesses become more accurate the closer we get to that year.
  </p>
  <p>
    This is why all of the numbers differ by 52% between the 2021 and the 2032
    earnings factors. 52% is the estimated increase in average wage between 2019
    and 2030. From <a
      href="https://www.ssa.gov/oact/TR/2020/VI_G3_OASDHI_dollars.html#182913"
      >Table VI.G6</a
    >
    we see that the AWI in 2019 is $53,756.28 and the <i>estimated</i> AWI in 2030
    is $81,571.95. $81,571.95 / $53,756.28 = 152%.
  </p>
  <p>
    Why don't we use the estimates, even if they might be a little off?
    Inflation.
  </p>
  <p>
    The difference between the AWI in 2019 and 2030 is wage inflation. The
    indexing factors exist to adjust for wage inflation over time. The Social
    Security Administration expects average wages to increase by 52% between
    2019 and 2030. Alex's costs will increase as well. If Alex were to compare
    her 2032 monthly benefit of $3,000 against her 2020 monthly expenses of
    $2,800, Alex may think that her benefit will entirely cover her expenses
    with 10% left over. Instead, that $2,800 will cost much more due to
    inflation by 2032. We don't know the exact amount, but one estimate might be
    52% - the amount wages will inflate by then. That $2,800 would then cost
    $2,800 x 1.52 = $4,256.
  </p>
  <p>
    By showing Alex's benefit in 2020 dollars, using today's latest AWI from
    2019, we show Alex a benefit that she can directly compare to her expenses
    today. The benefit is approximately "inflation adjusted".
  </p>
  <p>
    This is the same methodology that the Social Security Administration uses
    when producing an estimate of your future benefit at retirement age, when
    you get an annual report either in the mail or at ssa.gov. The estimate
    assumes you will continue to earn the same amount as last year for every
    year going forward until age 62. It then applies the benefit formula using
    this year's Indexing Factors, giving you an estimate in today's dollars.
  </p>
  <h2>More reading</h2>
  <p>
    There are actually multiple ways to measure inflation. Wage inflation is
    only one of them, and it varies from price inflation. Typically wages grow a
    little faster than prices. Price inflation also has an effect on the formula
    for your social security benefit. To understand more, take a look at our
    guide on <a href="./inflation"
      >How inflation rate affects Social Security benefit calculations.</a
    >
  </p>
  <p>
    The Indexing Factors that adjust one's benefit are all determined based on
    the AWI in the year that one turns 60 years old. In 2020, Covid-19 has had
    an unusually large impact on the nation's Average Wages in a manner that
    will likely negatively impact those who turn 60 that year. If you were born
    in 1960, take a look at our guide answering the question: <a
      href="./covid-awi-drop"
      >Will a weak economy in 2020 result in a benefits decrease for those born
      in 1960?</a
    >
  </p>
  <GuideFooter />
</div>
