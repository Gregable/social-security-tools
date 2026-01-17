<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import HeroImage from './hero.jpg';

// Hero image: Lincoln Memorial During Government Shutdown 2013
// Source: https://commons.wikimedia.org/wiki/File:Lincoln_Memorial_During_Government_Shutdown_2013.jpg
// Licensed under Creative Commons

const title = 'How Government Shutdowns Affect Social Security';
const description =
  'Government shutdowns never stop Social Security payments, but they severely disrupt services. Learn what continues, what stops, and how to protect yourself during funding gaps.';
const publishDate = new Date(2025, 8, 30); // September 30, 2025 (month is 0-indexed)
const updateDate = new Date(2025, 8, 30); // September 30, 2025 (month is 0-indexed)

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/government-shutdown';
schema.title = title;
schema.image = HeroImage;
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Lincoln Memorial with barriers during the 2013 government shutdown';
schema.tags = ['Government Shutdown', 'Social Security', 'Federal Benefits'];
</script>

<svelte:head>
  <meta name="description" content={description} />
  <title>
    {title} | SSA.tools
  </title>

  {@html schema.renderSocialMeta()}
  {@html schema.render()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">
    Published: {publishDate.toLocaleDateString()}
    {#if updateDate.getTime() !== publishDate.getTime()}
      <br />Updated: {updateDate.toLocaleDateString()}
    {/if}
  </p>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="512"
      height="512"
      alt="Lincoln Memorial with barriers during the 2013 government shutdown"
    />
  </figure>

  <p>
    <strong>The bottom line:</strong> Government shutdowns never stop Social Security
    benefit payments. The system has never missed a payment in its 90-year history.
    However, shutdowns severely disrupt the services that help Americans apply for
    benefits, resolve problems, and access basic assistance. Understanding the difference
    between payment continuity and service availability is crucial for navigating
    shutdown periods.
  </p>

  <h2>Current Shutdown Threat and Context</h2>

  <p>
    As the federal fiscal year ends at midnight tonight (September 30, 2025),
    the GOP-led Congress has failed to reach agreement on funding legislation,
    making a government shutdown imminent. Both Republican and Democratic
    funding bills failed to reach the required 60 votes in the Senate, and the
    shutdown will proceed at midnight Eastern Time. This would be the first
    federal shutdown in six years, despite the Republican Party controlling the
    presidency, House, and Senate. This highlights the deep disagreements within
    the GOP that have prevented passage of either a full-year budget or a
    continuing resolution.
  </p>

  <p>
    This situation occurs amid ongoing challenges at the Social Security
    Administration. Earlier in 2025, the agency underwent <a
      href="/guides/agency-changes"
    >
      significant administrative changes</a
    > that reduced staffing by approximately 7,000 employees (12% of the workforce).
    These existing capacity constraints mean a shutdown would compound already-strained
    services.
  </p>

  <p>
    The combination of reduced baseline staffing from the 2025 administrative
    changes and potential shutdown furloughs could create unprecedented service
    disruptions, even though benefit payments would continue uninterrupted.
  </p>

  <h2>Why Social Security Payments Always Continue</h2>

  <p>
    Social Security operates fundamentally differently from most government
    programs. Your retirement and disability benefits are funded by dedicated
    payroll taxes flowing into trust funds, completely separate from the annual
    budget battles that trigger shutdowns. Here's how the protection works:
  </p>

  <ul>
    <li>
      <strong>Permanent Funding Authorization:</strong> Congress authorized Social
      Security payments in perpetuity when it created the program, not year-by-year
      through annual budgets.
    </li>
    <li>
      <strong>Dedicated Trust Funds:</strong> The
      <a href="https://www.ssa.gov/OACT/TR/2024/tr2024.pdf"
        >Old-Age and Survivors Insurance Trust Fund and Disability Insurance
        Trust Fund collected
        <strong>$1.35 trillion in 2023</strong></a
      > from payroll taxes that continue flowing during shutdowns.
    </li>
    <li>
      <strong>Automatic Redemption:</strong> The trust funds hold
      <a href="https://www.ssa.gov/OACT/TR/2024/tr2024.pdf"
        >$2.79 trillion in Treasury securities</a
      > that can be automatically redeemed to fund benefits without Congressional
      action.
    </li>
  </ul>

  <p>
    Supplemental Security Income (SSI) presents a technical difference: it's
    funded from general Treasury revenues rather than payroll taxes. However,
    <a href="https://www.ssa.gov/budget/">SSA's budget documents</a>
    indicate SSI can continue for up to three months during shutdowns using previously
    appropriated funds, providing adequate protection since
    <a
      href="https://en.wikipedia.org/wiki/Government_shutdowns_in_the_United_States#December_2018%E2%80%93January_2019"
      >the longest shutdown in history was 35 days in 2018-2019</a
    >.
  </p>

  <h2>What Services Stop During Shutdowns</h2>

  <p>
    While payments continue, the administrative machinery supporting Social
    Security faces severe curtailment. <a href="https://www.ssa.gov/budget/"
      >SSA typically furloughs about <strong>12% of its workforce</strong> while
      retaining 88% as "excepted" employees</a
    > who work without immediate pay. However, this understates the service impact
    because retained employees focus exclusively on payment-critical activities.
  </p>

  <h3>Services That Completely Stop</h3>
  <ul>
    <li>
      <strong>Social Security Card Issuance:</strong> New and replacement Social
      Security cards become unavailable
    </li>
    <li>
      <strong>Benefit Verifications:</strong> Official proof of benefits needed for
      housing, loans, and other applications
    </li>
    <li>
      <strong>Earnings Record Corrections:</strong> Updates to your work history
      unrelated to current benefit processing
    </li>
    <li>
      <strong>Overpayment Processing:</strong> Resolution of benefit overpayment
      issues
    </li>
    <li>
      <strong>Freedom of Information Act Requests:</strong> All FOIA processing suspends
    </li>
    <li>
      <strong>General Customer Service:</strong> Non-critical inquiries and assistance
    </li>
  </ul>

  <h3>Services That Continue With Severe Delays</h3>
  <ul>
    <li>
      <strong>New Benefit Applications:</strong> Initial retirement and disability
      claims continue being accepted but with dramatically reduced processing capacity
    </li>
    <li>
      <strong>Phone Service:</strong> The
      <a href="https://www.ssa.gov/agency/phone/">1-800 number</a>
      remains operational but with wait times extending from the
      <a href="https://www.ssa.gov/budget/">typical long wait times</a> to potentially
      3-4 hours or more
    </li>
    <li>
      <strong>Field Office Visits:</strong> Offices stay open but operate with skeleton
      crews, creating extremely long wait times for in-person service
    </li>
    <li>
      <strong>Online Services:</strong> The
      <a href="https://www.ssa.gov/myaccount/">my Social Security portal</a> continues
      functioning for submissions, but backend processing slows dramatically
    </li>
  </ul>

  <h2>Disability Claims Face Unique Challenges</h2>

  <p>
    Disability benefit processing reveals shutdowns' most complex impacts. While
    SSA continues accepting applications and processing the most urgent cases
    (terminally ill individuals, wounded warriors, dire need situations), a
    critical bottleneck emerges at State Disability Determination Services.
  </p>

  <p>
    These state offices, funded by federal dollars, make the medical
    determinations that decide disability claims. SSA cannot mandate they
    continue operations during shutdowns. It can only "encourage" continued
    service with promises of reimbursement after funding resumes. During the
    <a
      href="https://obamawhitehouse.archives.gov/sites/default/files/omb/reports/impacts-and-costs-of-october-2013-federal-government-shutdown-report.pdf"
      >2013 shutdown, nine states furloughed all DDS employees while three
      furloughed some</a
    >, creating a 14% capacity shortfall and severe geographic disparities.
  </p>

  <p>
    Administrative Law Judge hearings continue with limited support. While
    hearings proceed, <strong>decisions aren't written during shutdowns</strong
    >, meaning even successful claimants face additional delays in receiving
    benefits.
  </p>

  <h2>Historical Impact: Learning from Past Shutdowns</h2>

  <p>Past shutdowns provide concrete data on Social Security impacts:</p>

  <h3>2013 Shutdown (16 days)</h3>
  <ul>
    <li>
      <a
        href="https://obamawhitehouse.archives.gov/sites/default/files/omb/reports/impacts-and-costs-of-october-2013-federal-government-shutdown-report.pdf"
        >SSA accumulated <strong>150,000 employee furlough days</strong></a
      >
    </li>
    <li>
      <a
        href="https://obamawhitehouse.archives.gov/sites/default/files/omb/reports/impacts-and-costs-of-october-2013-federal-government-shutdown-report.pdf"
        >Over 1,600 medical disability reviews delayed daily</a
      >
    </li>
    <li>
      <a
        href="https://obamawhitehouse.archives.gov/sites/default/files/omb/reports/impacts-and-costs-of-october-2013-federal-government-shutdown-report.pdf"
        >Over 10,000 SSI redeterminations postponed daily</a
      >
    </li>
    <li>
      Approximately <strong>960,000 Social Security card applications</strong> accumulated
      during the 16-day period
    </li>
    <li>
      <a
        href="https://obamawhitehouse.archives.gov/sites/default/files/omb/reports/impacts-and-costs-of-october-2013-federal-government-shutdown-report.pdf"
        >1.2 million income verification requests for mortgages and loans were
        delayed</a
      >
    </li>
  </ul>

  <h3>1995-1996 Shutdowns (5 days + 21 days)</h3>
  <ul>
    <li>
      <a
        href="https://en.wikipedia.org/wiki/Government_shutdowns_in_the_United_States#1995%E2%80%931996"
        >First shutdown: 800,000 federal employees furloughed for 5 days</a
      >
    </li>
    <li>
      <a
        href="https://en.wikipedia.org/wiki/Government_shutdowns_in_the_United_States#1995%E2%80%931996"
        >Second shutdown: 284,000 employees furloughed for 21 days</a
      >
    </li>
    <li>
      <a
        href="https://en.wikipedia.org/wiki/Government_shutdowns_in_the_United_States#1995%E2%80%931996"
        >Significant disruptions to government services and tourism</a
      >
    </li>
  </ul>

  <p>
    Recovery takes 3-5 times the shutdown duration. A three-week shutdown
    typically requires 9-15 weeks to clear accumulated backlogs and restore
    normal service levels.
  </p>

  <h2>Practical Steps to Protect Yourself</h2>

  <h3>Before a Shutdown</h3>
  <ul>
    <li>
      <strong>Set Up Online Access:</strong> Create your
      <a href="https://www.ssa.gov/myaccount/">my Social Security account</a> now
      if you haven't already
    </li>
    <li>
      <strong>Download Current Documents:</strong> Print or save copies of benefit
      statements, payment history, and any verification letters you might need
    </li>
    <li>
      <strong>Complete Pending Business:</strong> Handle any Social Security matters
      requiring human assistance before a shutdown begins
    </li>
    <li>
      <strong>Update Direct Deposit:</strong> Ensure your bank account information
      is current and verify your payment schedule
    </li>
  </ul>

  <h3>During a Shutdown</h3>
  <ul>
    <li>
      <strong>Monitor Your Payments:</strong> Benefits continue, but watch your account
      to confirm deposits arrive as scheduled
    </li>
    <li>
      <strong>Avoid Non-Critical Requests:</strong> Postpone routine inquiries, earnings
      corrections, and card replacements if possible
    </li>
    <li>
      <strong>Use Online Services First:</strong> Try online options before calling
      or visiting offices
    </li>
    <li>
      <strong>Plan for Delays:</strong> If you must conduct business, expect significantly
      longer wait times
    </li>
    <li>
      <strong>Keep Documentation:</strong> Save confirmations, reference numbers,
      and notes from any interactions
    </li>
  </ul>

  <h3>For Urgent Situations</h3>
  <p>If you face truly urgent Social Security matters during a shutdown:</p>
  <ul>
    <li>
      <strong>Contact Your Congressional Representative:</strong> Congressional offices
      often have dedicated staff to help constituents with federal benefit issues
    </li>
    <li>
      <strong>Emphasize Urgency:</strong> Clearly explain time-sensitive circumstances
      like imminent eviction, medical emergencies, or loss of other benefits
    </li>
    <li>
      <strong>Seek Legal Assistance:</strong> Community legal aid organizations may
      provide guidance during extended shutdowns
    </li>
  </ul>

  <h2>Medicare and Other SSA Functions</h2>

  <p>
    Medicare benefits also continue during shutdowns through similar trust fund
    protections. <a
      href="https://www.cms.gov/data-research/statistics-trends-and-reports/trustee-reports"
      >Hospital insurance (Part A) draws from the Hospital Insurance Trust Fund</a
    >, while physician services (Part B) and prescription drugs (Part D)
    continue through their funding mechanisms. However, Medicare card
    replacement becomes unavailable except through
    <a href="https://www.ssa.gov/myaccount/">online portals</a>.
  </p>

  <p>Other SSA functions face varying impacts:</p>
  <ul>
    <li>
      <strong>Representative Payee Services:</strong> Limited to emergency situations
      only during shutdowns
    </li>
    <li>
      <strong>Program Integrity Work:</strong> Reviews to prevent fraud and improper
      payments largely suspend, allowing questionable cases to continue unchecked
    </li>
    <li>
      <strong>Appeals Processing:</strong> Administrative appeals beyond ALJ hearings
      face significant delays
    </li>
  </ul>

  <h2>Long-term Implications</h2>

  <p>
    Extended shutdowns create consequences lasting months or years beyond the
    funding gap itself:
  </p>

  <ul>
    <li>
      <strong>Workforce Attrition:</strong> Employees leave federal service during
      and after shutdowns, creating permanent knowledge and capacity loss
    </li>
    <li>
      <strong>Technology Debt:</strong> IT modernization and system maintenance postponed
      during shutdowns accumulate, increasing long-term operational risks
    </li>
    <li>
      <strong>Disability Backlog Growth:</strong> The existing
      <a href="https://www.ssa.gov/appeals/">disability claims backlog</a> grows
      larger and takes longer to resolve
    </li>
    <li>
      <strong>Program Integrity Gaps:</strong> Suspended fraud detection and prevention
      work during shutdowns allows improper payments that continue indefinitely
    </li>
  </ul>

  <h2>Key Takeaways</h2>

  <p>
    Government shutdowns create a critical distinction between Social Security's
    <strong>payment function</strong> and its <strong>service function</strong>.
    Your monthly benefits will arrive on schedule, but accessing help, resolving
    problems, or conducting new business becomes dramatically more difficult.
  </p>

  <p>
    The current political context (one party controlling all branches of
    government yet unable to fund operations), combined with the SSA's
    already-reduced workforce from 2025's administrative changes, threatens
    unprecedented service disruptions. While the fundamental promise of Social
    Security remains secure, the systems supporting beneficiaries face serious
    challenges.
  </p>

  <p>
    Understanding these realities helps you prepare appropriately: handle
    routine business before shutdowns begin, set up online access for
    self-service options, and know where to seek help for truly urgent
    situations. Most importantly, remember that while services may be disrupted,
    your benefits themselves remain protected by law and decades of precedent.
  </p>

  <GuideFooter />
</div>
