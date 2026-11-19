<script lang="ts">
import {
  EXAMPLE_CONTACT_MONTH,
  GPO_EXAMPLE,
  gpoExample,
  MAX_RETROACTIVE_MONTHS,
  REPEAL_FIRST_MONTH,
} from '$lib/gpo-example';
import { type FAQItem, GuidesSchema, renderFAQSchema } from '$lib/schema-org';
import type { SponsorCopy } from '$lib/sponsor';
import GuideFooter from '../guide-footer.svelte';
import GuideByline from '../GuideByline.svelte';
import InlineCTA from '../InlineCTA.svelte';

const sponsorCopy: SponsorCopy = {
  intro:
    'If GPO cut your spousal or survivor benefit to $0, or kept you from applying at all, the money still owed to you can run to thousands of dollars. You can have a Social Security specialist at',
  outro: 'check what you are owed and how far back it goes.',
  bullets: [
    'They check whether you were entitled at $0, which decides whether you are owed back to January 2024.',
    'If you never applied, they help you file and look for an earlier filing date you can prove.',
    'The first call is free, and you pick the time.',
  ],
};

// The second card, ahead of "What to Do Now", pitched at readers ready to
// act: back pay that is missing or short, or a first application.
const applySponsorCopy: SponsorCopy = {
  intro:
    'If your back pay is missing, short, or was refused, or you never applied, you can have a Social Security specialist at',
  outro: 'review your letters and pursue the money with you.',
  bullets: [
    'They compare what you were paid with the months the law covers.',
    'If you never applied, they file with you and look for an earlier filing date you can prove.',
    'The first call is free, and you pick the time.',
  ],
};

const title =
  'Government Pension Offset (GPO) Repeal: Spousal and Survivor Benefits You May Still Be Owed';
const description =
  'The Social Security Fairness Act repealed the Government Pension Offset from January 2024. If GPO cut your spousal or survivor benefit to $0, you may be owed back pay you never received. If you never applied, how far back you can be paid and what to do now.';
const publishDate = new Date('2026-11-18T00:00:00+00:00');
const updateDate = new Date('2026-11-18T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/government-pension-offset';
schema.title = title;
schema.image = '/laptop-piggybank.jpg';
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Government Pension Offset repeal: spousal and survivor benefits still owed';
schema.tags = [
  'Government Pension Offset',
  'GPO repeal',
  'Social Security Fairness Act spousal benefits',
  'Social Security Fairness Act back pay not received',
  'Fairness Act retroactive 6 months',
  'GPO $0 benefit',
  'never applied for spousal benefits because of GPO',
  'teacher pension spousal benefits',
  'teacher pension survivor benefits',
  'widow teacher pension Social Security',
  'CSRS spousal benefits',
];

const example = gpoExample();
const repealStart = REPEAL_FIRST_MONTH.toFullString();
const contactMonth = EXAMPLE_CONTACT_MONTH.toFullString();
const benefit2024 = GPO_EXAMPLE.january2024Benefit.wholeDollars();
const pension = GPO_EXAMPLE.pension.wholeDollars();
const lastOwed = example.entitled.last.toFullString();
const retroStart = example.neverApplied.first.toFullString();

const faqs: FAQItem[] = [
  {
    question: 'Did the Social Security Fairness Act repeal the Government Pension Offset?',
    answer: `Yes. The Act was signed on January 5, 2025, and ends the Government Pension Offset for Social Security benefits payable for ${repealStart} and later. December 2023 was the last month it applied. It applies to spousal and survivor benefits, including benefits for divorced spouses and surviving divorced spouses.`,
  },
  {
    question:
      'GPO reduced my spousal or survivor benefit to $0. Am I owed back pay?',
    answer: `If you applied and Social Security approved your claim but paid $0 because of GPO, you were entitled to the benefit, and the repeal covers you from ${repealStart}, or from the month your entitlement began if that was later. You should have received a payment for those months and a higher monthly benefit. If you did not, contact Social Security and ask for it. The six-month limit on back pay applies to new applications, not to you.`,
  },
  {
    question:
      'I never applied for spousal benefits because of GPO. Can I get back pay to January 2024?',
    answer: `Not under current rules. You have to file an application, and the Fairness Act did not change how far back an application can reach. Past full retirement age, that is up to ${MAX_RETROACTIVE_MONTHS} months before the month you apply. Before full retirement age it is usually none. Every month you wait is a month you are not paid for, so apply now.`,
  },
  {
    question: 'Why is Fairness Act back pay limited to 6 months for some people?',
    answer:
      'The ordinary rule for any retirement, spouse, or survivor application is at most six months of back pay, and usually none for a benefit reduced for claiming before full retirement age. The Act left that rule in place. People already entitled to a reduced or $0 benefit were paid back to January 2024; people who apply now get the ordinary limit.',
  },
  {
    question: 'I never received my Fairness Act back pay. What should I do?',
    answer:
      'Sign in to your my Social Security account or call Social Security and check two things: that Social Security has your current mailing address and bank account, and that it shows you as entitled to the spousal or survivor benefit. The payment goes to the bank account on file. If you were never entitled because you never applied, you need to file an application.',
  },
  {
    question:
      'Can I get spousal or survivor benefits with a teacher pension or CSRS pension now?',
    answer:
      'Yes. A pension from work not covered by Social Security, such as a teacher pension in some states or a Civil Service Retirement System annuity, no longer reduces spousal or survivor benefits. You still have to meet the normal rules for the benefit and apply for it.',
  },
  {
    question: 'Social Security told me not to apply. Does that help?',
    answer:
      'It can. If a Social Security employee gave you incorrect, incomplete, or misleading information that kept you from applying, Social Security can treat you as having applied on the date you were given that information, or the date you first qualified if that is later. The information must have come from a Social Security employee answering your question about your own eligibility; information from a pension system or another state or local government agency does not count. Make the request in writing, saying who told you, when, how, and what was said. A written notice from Social Security is the best evidence. Until the Act became law in January 2025, being told that GPO would cut your benefit to $0 was correct, so that advice on its own is unlikely to qualify.',
  },
];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link
    rel="canonical"
    href="https://ssa.tools/guides/government-pension-offset"
  />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
  {@html renderFAQSchema(faqs)}
</svelte:head>

<div class="guide-page">
  <h1>
    Government Pension Offset Repeal: Spousal and Survivor Benefits You May
    Still Be Owed
  </h1>
  <GuideByline {publishDate} {updateDate} />

  <p>
    For decades, the Government Pension Offset (GPO) cut the Social Security
    spousal and survivor benefits of people with a pension from government
    work that did not pay into Social Security. For most of them, it cut the
    benefit to nothing. The
    <a
      href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
      >Social Security Fairness Act</a
    > ended GPO for benefits payable for {repealStart} and later.
  </p>

  <p>
    Most people whose benefits GPO reduced were paid automatically in 2025.
    Some were not. And many people never applied, because they were told,
    correctly at the time, that GPO would leave them nothing. This guide is
    for both groups. It explains who is owed money back to {repealStart},
    who is limited to a few months, and what to do now.
  </p>

  <h2>Did GPO Reduce Your Spousal or Survivor Benefit to $0?</h2>

  <p>
    What you are owed depends on one question: did you ever apply for the
    spousal or survivor benefit and get a decision from Social Security?
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">Your situation</th>
        <th scope="col">What you are owed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>GPO reduced your benefit, but you were still paid something</td>
        <td>
          The full benefit from {repealStart}. Social Security should have
          raised your payment and paid the difference automatically.
        </td>
      </tr>
      <tr>
        <td>
          You applied, and Social Security told you GPO reduced your benefit
          to $0
        </td>
        <td>
          The full benefit from {repealStart}, or from the month your
          entitlement began if that was later. You were entitled, even though
          you were paid nothing.
        </td>
      </tr>
      <tr>
        <td>You never applied because of GPO</td>
        <td>
          You must apply now. Back pay is limited, usually to
          {MAX_RETROACTIVE_MONTHS} months at most.
        </td>
      </tr>
    </tbody>
  </table>

  <p>
    If you are not sure whether you ever applied, Social Security's advice is
    to <a
      href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
      >file an application</a
    >, because the date you apply can affect when your benefits begin.
  </p>

  <h2>If You Were Entitled at $0: You Are Owed Back to January 2024</h2>

  <p>
    When you applied for a spousal or survivor benefit and GPO took all of
    it, Social Security still approved the claim. Its manual calls this
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0202608100">total GPO</a>:
    the payment amount is reduced to zero, but you are entitled to the
    benefit. The repeal applies to everyone who was
    <a
      href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
      >entitled to benefits reduced fully or partially</a
    > by GPO. So you are owed every month from {repealStart}, or from the
    month your entitlement began if that was later, with no six-month limit.
  </p>

  <h3>How to check</h3>

  <ul>
    <li>
      Look for the letter Social Security sent when you applied. A letter
      saying your benefit is reduced to $0 because of your government pension
      means you were entitled.
    </li>
    <li>
      Look for letters from 2025. Social Security mailed a notice to everyone
      whose benefit changed, and sometimes a second one when the new monthly
      amount started.
    </li>
    <li>
      Sign in to your
      <a href="https://www.ssa.gov/myaccount/">my Social Security</a> account
      and check your monthly benefit, your mailing address, and your bank
      account.
    </li>
  </ul>

  <h3>Why the payment can miss you</h3>

  <p>
    Social Security deposits the back pay into the bank account it has on
    file and mails its notices to the address it has on file. If you moved,
    changed banks, or never gave a bank account because nothing was being
    paid, the money may not have reached you. Social Security may also ask
    for your pension amount, because GPO still applies to months before
    2024 and it needs to confirm what it paid for those months.
  </p>

  <InlineCTA type="sponsor" {sponsorCopy} />

  <h2>If You Never Applied: Apply Now</h2>

  <p>
    If you never applied because GPO would have reduced your benefit to $0,
    the repeal does not reach you until you apply. The Fairness Act
    <a
      href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
      >did not change the rules on retroactive benefits</a
    >, so your application can reach back only as far as anyone else's.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">What you apply for</th>
        <th scope="col">Months before your application Social Security can pay</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Spouse's or widow(er)'s benefit, at or past full retirement age</td>
        <td>
          Up to {MAX_RETROACTIVE_MONTHS}, but none before the month you reached
          full retirement age
        </td>
      </tr>
      <tr>
        <td>Spouse's benefit, before full retirement age</td>
        <td>Generally none</td>
      </tr>
      <tr>
        <td>Widow(er)'s benefit, before full retirement age</td>
        <td>
          Generally none, with
          <a href="/guides/retroactive-survivor-benefits">a few exceptions</a>
        </td>
      </tr>
      <tr>
        <td>A benefit based on disability, such as a disabled widow(er)</td>
        <td>Up to 12</td>
      </tr>
    </tbody>
  </table>

  <p>
    The rules are in
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204030"
      >Social Security's manual, GN 00204.030</a
    >. The point for you is simple: every month you wait is a month you will
    not be paid for. Apply this month.
  </p>

  <ul>
    <li>
      <strong>Spousal benefits</strong> can be filed online at
      <a href="https://www.ssa.gov/apply">ssa.gov/apply</a>. Choosing
      "Family Benefits" takes you to the retirement application, which
      considers you for every benefit you can get.
    </li>
    <li>
      <strong>Survivor benefits</strong> cannot be filed online. Call
      Social Security to apply.
    </li>
    <li>
      Social Security says it can also take a spousal application by phone
      for people who did not apply earlier because of GPO.
    </li>
  </ul>

  <h3>If Social Security told you not to apply</h3>

  <p>
    If a Social Security employee gave you incorrect, incomplete, or
    misleading information that kept you from applying, Social Security can
    set an earlier
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204008"
      >"deemed" filing date</a
    >: the date you were given the wrong information, or the date you first
    qualified, whichever is later
    (<a href="https://www.ecfr.gov/current/title-20/section-404.633"
      >20 CFR 404.633</a
    >). You can raise this at any time, before or after you apply. You have
    to show that the information kept you from filing. A written notice from
    Social Security is the best evidence, so look for old letters.
  </p>

  <ul>
    <li>
      The information must have come from a Social Security employee, in
      answer to your own question about your eligibility.
    </li>
    <li>
      Information from other government agencies does not count. That
      includes state and local governments, such as a state retirement
      system.
    </li>
    <li>
      Make the request in writing. Say what you were told, how, when, and
      where, who told you, and why it kept you from applying.
    </li>
  </ul>

  <p>
    One caution. Until the Act became law in January 2025, being told that
    GPO would cut your benefit to $0 was correct, so that advice on its own
    is unlikely to count as misinformation. Advice given after January 2025
    that discouraged you from applying is a different matter.
  </p>

  <h3>If you contacted Social Security earlier</h3>

  <p>
    If you told Social Security in writing that you intended to file, or it
    scheduled an appointment for you to file, that contact may have set a
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204010"
      >protective filing date</a
    > earlier than your application. Ask Social Security to check for one.
    To keep that date, the application has to be filed within the six-month
    period stated in the notice Social Security sends you, so finish it
    promptly.
  </p>

  <h2>Survivors and Ex-Spouses</h2>

  <p>
    GPO applied to every benefit paid as a spouse: current spouses,
    divorced spouses, widows and widowers, and surviving divorced spouses.
    The repeal covers all of them. The normal rules for each benefit still
    apply:
  </p>

  <ul>
    <li>
      <a href="/guides/spousal-benefits">Spousal benefits</a>: up to half
      your spouse's full benefit, once your spouse has filed.
    </li>
    <li>
      <a href="/guides/divorced-spouse">Divorced spouse benefits</a>: a
      marriage of at least 10 years, and you must be unmarried.
    </li>
    <li>
      <a href="/guides/survivor-benefits">Survivor benefits</a>: up to your
      late spouse's full benefit, from age 60.
    </li>
    <li>
      <a href="/guides/retroactive-survivor-benefits"
        >How far back survivor benefits are paid</a
      >, including the exceptions for widows and widowers under full
      retirement age.
    </li>
  </ul>

  <h2>Who Had the Government Pension Offset</h2>

  <p>
    GPO applied to people with a pension from federal, state, or local
    government work where they did not pay Social Security taxes. Social
    Security names
    <a
      href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
      >teachers, firefighters, and police officers in many states</a
    >, and federal employees covered by the Civil Service Retirement System
    (CSRS).
    <a
      href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
      >Most state and local public employees, about 72 percent</a
    >, pay Social Security taxes and never had GPO.
  </p>

  <p>
    GPO reduced the spousal or survivor benefit by
    <a href="https://secure.ssa.gov/poms.nsf/lnx/0202608100"
      >two-thirds of the government pension</a
    >. When two-thirds of the pension was as large as the benefit, the
    benefit was cut to $0. A pension from a foreign country never counted
    for GPO.
  </p>

  <p>
    GPO had a companion rule, the Windfall Elimination Provision, which
    reduced people's own retirement benefits. The same law repealed both.
    See our <a href="/guides/wep">WEP guide</a> for that side.
  </p>

  <h2>Example: Two Widows, the Same Pension, Different Back Pay</h2>

  <p>
    Two retired teachers each have a pension of {pension} a month from a
    school system that did not pay into Social Security. Each is a widow
    whose survivor benefit for {repealStart} would have been
    {benefit2024} a month. Two-thirds of the pension is
    {example.offsetBeforeRepeal.wholeDollars()}, more than the benefit, so
    GPO cut it to $0.
  </p>

  <p>
    The first widow applied years ago and was entitled at $0, but her
    Fairness Act payment never reached her. The second never applied. Both
    contact Social Security in {contactMonth}. Both are past full retirement
    age and neither has a Social Security benefit of her own, so neither
    benefit is reduced for age. We start from the stated
    {repealStart} benefit rather than from earnings records, and raise it
    by each cost-of-living adjustment since. Each adjustment takes effect
    with the December benefit, and the monthly payment is rounded down to
    the dollar, as Social Security does.
  </p>

  <table class="rule-table">
    <thead>
      <tr>
        <th scope="col">Benefits payable for</th>
        <th scope="col">Monthly payment</th>
        <th scope="col">Months</th>
        <th scope="col">Owed</th>
      </tr>
    </thead>
    <tbody>
      {#each example.entitled.periods as period}
        <tr>
          <td>
            {period.first.toFullString()} to {period.last.toFullString()}
          </td>
          <td>{period.monthlyPayment.wholeDollars()}</td>
          <td>{period.months}</td>
          <td>{period.subtotal.wholeDollars()}</td>
        </tr>
      {/each}
      <tr>
        <td colspan="2"><strong>Total for the widow entitled at $0</strong></td>
        <td><strong>{example.entitled.months}</strong></td>
        <td><strong>{example.entitled.total.wholeDollars()}</strong></td>
      </tr>
    </tbody>
  </table>

  <table class="rule-table">
    <thead>
      <tr>
        <th></th>
        <th scope="col">Months paid back</th>
        <th scope="col">Back pay</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Entitled at $0 before the Act</td>
        <td>{example.entitled.months}</td>
        <td>{example.entitled.total.wholeDollars()}</td>
      </tr>
      <tr>
        <td>Never applied, files in {contactMonth}</td>
        <td>{example.neverApplied.months}</td>
        <td>{example.neverApplied.total.wholeDollars()}</td>
      </tr>
      <tr>
        <td><strong>Lost by not having applied</strong></td>
        <td><strong>{example.monthsLost}</strong></td>
        <td><strong>{example.amountLost.wholeDollars()}</strong></td>
      </tr>
    </tbody>
  </table>

  <p>
    The widow who was entitled at $0 is owed {example.entitled.months} months,
    {repealStart} through {lastOwed}: {example.entitled.total.wholeDollars()}.
    The widow who never applied can be paid only for the
    {example.neverApplied.months} months before she applies, {retroStart}
    through {lastOwed}: {example.neverApplied.total.wholeDollars()}. The other
    {example.monthsLost} months, worth {example.amountLost.wholeDollars()},
    are lost to her unless she can show an earlier filing date. Both are
    paid {example.paymentFromContactMonth.wholeDollars()} for {contactMonth},
    and both get the same cost-of-living increases after that.
  </p>

  <p>
    These amounts are before any Medicare premium, which Social Security
    deducts from benefits once they are paid, and before any tax withholding.
    Back pay is taxed like other Social Security benefits; see our
    <a href="/guides/federal-taxes">federal taxes guide</a>.
  </p>

  <InlineCTA
    type="sponsor"
    placement="guide-inline-apply"
    sponsorCopy={applySponsorCopy}
  />

  <h2>What to Do Now</h2>

  <ol>
    <li>
      If you never applied, apply this month: online at
      <a href="https://www.ssa.gov/apply">ssa.gov/apply</a> for spousal
      benefits, or by calling Social Security for survivor benefits. Write down
      the date you called or applied.
    </li>
    <li>
      If you were entitled at $0, check your my Social Security account for
      your monthly benefit, address, and bank account. If you have received
      nothing, call and ask for the Fairness Act payment back to
      {repealStart}.
    </li>
    <li>
      Find any old letters from Social Security about your spousal or survivor
      benefit or your pension. They show whether you were entitled, and they
      are the evidence for an earlier filing date.
    </li>
    <li>
      If Social Security tells you that you are limited to
      {MAX_RETROACTIVE_MONTHS} months, ask whether you were ever entitled, and
      whether you have a protective filing date.
    </li>
    <li>
      Applying is free. Social Security
      <a
        href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
        >will never ask you to pay</a
      > to start or increase your benefits. If someone calls or emails you
      out of the blue offering to speed up your payment, hang up; that is not
      Social Security.
    </li>
  </ol>

  <h2>Frequently Asked Questions</h2>

  {#each faqs as faq}
    <h3>{faq.question}</h3>
    <p>{faq.answer}</p>
  {/each}

  <h2>Sources</h2>

  <ul>
    <li>
      <a
        href="https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html"
        >Social Security Administration: Social Security Fairness Act</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0202608100"
        >SSA POMS GN 02608.100: Government Pension Offset (GPO) Provision</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204030"
        >SSA POMS GN 00204.030: Retroactivity for Title II Benefits</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204008"
        >SSA POMS GN 00204.008: Misinformation - Applications</a
      >
    </li>
    <li>
      <a href="https://secure.ssa.gov/poms.nsf/lnx/0200204010"
        >SSA POMS GN 00204.010: Protective Writings</a
      >
    </li>
    <li>
      <a href="https://www.ecfr.gov/current/title-20/section-404.633"
        >20 CFR 404.633: Deemed filing date in a case of misinformation</a
      >
    </li>
    <li>
      <a href="https://www.congress.gov/crs-product/IF13181"
        >Congressional Research Service IF13181: Implementation of the Social
        Security Fairness Act of 2023 and Retroactivity for Benefit
        Applications</a
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
