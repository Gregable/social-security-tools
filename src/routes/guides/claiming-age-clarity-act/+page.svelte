<script lang="ts">
import {
  type ClaimAgeRow,
  claimAgeRows,
  EXAMPLE_PIA,
  exampleRetiree,
} from '$lib/break-even-example';
import { guideDates } from '$lib/guide-dates';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import GuideByline from '../GuideByline.svelte';
import InlineCTA from '../InlineCTA.svelte';

const title =
  'Claiming Age Clarity Act: New Social Security Names for Ages 62, Full Retirement Age, and 70';
const description =
  'The Claiming Age Clarity Act renames Social Security claiming ages: minimum, standard, and maximum monthly benefit age. What changes, what stays the same, and when.';
const { publishDate, updateDate } = guideDates('claiming-age-clarity-act');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/claiming-age-clarity-act';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Claiming Age Clarity Act: minimum, standard, and maximum monthly benefit ages';
schema.tags = [
  'Claiming Age Clarity Act',
  'H.R. 5284',
  'standard monthly benefit age',
  'minimum monthly benefit age',
  'maximum monthly benefit age',
  'full retirement age renamed',
  'delayed retirement credits',
  'Social Security terminology',
];

// The worked example reuses the break-even guide's retiree, whose figures
// are pinned in break-even-example.test.ts.
const retiree = exampleRetiree();
const rows = claimAgeRows(retiree);
const standardAge = retiree.normalRetirementAge();
const birthYear = retiree.birthdate.layBirthYear();

// claimAgeRows has one row per whole year, so the standard-age row exists
// only while the example's standard age is a whole year.
if (standardAge.modMonths() !== 0) {
  throw new Error('Example standard monthly benefit age must be a whole year');
}

function rowAt(years: number): ClaimAgeRow {
  const row = rows.find((r) => r.age.years() === years);
  if (row === undefined) {
    throw new Error(`No claim-age row for age ${years}`);
  }
  return row;
}

function percentOfPia(row: ClaimAgeRow): number {
  return Math.round((row.benefit.cents() / EXAMPLE_PIA.cents()) * 100);
}

const minimum = rowAt(62);
const standard = rowAt(standardAge.years());
const maximum = rowAt(70);

const faqs: FAQItem[] = [
  {
    question: 'What is the Claiming Age Clarity Act?',
    answer:
      'A federal law, signed on November 20, 2026, that requires the Social Security Administration to use new names for the ages at which you can claim retirement benefits. Age 62 becomes the minimum monthly benefit age, full retirement age becomes the standard monthly benefit age, and age 70 becomes the maximum monthly benefit age.',
  },
  {
    question: 'Does the Claiming Age Clarity Act change my Social Security benefit?',
    answer:
      'No. It changes only the words Social Security uses. Your benefit, the ages at which you can claim, the reduction for claiming early, and the increase for waiting are all unchanged.',
  },
  {
    question: 'What is the standard monthly benefit age?',
    answer:
      'It is the new name for full retirement age, also called normal retirement age. It is the age at which you receive your full Primary Insurance Amount, with no reduction for claiming early and no increase for waiting. It is 66 for people born from 1943 through 1954, rises by two months a year for people born from 1955 through 1959, and is 67 for people born in 1960 or later.',
  },
  {
    question: 'Did the retirement age change?',
    answer:
      'No. The standard monthly benefit age is the same age that was called full retirement age, between 66 and 67 depending on your birth year. You can still claim as early as 62, and benefits still stop growing at 70.',
  },
  {
    question: 'What happened to delayed retirement credits?',
    answer:
      'The law says Social Security may no longer use the term "delayed retirement credit." The increase itself is unchanged: for people born in 1943 or later, waiting past the standard monthly benefit age still raises your benefit by two-thirds of one percent for each month, up to age 70. The law does not name a replacement term for the increase, so Social Security will choose its own wording.',
  },
  {
    question: 'When will Social Security start using the new terms?',
    answer:
      'The law gives Social Security until the later of January 1, 2027, or 12 months after the law was signed. Because it was signed on November 20, 2026, the deadline is November 20, 2027. Until then, you may see both the old and new terms on ssa.gov and in letters.',
  },
  {
    question: 'Does the maximum monthly benefit age mean I should wait until 70?',
    answer:
      'Not necessarily. Age 70 gives the largest monthly benefit, but you receive it for fewer years. Whether waiting pays off depends on how long you live, your other income, and, if you are married, your spouse\'s benefits.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link
    rel="canonical"
    href="https://ssa.tools/guides/claiming-age-clarity-act"
  />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>
    Claiming Age Clarity Act: New Names for Ages 62, Full Retirement Age, and
    70
  </h1>
  <GuideByline {publishDate} {updateDate} />

  <p>
    On November 20, 2026, the President signed the
    <a href="https://www.congress.gov/bill/119th-congress/house-bill/5284"
      >Claiming Age Clarity Act</a
    > (H.R. 5284) into law. It requires the Social Security Administration to
    stop using the terms "full retirement age," "normal retirement age,"
    "early eligibility age," and "delayed retirement credit," and to use new
    names that describe how each claiming age affects your monthly benefit.
  </p>

  <p>
    The law changes only the words. It does not change any benefit amount,
    any claiming age, or any rule about how benefits are calculated.
  </p>

  <h2>The Old and New Terms</h2>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">Old term</th>
        <th scope="col">New term</th>
        <th scope="col">What it means</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Early eligibility age</td>
        <td>Minimum monthly benefit age</td>
        <td>
          Age 62, the earliest age you can claim retirement benefits. Claiming
          then gives the smallest monthly benefit.
        </td>
      </tr>
      <tr>
        <td>Full retirement age, normal retirement age</td>
        <td>Standard monthly benefit age</td>
        <td>
          66 to 67, depending on your birth year. Claiming then gives your full
          <a href="/guides/pia">Primary Insurance Amount</a>.
        </td>
      </tr>
      <tr>
        <td>Age 70, the latest age delayed retirement credits build</td>
        <td>Maximum monthly benefit age</td>
        <td>
          Claiming at 70 gives the largest monthly benefit. Waiting longer
          does not raise it further.
        </td>
      </tr>
      <tr>
        <td>Delayed retirement credit</td>
        <td>No longer used</td>
        <td>
          The increase for claiming after the standard monthly benefit age.
          The law retires the term but does not name a replacement.
        </td>
      </tr>
    </tbody>
  </table>

  <p>
    Each new name describes the monthly check, not your total lifetime
    benefits. Claiming at the maximum monthly benefit age gives the largest
    check, but you collect it for fewer years.
  </p>

  <h2>What Stays the Same</h2>

  <ul>
    <li>
      You can still claim retirement benefits as early as 62, and benefits
      stop growing at 70.
    </li>
    <li>
      The standard monthly benefit age is the same age that was called full
      retirement age:
      <a href="/guides/nra">66 for people born from 1943 through 1954</a>,
      rising by two months a year to 67 for people born in 1960 or later.
    </li>
    <li>
      The reduction for claiming before that age and the
      <a href="/guides/delayed-retirement-credits">increase for claiming after it</a>
      are unchanged.
    </li>
    <li>
      Spousal benefits, survivor benefits, and the
      <a href="/guides/earnings-test">earnings test</a> work as before.
    </li>
    <li>
      The Social Security Act itself is not amended. The law directs Social
      Security's rules, regulations, guidance, and other materials, online
      and in print, to use the new terms.
    </li>
  </ul>

  <h2>Example: The Three Ages for One Retiree</h2>

  <p>
    A retiree born in {birthYear} has a standard monthly benefit age of
    {standardAge.years()} and a Primary Insurance Amount of
    {EXAMPLE_PIA.wholeDollars()}. Here is the monthly benefit at each of the
    three named ages, in today's dollars:
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">Claiming age</th>
        <th scope="col">New name</th>
        <th scope="col">Monthly benefit</th>
        <th scope="col">Share of PIA</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{minimum.age.years()}</td>
        <td>Minimum monthly benefit age</td>
        <td>{minimum.benefit.wholeDollars()}</td>
        <td>{percentOfPia(minimum)}%</td>
      </tr>
      <tr>
        <td>{standard.age.years()}</td>
        <td>Standard monthly benefit age</td>
        <td>{standard.benefit.wholeDollars()}</td>
        <td>{percentOfPia(standard)}%</td>
      </tr>
      <tr>
        <td>{maximum.age.years()}</td>
        <td>Maximum monthly benefit age</td>
        <td>{maximum.benefit.wholeDollars()}</td>
        <td>{percentOfPia(maximum)}%</td>
      </tr>
    </tbody>
  </table>

  <p>
    Every month between 62 and 70 is a valid choice, and each one gives a
    different benefit. The <a href="/guides/break-even-age">break-even age guide</a>
    shows the full range for this retiree and when a later claim catches up
    with an earlier one.
  </p>

  <InlineCTA type="calculator" />

  <h2>Why Congress Changed the Terms</h2>

  <p>
    Age 62 is the most common age to claim. According to the
    <a href="https://www.congress.gov/crs-product/IN12630"
      >Congressional Research Service</a
    >, 26% of people who started retirement benefits in 2024 claimed at 62.
    Supporters of the law argued that the old terms do not make clear how
    much the claiming age changes the monthly benefit. "Full retirement age,"
    for example, can suggest the largest benefit available, when waiting
    past it still raises the benefit until 70. The Research Service also
    notes that researchers testing the alternative names (minimum, standard,
    and maximum benefit age) found that people understood the claiming ages
    better.
  </p>

  <p>
    The bill was introduced in the House by Representatives Lloyd Smucker
    and Don Beyer on September 10, 2025, alongside an identical Senate bill
    from Senator Bill Cassidy. The House passed it by voice vote on December
    1, 2025, the Senate passed it in 2026, and it was signed on November 20,
    2026.
  </p>

  <h2>When You Will See the New Terms</h2>

  <p>
    Social Security must switch to the new terms by the later of January 1,
    2027, or 12 months after the law was signed. That makes the deadline
    November 20, 2027.
  </p>

  <p>
    Until then, expect a mix. Some pages on ssa.gov, your
    <a href="https://www.ssa.gov/myaccount/statement.html"
      >Social Security Statement</a
    >, and letters from Social Security may use the old terms while others
    use the new ones. Books, financial planners, news articles, and other
    calculators are not covered by the law and may keep using "full
    retirement age" for years. Both names refer to the same age.
  </p>

  <h2>Terms Used on SSA.tools</h2>

  <p>
    SSA.tools currently uses "full retirement age," "normal retirement age,"
    and "delayed retirement credits" throughout its calculator and guides.
    We will change these terms over time as ssa.gov adopts the new ones, so
    that the words here match what you see from Social Security. During the
    change, some pages may use the old terms and some the new ones. They
    mean the same thing.
  </p>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Sources</h2>

  <ul>
    <li>
      <a
        href="https://www.govinfo.gov/content/pkg/BILLS-119hr5284enr/html/BILLS-119hr5284enr.htm"
        >H.R. 5284, Claiming Age Clarity Act, enrolled bill text</a
      >
    </li>
    <li>
      <a href="https://www.congress.gov/bill/119th-congress/house-bill/5284"
        >Congress.gov: H.R. 5284, Claiming Age Clarity Act</a
      >
    </li>
    <li>
      <a
        href="https://www.whitehouse.gov/briefings-statements/2026/11/congressional-bills-h-r-5284-h-r-8352-and-h-r-10159-signed-into-law/"
        >The White House: Congressional Bills H.R. 5284, H.R. 8352, and H.R.
        10159 Signed into Law</a
      >
    </li>
    <li>
      <a href="https://www.congress.gov/crs-product/IN12630"
        >Congressional Research Service IN12630: Claiming Age Clarity Act (H.R.
        5284): Background for Congress</a
      >
    </li>
    <li>
      <a
        href="https://smucker.house.gov/media/press-releases/smuckers-bipartisan-claiming-age-clarity-act-signed-law"
        >Rep. Lloyd Smucker: Bipartisan Claiming Age Clarity Act Signed Into
        Law</a
      >
    </li>
  </ul>

  <GuideFooter />
</div>

<style>
  .rule-table {
    width: fit-content;
    max-width: 100%;
    border-collapse: collapse;
    margin: 20px auto;
  }

  .rule-table th,
  .rule-table td {
    border: 1px solid #ccc;
    padding: 8px 16px;
    text-align: left;
    vertical-align: top;
  }

  .rule-table th {
    background-color: #f5f5f5;
  }
</style>
