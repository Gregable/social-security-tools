<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import InlineCTA from '../InlineCTA.svelte';
import EarnignsRecordLinkImage from './earnings-record-link.png';
import ErrorMessageImage from './error.png';
import HeroImage from './hero.png';
import StatementImage from './statement.png';

const title = 'Possible causes of Parsing Errors';
const description =
  'SSA.tools accepts a copy and pasted earnings record from ' +
  "the Social Security Administration's website. This guide explains " +
  'If your earnings record is not being parsed correctly, this guide ' +
  'may help you understand why and how to fix it.';
const publishDate = new Date('2023-09-12T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/earnings-record-paste';
schema.title = title;
schema.image = HeroImage;
schema.datePublished = publishDate.toISOString();
schema.description = description; // Pass the description to the schema
schema.imageAlt =
  'A woman looking confused with a tangle of pipes and a robot above her head';
schema.tags = ['Earnings Record', 'Social Security', 'SSA.gov', 'Import Data'];
</script>

<svelte:head>
  <title>{title} | SSA.tools</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={schema.url} />
  {@html schema.render()}
  {@html schema.renderSocialMeta()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>

  <figure class="hero-image">
    <img
      src={HeroImage}
      width="500"
      height="455"
      alt="A laptop displaying ERROR on the screen."
    />
  </figure>

  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    You likely reached this page after seeing an error like the following when
    trying to paste data into the ssa.tools calculator:
  </p>

  <figure>
    <img src={ErrorMessageImage} width="443" height="41" alt="Error message" />
  </figure>

  <h2>Data Paste</h2>
  <p>
    ssa.tools accepts a copy and pasted earnings record from the Social Security
    Administration's website. The box that you paste this into immediately
    updates after you paste data into it, no submit button press is required.
  </p>
  <p>
    However, in order to be parsed correctly, the data must be in a format the
    site understands. This site accepts pasted data from different browsers and
    operating systems. However, it's possible there are still a few formats that
    are unknown and not yet supported.
  </p>
  <p>
    If you've looked through the tips in this document and still think something
    is broken, please don't hesitate to <a href="/contact">reach out</a>!
  </p>

  <InlineCTA type="calculator" />

  <h2>Common Errors</h2>
  <div class="indent">
    <p>
      A few common issues that sometimes cause issues with the input include:
    </p>

    <h3>Copying data from the wrong place.</h3>
    <div class="indent">
      <p>
        There is only one place on the <a
          href="https://www.ssa.gov/myaccount/"
          target="_blank">ssa.gov</a
        > website where you can find your earnigns record. Once logged in, you should
        see a page like the following with a link to "Review your full earnings record
        now:"
      </p>

      <figure>
        <img
          src={EarnignsRecordLinkImage}
          width="991"
          height="578"
          alt="Screenshot of ssa.gov showing the link to the earnings record."
        />
        <figcaption>
          Screenshot of ssa.gov showing the link to the earnings record.
        </figcaption>
      </figure>

      <p>
        Alternatively, after logging in you can also go directly to <a
          href="https://secure.ssa.gov/ec2/eligibility-earnings-ui/earnings-record"
          target="_blank"
          >https://secure.ssa.gov/ec2/eligibility-earnings-ui/earnings-record</a
        >.
      </p>
    </div>

    <h3>Copying data from your PDF Social Security Statement</h3>
    <div class="indent">
      <p>
        The Social Security Administration also provides a PDF version of your
        earnings record. On page 2 of the PDF is a table with an abbreviated
        version of your earnings record that looks like the following:
      </p>
      <figure>
        <img
          src={StatementImage}
          width="359"
          height="516"
          alt="Screenshot of earnings record in PDF Social Security Statement."
        />
        <figcaption>
          Screenshot of earnings record in PDF Social Security Statement.
        </figcaption>
      </figure>
      <p>
        ssa.tools does accept this format as well, however it isn't as precise.
        If you notice, the first few rows are not individual years, but rather
        ranges of years. This means that the earnings for each year in the range
        are averaged together. This is not as precise as the data from the
        ssa.gov website.
      </p>
    </div>
  </div>
  <h2>Other Formats</h2>
  <div class="indent">
    <p>
      Some people copy data from their own spreadsheets or similar records. If
      you do this, ssa.tools will accept most formats. Some things to keep in
      mind that will make this easier:
    </p>
    <ul>
      <li>Each year's record should be one line.</li>
      <li>The first column should be the year.</li>
      <li>
        The second column should be the taxed earnings for social security.
      </li>
      <li>You can leave additional columns, they will be ignored.</li>
      <li>
        Separate columns with any whitespace: tab, spaces, or multiple of each.
      </li>
      <li>Commas (,) and Dollar Signs ($) are allowed but not required.</li>
    </ul>
    <p>An example of this format is:</p>
    <pre class="spreadsheetPasteExample">
      2015 $5,000
      2014 $4,000
      2013 $3,000
      2012 $2,000
      2011 $1,000
    </pre>
  </div>

  <GuideFooter />
</div>
