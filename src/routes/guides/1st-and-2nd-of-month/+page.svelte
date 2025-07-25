<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";
  import HeroImage from "./hero.png";

  const title = "Extra rules for those born on the 1st or 2nd of the month";
  const description =
    "Learn more about how Social Security law is affected by the day of the month one was born in.";
  const publishDate = new Date("2022-06-05T00:00:00+00:00");
  const updateDate = new Date("2023-01-07T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/1st-and-2nd-of-month";
  schema.title = title;
  schema.image = HeroImage;
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
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
  <p class="postdate">
    Published: {publishDate.toLocaleDateString()}<br />
    Updated: {updateDate.toLocaleDateString()}
  </p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="Birthday poster hung on a wall with cake and balloons"
    />
  </figure>

  <p>
    Social Security calculates and pays benefits <i>monthly</i>. However there
    are still several rules that are affected by the day of the month that you
    were born.
  </p>

  <h2>Eligibility</h2>
  <p>
    Eligibility rules have to do with what is the earliest month you are first
    eligible to receive social security benefits. There are a couple rules that
    interact with the day of the month:
  </p>
  <ol>
    <li>
      Social Security is based on English Common Law which states that you
      "attain" a particular age on the day before your birthday. So, if you are
      born on May 1, you will attain age 62 on April 30.
    </li>
    <li>
      You are eligible for a benefit on the first month that you are a
      particular age through the entire month.
    </li>
  </ol>
  <br style:clear="all" />
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
      <b>May 2, 1960</b>: Attained 62 on May 1, 2022. First month age 62 through
      the entire month is <b>May</b>, 2022.
    </li>
    <li>
      <b>May 3, 1960</b>: Attained 62 on May 2, 2022. First month age 62 through
      the entire month is <b>June</b>, 2022.
    </li>
  </ul>
  Some resources will tell you that the first month you can begin benefits is 62
  + 1 month. The third example above shows where this comes from, but it doesn't
  apply if you were born on the 1st or 2nd of a month.

  <h2>Normal Retirement Age</h2>
  <p>
    Also known as <u>Full Retirement Age</u>. This is the age at which if you
    file to start benefits, you benefit will equal your Primary Insurance Amount
    with no reductions from starting early or delayed credit increases for
    delaying benefits. Normal Retirement Age varies by year of birth. Currently
    anyone born in 1960 or later has a Normal Retirement Age of 67.
  </p>
  <p>
    The month of your normal retirement age is the month that you attain that
    age. Just like eligbility, Social Security is based on English Common Law
    which states that you "attain" a particular age on the day before your
    birthday. So, if you are born on May 1, you will attain age 67 on April 30.
  </p>
  <p>
    Unlike eligbility though, you don't need to be 67 for the entire month for
    that month to be your Normal Retirement Age.
  </p>
  <p>Let's illustrate with the same three example birthdays:</p>
  <ul>
    <li>
      <b>May 1, 1960</b>: Attained 67 on April 30, 2027. Normal Retirement Age
      is <b>April</b>, 2027.
    </li>
    <li>
      <b>May 2, 1960</b>: Attained 67 on May 1, 2027. Normal Retirement Age is
      <b>May</b>, 2027.
    </li>
    <li>
      <b>May 3, 1960</b>: Attained 67 on May 2, 2027. Normal Retirement Age is
      <b>May</b>, 2027.
    </li>
  </ul>

  <h2>Benefit Payment Date</h2>
  In most cases, the date of payment is also based on the day of the month you were
  born:
  <ul>
    <li>
      If you were born on the 1st through the 10th of the month, you’ll be paid
      on the second Wednesday of the month.
    </li>
    <li>
      If you were born on the 11th through the 20th of the month, you’ll be paid
      on the third Wednesday of the month.
    </li>
    <li>
      If you were born after the 20th of the month, you’ll be paid on the fourth
      Wednesday of the month.
    </li>
  </ul>
  <p>
    There are some exceptions though. If you receive a benefit based on someone
    else's work record, such as a spousal benefit, this will be paid the same
    day as the primary beneficiary.
  </p>
  <p>
    There are also certain recipients who may receive payment on the 3rd of the
    month:
  </p>
  <ul>
    <li>You filed for benefits before May 1, 1997</li>
    <li>You also receive a Supplemental Security Income (SSI) payment;</li>
    <li>Your Medicare premiums are paid for by the state where you live.</li>
    <li>You live in a foreign country.</li>
  </ul>
  <p>
    And finally federal holidays or weekends bump the payment to the non-holiday
    weekday immediately preceding the scheduled date.
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
  <GuideFooter />
</div>
