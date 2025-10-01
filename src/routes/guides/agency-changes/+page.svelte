<script lang="ts">
  import { GuidesSchema } from '$lib/schema-org';
  import GuideFooter from '../guide-footer.svelte';
  import HeroImage from './hero.png';

  const title = 'Navigating Social Security During Administrative Changes';
  const description =
    "If you've tried to access Social Security services recently, you may have encountered longer wait times, website outages, or difficulty reaching representatives.";
  const publishDate = new Date('2025-04-30T00:00:00+00:00');
  const updateDate = new Date('2025-04-30T00:00:00+00:00');

  let schema: GuidesSchema = new GuidesSchema();
  schema.url = 'https://ssa.tools/guides/agency-changes';
  schema.title = title;
  schema.image = HeroImage;
  schema.datePublished = publishDate.toISOString();
  schema.dateModified = updateDate.toISOString();
  schema.description = description; // Pass the description to the schema
  schema.imageAlt = 'A lighthouse with a small unmanned sailboat near shore';
  schema.tags = ['SSA', 'Social Security Administration', 'Agency Changes', 'Government'];
</script>

<svelte:head>
  <meta name="description" content={description} />
  <title>
    {title} | SSA.tools
  </title>
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
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
      alt="Birthday poster hung on a wall with cake and balloons"
    />
  </figure>

  <p>
    If you've tried to access Social Security services recently, you may have
    encountered longer wait times, website outages, or difficulty reaching
    representatives. These challenges are not coincidental but stem from
    significant administrative changes implemented by the Trump administration
    in 2025, particularly through the Department of Government Efficiency (DOGE)
    led by Elon Musk.
  </p>

  <p>
    Since February 2025, the Social Security Administration (SSA) has undergone
    substantial restructuring, including <a
      href="https://www.washingtonpost.com/politics/2025/04/04/social-security-layoffs-trump-musk/"
      >staff reductions of approximately 7,000 employees</a
    > (about 12% of its workforce), with more layoffs potentially on the horizon.
    These changes have created challenges for the 73 million Americans who rely on
    Social Security benefits.
  </p>

  <h2>How Recent Changes May Affect You</h2>

  <h3>1. Longer Wait Times and Reduced Service Availability</h3>
  <p>
    The SSA is experiencing severe service disruptions across multiple channels:
  </p>
  <ul>
    <li>
      <b>Phone Services:</b> Average wait times have increased to over
      <a
        href="https://www.washingtonpost.com/politics/2025/03/25/social-security-phones-doge-cuts/"
        >80-120 minutes</a
      >, with some callers reporting being on hold for four to five hours.
    </li>
    <li>
      <b>Website Access:</b> The SSA website has
      <a
        href="https://www.washingtonpost.com/politics/2025/04/07/social-security-website-crashes-musk-trump/"
        >crashed repeatedly</a
      >, with outages lasting from 20 minutes to nearly a day. Even when online,
      many users report difficulty logging in or accessing their account
      information.
    </li>
    <li>
      <b>Field Office Visits:</b> With the reduction of regional offices from 10
      to 4 and
      <a
        href="https://www.npr.org/2025/04/26/nx-s1-5368480/social-security-workforce-cuts"
        >staffing cuts at local offices</a
      >, in-person services are becoming increasingly strained. Some offices
      have lost
      <a
        href="https://www.washingtonpost.com/politics/2025/04/04/social-security-layoffs-trump-musk/"
        >25-50% of their staff</a
      >.
    </li>
  </ul>

  <h3>2. New In-Person Requirements</h3>
  <p>
    In March 2025, the SSA announced that <a
      href="https://apnews.com/article/social-security-fraud-waste-doge-elon-musk-212e3089951f731fd3f83443e104b315"
      >beginning March 31</a
    >, people will no longer be able to verify their identity over the phone.
    Those who cannot verify their identity through the online
    <a href="https://www.ssa.gov/myaccount/">my Social Security portal</a> will need
    to visit a field office in person. This change affects:
  </p>
  <ul>
    <li>New applicants for Social Security benefits</li>
    <li>Current recipients who need to update direct deposit information</li>
    <li>Those needing to verify their identity for other reasons</li>
  </ul>

  <p>
    Additionally, the SSA has <a
      href="https://www.marketwatch.com/story/social-security-field-offices-are-about-to-be-flooded-thanks-to-one-new-change-happening-amid-workforce-cuts-0fde6d24"
      >paused the Enumeration Beyond Entry program</a
    >, which automatically issued Social Security numbers and cards to certain
    immigrants. This change is expected to result in 60,000-75,000 additional
    people visiting field offices weekly.
  </p>

  <h3>3. Communication Changes</h3>
  <p>
    The SSA has <a
      href="https://www.wired.com/story/social-security-administration-regional-office-elon-musk-x/"
      >shifted its public communications exclusively to Elon Musk's X</a
    > (formerly Twitter), discontinuing traditional press releases and "dear colleague"
    letters. This may make it more difficult for people, particularly seniors, to
    stay informed about program changes and updates.
  </p>

  <h2>Practical Steps to Protect Your Benefits</h2>

  <h3>1. Document Everything</h3>
  <p>
    Given the current instability, it's crucial to maintain detailed records:
  </p>
  <ul>
    <li>
      <b>Save Screenshots:</b> When using the SSA website, take screenshots of confirmations,
      account information, and benefit statements.
    </li>
    <li>
      <b>Keep a Call Log:</b> If you contact SSA by phone, note the date, time, representative's
      name, and summary of the conversation.
    </li>
    <li>
      <b>Request Written Confirmation:</b> For any significant changes or applications,
      request written confirmation when possible.
    </li>
  </ul>

  <h3>2. Plan Ahead for Services</h3>
  <ul>
    <li>
      <b>Check Benefit Deposit Dates:</b> Former SSA Commissioner Martin
      O'Malley has warned that
      <a
        href="https://www.cnbc.com/2025/03/01/doge-actions-may-cause-social-security-benefit-interruption-ex-agency-head.html"
        >benefit interruptions could occur</a
      > within the next 30-90 days. Verify your payment dates and monitor your bank
      account.
    </li>
    <li>
      <b>Schedule Appointments Early:</b> If you need in-person services, try to
      schedule appointments several weeks in advance.
    </li>
    <li>
      <b>Use Off-Peak Hours:</b> For website access, try early mornings or late evenings
      when server traffic may be lighter.
    </li>
  </ul>

  <h3>3. Explore Alternative Verification Methods</h3>
  <ul>
    <li>
      <b>Ensure Online Access Now:</b> If you haven't already set up your<a
        href="https://www.ssa.gov/myaccount/">my Social Security</a
      > account, do so immediately to avoid potential in-person requirements.
    </li>
    <li>
      <b>Prepare Identity Documents:</b> If you must visit an office, bring multiple
      forms of identification (driver's license, passport, birth certificate) to
      ensure successful verification.
    </li>
  </ul>

  <h2>Getting Help During System Disruptions</h2>

  <h3>1. Contact Your Congressional Representative</h3>
  <p>
    Congressional offices often have dedicated staff to help constituents with
    federal benefits issues. They may be able to:
  </p>
  <ul>
    <li>Expedite urgent cases</li>
    <li>Connect you with SSA officials</li>
    <li>Provide guidance on alternative solutions</li>
  </ul>

  <h3>2. Work With Advocates</h3>
  <ul>
    <li>
      <b>AARP:</b> Has reported receiving
      <a
        href="https://www.washingtonpost.com/politics/2025/03/25/social-security-phones-doge-cuts/"
        >double the usual number of calls</a
      > about Social Security concerns. Their staff may offer guidance.
    </li>
    <li>
      <b>Legal Aid:</b> Many communities have legal aid societies that can assist
      with benefit issues.
    </li>
  </ul>

  <h3>3. Consider Professional Help</h3>
  <p>
    For complex situations or when significant benefits are at stake, consider
    consulting with:
  </p>
  <ul>
    <li>A Social Security attorney</li>
    <li>An accredited benefits counselor</li>
    <li>A certified financial planner with expertise in retirement benefits</li>
  </ul>

  <h2>What to Watch For in the Coming Months</h2>

  <h3>Continued Administrative Changes</h3>
  <p>
    The SSA is awaiting Senate confirmation of Frank Bisignano, Trump's nominee
    to permanently lead the agency. His leadership may bring further changes to
    operations and services.
  </p>

  <h3>Legal Challenges</h3>
  <p>
    Several lawsuits have been filed regarding DOGE's access to sensitive Social
    Security data and the rapid changes at the agency. These legal actions may
    result in policy adjustments.
  </p>

  <h2>Staying Informed and Prepared</h2>

  <p>
    The changes at the Social Security Administration under the Trump
    administration and DOGE present significant challenges for beneficiaries. By
    staying informed, planning ahead, and knowing where to seek help, you can
    better navigate this period of transition.
  </p>

  <p>
    Remember that despite administrative changes, Social Security benefits
    themselves remain protected by law. The challenges primarily involve access
    to services rather than the fundamental structure of benefits.
  </p>

  <GuideFooter />
</div>
