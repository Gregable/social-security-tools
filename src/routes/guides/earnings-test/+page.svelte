<script lang="ts">
  import { GuidesSchema, renderFAQSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";

  const title =
    "Working While Receiving Social Security: The Earnings Test Explained";
  const description =
    "Can you work while collecting Social Security? Learn about the earnings test, 2025 and 2026 income limits, how benefits are reduced, and why withheld benefits are returned at full retirement age.";
  const publishDate = new Date("2026-01-26T00:00:00+00:00");
  const updateDate = new Date("2026-01-26T00:00:00+00:00");

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/earnings-test";
  schema.title = title;
  schema.image = "/laptop-piggybank.jpg";
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description;
  schema.imageAlt = "Social Security earnings test calculator";
  schema.tags = [
    "Social Security earnings test",
    "working while on Social Security",
    "Social Security income limit",
    "earnings limit 2025",
    "earnings limit 2026",
    "can I work and collect Social Security",
    "Social Security benefit reduction",
    "retirement earnings limit",
  ];

  const faqs = [
    {
      question: "Can I work while receiving Social Security retirement benefits?",
      answer:
        "Yes, you can work while receiving Social Security benefits at any age. However, if you're under full retirement age (FRA), your benefits may be temporarily reduced if your earnings exceed certain limits. Once you reach FRA, you can earn any amount without affecting your benefits.",
    },
    {
      question: "What is the Social Security earnings limit for 2026?",
      answer:
        "For 2026, if you're under full retirement age all year, you can earn up to $24,480 before your benefits are reduced. If you reach FRA during 2026, the limit is $65,160 for the months before you reach FRA. After reaching FRA, there is no earnings limit.",
    },
    {
      question: "How much will my Social Security be reduced if I work?",
      answer:
        "If you're under full retirement age all year, Social Security deducts $1 from your benefits for every $2 you earn above the annual limit. In the year you reach FRA, they deduct $1 for every $3 above a higher limit, and only count earnings before your birthday month.",
    },
    {
      question: "Do I lose Social Security benefits permanently if I earn too much?",
      answer:
        "No, you do not lose benefits permanently. Any benefits withheld due to the earnings test are returned to you after you reach full retirement age through higher monthly payments. Social Security recalculates your benefit amount to credit you for the months when benefits were withheld.",
    },
    {
      question: "What income counts toward the Social Security earnings test?",
      answer:
        "Only wages from employment and net self-employment income count toward the earnings test. This includes bonuses, commissions, and vacation pay. Investment income, pensions, annuities, interest, capital gains, government benefits, and retirement account withdrawals do NOT count.",
    },
    {
      question: "Does the earnings test apply after full retirement age?",
      answer:
        "No. Once you reach full retirement age, the earnings test no longer applies. You can earn any amount from working without any reduction to your Social Security benefits.",
    },
    {
      question: "What is the monthly earnings test?",
      answer:
        "In your first year of retirement, Social Security uses a monthly test as an alternative. In 2026, if you earn $2,040 or less in a month (or $5,430 if reaching FRA that year), you receive full benefits for that month regardless of your annual earnings. This helps people who retire mid-year.",
    },
  ];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://ssa.tools/guides/earnings-test" />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>Working While Receiving Social Security</h1>
  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    <strong>Can you work while collecting Social Security?</strong> Yes, but if
    you haven't reached <a href="/guides/nra">full retirement age</a>, your
    benefits may be temporarily reduced if you earn above certain limits. The
    good news: <strong>any withheld benefits are returned to you later</strong>.
  </p>

  <p>
    The Social Security "earnings test" is one of the most misunderstood aspects
    of the program. Many people believe that working will permanently reduce
    their benefits, but this isn't true. Understanding how the earnings test
    actually works can help you make better decisions about when to claim
    benefits and whether to continue working.
  </p>

  <div class="key-takeaways">
    <h3>Key Takeaways</h3>
    <ul>
      <li>
        You <strong>can</strong> work and receive Social Security at any age
      </li>
      <li>
        <strong>Before full retirement age:</strong> Benefits reduced $1 for every
        $2 earned above $24,480 (2026)
      </li>
      <li>
        <strong>Year you reach FRA:</strong> Reduced $1 for every $3 above $65,160
        (2026)
      </li>
      <li>
        <strong>At or after FRA:</strong> No earnings limit - earn any amount
      </li>
      <li>
        Withheld benefits are <strong>not lost</strong> - they're returned
        through higher payments after FRA
      </li>
      <li>
        Only <strong>wages and self-employment income</strong> count - not investments,
        pensions, or retirement withdrawals
      </li>
    </ul>
  </div>

  <h2>2025 and 2026 Earnings Limits</h2>

  <p>
    The Social Security Administration adjusts the earnings limits annually
    based on changes in national average wages.
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Situation</th>
        <th>2025 Limit</th>
        <th>2026 Limit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Under FRA all year</td>
        <td>$23,400</td>
        <td>$24,480</td>
      </tr>
      <tr>
        <td>Year you reach FRA</td>
        <td>$62,160</td>
        <td>$65,160</td>
      </tr>
      <tr>
        <td>Month you reach FRA and after</td>
        <td colspan="2">No limit</td>
      </tr>
    </tbody>
  </table>

  <h2>How the Earnings Test Works</h2>

  <p>
    The earnings test has different rules depending on your age relative to your
    <a href="/guides/nra">full retirement age (FRA)</a>:
  </p>

  <div class="requirements-box">
    <h3>Under Full Retirement Age All Year</h3>
    <p>
      If you won't reach FRA at any point during the year, Social Security
      deducts <strong>$1 from your benefits for every $2</strong> you earn above
      the annual limit.
    </p>

    <h4>Example: Sarah, Age 63</h4>
    <ul>
      <li>Sarah's benefit: $1,500/month ($18,000/year)</li>
      <li>Her 2026 earnings: $34,480</li>
      <li>Amount over limit: $34,480 - $24,480 = $10,000</li>
      <li>Benefit reduction: $10,000 ÷ 2 = $5,000</li>
      <li>Annual benefits received: $18,000 - $5,000 = $13,000</li>
    </ul>
    <p>
      Social Security withholds benefits starting in January until the $5,000 is
      recovered. Sarah receives no checks for the first 3-4 months, then full
      checks the rest of the year.
    </p>
  </div>

  <div class="requirements-box">
    <h3>Year You Reach Full Retirement Age</h3>
    <p>
      In the year you turn FRA, the rules are more generous. Social Security
      only counts earnings from months <strong>before</strong> your birthday month,
      and deducts just <strong>$1 for every $3</strong> over a higher limit.
    </p>

    <h4>Example: Tom Turns 67 (FRA) in August 2026</h4>
    <ul>
      <li>Tom's benefit: $2,000/month</li>
      <li>His earnings January-July: $70,000</li>
      <li>Amount over limit: $70,000 - $65,160 = $4,840</li>
      <li>Benefit reduction: $4,840 ÷ 3 = $1,613</li>
      <li>Tom loses about one month of benefits</li>
      <li>Starting in August, no earnings test applies</li>
    </ul>
  </div>

  <div class="highlight-box">
    <strong>At Full Retirement Age or Older:</strong> The earnings test disappears
    entirely. You can earn any amount from working without any reduction to your
    Social Security benefits.
  </div>

  <h2>Your Withheld Benefits Are Returned</h2>

  <p>
    This is the most important and least understood part of the earnings test:
    <strong>benefits withheld are not lost forever</strong>. When you reach full
    retirement age, Social Security recalculates your benefit to give you credit
    for the months when benefits were withheld.
  </p>

  <div class="example-box">
    <h4>Example: How Benefits Are Returned</h4>
    <p>
      Lisa claimed benefits at 62 and had benefits withheld for 24 months due to
      the earnings test before reaching her FRA of 67.
    </p>
    <ul>
      <li>Original reduction for claiming at 62: 30% (she gets 70% of PIA)</li>
      <li>
        After FRA recalculation: Credit for 24 months of withheld benefits
      </li>
      <li>
        New reduction: Approximately 20% instead of 30% (she now gets ~80% of
        PIA)
      </li>
      <li>
        This higher amount continues for the rest of her life
      </li>
    </ul>
    <p>
      The recalculated benefit effectively "pays back" the withheld benefits
      over time through permanently higher monthly payments.
    </p>
  </div>

  <div class="warning-box">
    <strong>The payback isn't immediate:</strong> You won't receive a lump sum for
    withheld benefits. Instead, your monthly benefit is increased, and over time
    (typically 12-15 years) you recover the full amount that was withheld.
  </div>

  <h2>What Counts as "Earnings"?</h2>

  <p>
    Only certain types of income count toward the earnings test. Understanding
    this distinction is crucial for retirement planning.
  </p>

  <div class="two-column">
    <div class="count-box">
      <h3>Income That COUNTS</h3>
      <ul>
        <li>Wages from employment</li>
        <li>Net self-employment income</li>
        <li>Bonuses</li>
        <li>Commissions</li>
        <li>Vacation pay</li>
        <li>Severance pay (in some cases)</li>
      </ul>
    </div>

    <div class="not-count-box">
      <h3>Income That Does NOT Count</h3>
      <ul>
        <li>Investment income (dividends, interest)</li>
        <li>Capital gains</li>
        <li>Pension payments</li>
        <li>Annuity income</li>
        <li>401(k) or IRA withdrawals</li>
        <li>Rental income (if not a business)</li>
        <li>Social Security benefits</li>
        <li>Veterans benefits</li>
        <li>Other government benefits</li>
      </ul>
    </div>
  </div>

  <div class="highlight-box">
    <strong>Planning Tip:</strong> If you're under FRA and want to minimize the
    earnings test impact, you can shift income sources. For example, drawing more
    from retirement accounts while working less may result in higher total income
    while keeping your Social Security benefits intact.
  </div>

  <h2>The Monthly Earnings Test (First Year Rule)</h2>

  <p>
    In your first year of receiving benefits, Social Security offers an
    alternative <strong>monthly test</strong>. This helps people who retire
    mid-year after earning significant income earlier in the year.
  </p>

  <table class="benefit-table">
    <thead>
      <tr>
        <th>Situation</th>
        <th>2025 Monthly Limit</th>
        <th>2026 Monthly Limit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Under FRA all year</td>
        <td>$1,950</td>
        <td>$2,040</td>
      </tr>
      <tr>
        <td>Year you reach FRA</td>
        <td>$5,180</td>
        <td>$5,430</td>
      </tr>
    </tbody>
  </table>

  <div class="example-box">
    <h4>Example: Mid-Year Retirement</h4>
    <p>
      Mike, age 64, earned $80,000 from January through June 2026, then retired
      and started Social Security in July. From July through December, he earns
      nothing.
    </p>
    <ul>
      <li>Annual test: $80,000 is way over the $24,480 limit</li>
      <li>
        Monthly test: In July-December, he earns $0/month (under $2,040 limit)
      </li>
      <li>Result: Mike receives full benefits for July-December</li>
    </ul>
    <p>
      The monthly test only applies in the first year you receive benefits. In
      subsequent years, only the annual test applies.
    </p>
  </div>

  <h2>Special Situations</h2>

  <h3>Self-Employment</h3>

  <p>
    If you're self-employed, Social Security counts your <strong>net earnings</strong>
    (profit after business expenses). In your first year of retirement, they may
    also apply a "services test" - if you work more than 45 hours per month in your
    business (or 15-45 hours in a highly skilled occupation), you may not be considered
    retired for that month regardless of income.
  </p>

  <h3>Working Outside the United States</h3>

  <p>
    Different rules apply if you work outside the U.S. The "foreign work test"
    may suspend benefits for any month you work more than 45 hours, regardless
    of earnings amount. See our
    <a href="/guides/international-agreements">international agreements guide</a>
    for more information.
  </p>

  <h3>Family Benefits</h3>

  <p>
    If your spouse or children receive benefits on your record, your excess
    earnings can reduce their benefits too - but only up to the maximum family
    benefit. Their own earnings don't affect your benefit.
  </p>

  <h2>Common Misconceptions</h2>

  <div class="warning-box">
    <strong>Myth: "Working will permanently reduce my Social Security."</strong>
    <p>
      Reality: Benefits withheld due to the earnings test are credited back to
      you at full retirement age through higher monthly payments. You eventually
      recover the withheld amounts.
    </p>
  </div>

  <div class="warning-box">
    <strong>Myth: "All my income counts toward the earnings test."</strong>
    <p>
      Reality: Only wages and self-employment income count. Investment income,
      pensions, retirement account withdrawals, and other passive income do not
      trigger the earnings test.
    </p>
  </div>

  <div class="warning-box">
    <strong>Myth: "I should wait until FRA to claim if I'm still working."</strong>
    <p>
      Reality: This depends on your situation. Because withheld benefits are
      returned, continuing to work while claiming early may still make sense.
      The math depends on your expected earnings, life expectancy, and other
      factors.
    </p>
  </div>

  <div class="warning-box">
    <strong>Myth: "The earnings test applies after full retirement age."</strong>
    <p>
      Reality: Once you reach full retirement age, the earnings test no longer
      applies. You can earn unlimited amounts without any impact on your Social
      Security benefits.
    </p>
  </div>

  <h2>Strategic Considerations</h2>

  <h3>Should You Claim Early If Still Working?</h3>

  <p>
    The decision to claim Social Security while still working depends on several
    factors:
  </p>

  <ul>
    <li>
      <strong>How much will be withheld?</strong> Calculate your expected reduction
      using the limits above
    </li>
    <li>
      <strong>Life expectancy:</strong> Longer life expectancy favors delaying benefits
    </li>
    <li>
      <strong>Other income sources:</strong> Can you cover expenses without Social
      Security?
    </li>
    <li>
      <strong>Tax implications:</strong> Working income plus Social Security may
      push you into higher tax brackets
    </li>
    <li>
      <strong>Spousal benefits:</strong> Your claiming decision affects your spouse's
      potential survivor benefits
    </li>
  </ul>

  <h3>Partial-Year Strategies</h3>

  <p>
    If you're planning to reduce work, consider timing:
  </p>

  <ul>
    <li>
      Retiring early in the year means fewer months of earnings count against
      you
    </li>
    <li>
      The monthly test in your first year can help if you retire mid-year
    </li>
    <li>
      Timing your FRA birthday month is important - earnings after that month
      don't count
    </li>
  </ul>

  <h2>Frequently Asked Questions</h2>

  <div class="faq">
    {#each faqs as faq}
      <h3>{faq.question}</h3>
      <p>{faq.answer}</p>
    {/each}
  </div>

  <h2>Calculate Your Benefits</h2>

  <p>
    Understanding how the earnings test affects you starts with knowing your
    benefit amount. Use the <a href="/calculator">SSA.tools calculator</a> to estimate
    your Social Security benefits based on your earnings history.
  </p>

  <p>
    For more information on related topics, see our guides on
    <a href="/guides/nra">Normal Retirement Age</a>,
    <a href="/guides/federal-taxes">federal taxation of benefits</a>, and
    <a href="/guides/pia">Primary Insurance Amount</a>.
  </p>

  <GuideFooter />
</div>

<style>
  .key-takeaways {
    background-color: #e8f5e9;
    border: 1px solid #4caf50;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .key-takeaways h3 {
    margin-top: 0;
    color: #2e7d32;
  }

  .key-takeaways ul {
    margin-bottom: 0;
  }

  .requirements-box {
    background-color: #fff3e0;
    border: 1px solid #ff9800;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .requirements-box h3 {
    margin-top: 0;
    color: #e65100;
  }

  .requirements-box h4 {
    color: #e65100;
    margin-bottom: 0.5em;
  }

  .requirements-box ul {
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  .requirements-box ul:last-child {
    margin-bottom: 0;
  }

  .highlight-box {
    background-color: #f0f8ff;
    border-left: 4px solid #4a90e2;
    padding: 15px;
    margin: 20px auto;
    border-radius: 4px;
    width: fit-content;
    max-width: 70%;
  }

  .warning-box {
    background-color: #fffde7;
    border-left: 4px solid #fbc02d;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .warning-box p {
    margin: 0.5em 0 0 0;
  }

  .example-box {
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .example-box h4 {
    margin-top: 0;
    color: #333;
  }

  .benefit-table {
    width: fit-content;
    max-width: 80%;
    border-collapse: collapse;
    margin: 20px auto;
  }

  .benefit-table th,
  .benefit-table td {
    padding: 10px 25px;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  .benefit-table th:first-child,
  .benefit-table td:first-child {
    text-align: right;
  }

  .benefit-table th {
    background-color: #e9ecef;
    font-weight: 600;
  }

  .benefit-table tbody tr:hover {
    background-color: #f5f5f5;
  }

  .two-column {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
  }

  .count-box {
    background-color: #ffebee;
    border: 1px solid #ef5350;
    border-radius: 8px;
    padding: 15px;
  }

  .count-box h3 {
    margin-top: 0;
    color: #c62828;
    font-size: 1em;
  }

  .count-box ul {
    margin-bottom: 0;
  }

  .not-count-box {
    background-color: #e8f5e9;
    border: 1px solid #66bb6a;
    border-radius: 8px;
    padding: 15px;
  }

  .not-count-box h3 {
    margin-top: 0;
    color: #2e7d32;
    font-size: 1em;
  }

  .not-count-box ul {
    margin-bottom: 0;
  }

  .faq h3 {
    color: #2c3e50;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }

  .faq p {
    margin-top: 0;
  }

  @media (max-width: 768px) {
    .two-column {
      grid-template-columns: 1fr;
    }

    .highlight-box {
      max-width: 100%;
    }
  }

  @media (max-width: 600px) {
    .benefit-table {
      font-size: 14px;
    }

    .benefit-table th,
    .benefit-table td {
      padding: 8px 10px;
    }
  }
</style>
