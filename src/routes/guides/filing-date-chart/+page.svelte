<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";

  import HeroImage from "./hero.png";
  import SliderImage from "./slider.png";
  import MoneyAxisSingleImage from "./money-axis-single.png";
  import DateSelectBoxImage from "./date-select-box.png";
  import MultiUserImage from "./multi-user.png";

  const title = "Navigate the Filing Date Chart";
  const description =
    "This site's calculator shows a information dense chart of how filing dates affect your benefits. The chart can be a little confusing at first, so here's a guide to help you understand it.";
  const publishDate = new Date("2023-08-15T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/filing-date-chart";
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

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="623"
      height="564"
      alt="Screenshot of benefit chart for two users, Alex and Chris. Alex's benefit is $2,005 / mo starting in mid 2016 and Chris's is initally $480 / mo in early 2015 increasing to $1,003 / mo when Alex begins collecting."
    />
    <figcaption>Combined filing date chart for an example couple</figcaption>
  </figure>

  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    This site's calculator shows a information dense chart of how filing dates
    affect your benefits. There are two versions of this chart: one for an
    individual, and another combined chart for couples. The combined version
    includes spousal benefits.
  </p>
  <p>
    The chart can be a little confusing at first, so this is a guide to help you
    understand it.
  </p>

  <h2>Time and Money</h2>

  <ul>
    <li>x-axis: Time</li>
    <li>y-axis: Benefit amount (in dollars)</li>
  </ul>

  <h3>Time</h3>

  <p>
    The horizontal axis is time, starting with the earliest date you can file
    for social security benefits and going into the future.
  </p>

  <p>
    Featured prominently at the top of the chart is a slider (or two in the case
    of the combined chart). Each slider is positioned in the same horizontal
    time axis as the chart data. In the example below, Alex turns 63 in the
    middle of 2013, so that point on the slider is positioned between 2013 and
    2014:
  </p>

  <figure>
    <img
      src={SliderImage}
      width="716"
      height="164"
      alt="Screenshot of the filing date sliders showing ages from 62 to 70
    overlaid across years. At 66, the text NRA is shown."
    />
    <figcaption>
      Alex has selected a filing age of 66, his Normal Retirement Age (NRA).
      This age is in the middle of 2016.
    </figcaption>
  </figure>

  <p>
    Below the slider are vertical lines indicating the matching year. The years
    span from when the oldest person turns 62 to when the youngest person turns
    70.
  </p>

  <h3>Money</h3>

  <p>
    The verical axis is money, specifically the benefit's paid per month. In the
    single user case, the $0 amount is a the bottom of the chart.
  </p>

  <figure>
    <img
      src={MoneyAxisSingleImage}
      width="618"
      height="369"
      alt="Screenshot of the benefit section of the chart, showing a $2,005 / mo
    benefit starting in 2016."
    />
    <figcaption>
      User earns $2,005 / mo starting mid 2016. Had they filed in 2012, the
      benefit would be only $1,500.
    </figcaption>
  </figure>

  <p>
    The thin curved orange line on the chart shows the starting benefit amount
    for each starting point in time. As you can see in the example above, if the
    user had started back in 2012, their benefit would have been closer to
    $1,500 / mo.
  </p>

  <p>
    To see exactly what the benefit amount is at a given point in time, hover
    your mouse over the chart. On a touchscreen device, drag your finger across
    the chart. A blue vertical line will appear showing you exactly what date
    you have selected and the box at the bottom will show you the benefit amount
    for that date. Here's an example:
  </p>

  <figure>
    <img
      src={DateSelectBoxImage}
      width="733"
      height="608"
      alt="Screenshot showing the benefit amount selection tool."
    />
  </figure>

  <p>
    Here the user first started benefits mid-year in Oct 2016 at age 66 and 4
    mo. Their benefit was initially $2,005 but increased to $2,058 in January
    when <a href="/guides/delayed-january-bump">delayed credits</a> were applied.
    On the selected date of June 2018, the benefits are $2,071 / mo.
  </p>

  <h2>Combined Chart</h2>

  <p>
    For married couples, there is also a combined chart at the bottom of the
    report. This chart shows the combined benefit amount for both users
    overlayed on the same chart. It works the same way as the single user chart,
    except that the second user's benefit is shown growing downward from the $0
    line instead of upward. This allows both benefits to be shown on the same
    chart. Here's a complex example:
  </p>

  <figure>
    <img
      src={MultiUserImage}
      width="626"
      height="680"
      alt="Screenshot showing the combined benefit for two users, Alex and Chris."
    />
  </figure>

  <p>
    In this example, Alex's benefit starts at $2,098 / mo and rises to $2,232 /
    mo in <a href="/guides/delayed-january-bump">January</a>. Chris' benefit
    starts at $515 / mo, rises to $537 / mo in
    <a href="/guides/delayed-january-bump">January</a> and then rises again due to
    $1,060 / mo in spousal benefits when Alex files.
  </p>

  <p>
    As the second person whose data was entered, Chris' benefits are shown
    growing downward from the $0 line.
  </p>

  <p>
    Denoted by the blue line, the user has selected a date of Dec 2017 with
    their mouse or finger and the table at the bottom shows that in this month,
    the total benefit will be $3,158 which includes $1,060 from Chris' benefit
    and $2,098 from Alex's.
  </p>

  <p>
    This chart is information dense, which allows it to show a lot of useful
    information in one place. It can be a little confusing at first, but once
    you understand it, it's a powerful tool for understanding your social
    security benefits.
  </p>
  <GuideFooter />
</div>
