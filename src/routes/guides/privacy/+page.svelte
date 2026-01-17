<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';

const title = 'Privacy & Security';
const description =
  'SSA.tools is designed with privacy as a core principle. Your Social Security ' +
  'earnings data never leaves your computer. All calculations happen entirely ' +
  'in your browser.';
const publishDate = new Date('2025-01-14T00:00:00+00:00');

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/privacy';
schema.title = title;
schema.datePublished = publishDate.toISOString();
schema.description = description;
schema.tags = ['Privacy', 'Security', 'Data Protection', 'Social Security'];
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

  <p class="postdate">Published: {publishDate.toLocaleDateString()}</p>

  <p>
    SSA.tools is designed with privacy as a core principle. Your Social Security
    earnings record contains sensitive financial information, and this
    calculator is built to ensure your data stays completely private.
  </p>

  <h2>Your Data Never Leaves Your Computer</h2>
  <p>
    When you paste your earnings record into SSA.tools, the data is processed
    entirely within your web browser using JavaScript. <strong
      >No data is ever sent to any server.</strong
    > There is no database storing your information, no account to create, and no
    way for anyone to access your earnings data.
  </p>
  <p>
    This is fundamentally different from many other financial calculators that
    require you to create an account or upload your data to their servers.
  </p>

  <h2>How It Works Technically</h2>
  <p>
    When you paste data into the calculator:
  </p>
  <ol>
    <li>
      Your browser's JavaScript parses the text you pasted
    </li>
    <li>
      All Social Security benefit calculations run locally in your browser
    </li>
    <li>
      Results are displayed without any network requests containing your data
    </li>
    <li>
      If you close the browser tab, the data is gone (nothing is stored)
    </li>
  </ol>
  <p>
    You can verify this yourself by opening your browser's developer tools
    (F12) and watching the Network tab while using the calculator. You'll see
    that no requests containing your earnings data are made.
  </p>

  <h2>What Data Does the Site Collect?</h2>
  <p>
    SSA.tools uses privacy-focused analytics to understand how people use the
    site (which pages are visited, which features are used). This helps improve
    the calculator. However:
  </p>
  <ul>
    <li>
      <strong>Your earnings data is never collected</strong> (it stays in your browser)
    </li>
    <li>
      <strong>Your birthdate is never collected</strong> (entered locally only)
    </li>
    <li>
      <strong>No personally identifiable information is collected</strong>
    </li>
  </ul>
  <p>
    Analytics data includes only general usage patterns: page views, button
    clicks, and similar interaction data that contains no personal financial
    information.
  </p>

  <h2>Open Source Transparency</h2>
  <p>
    SSA.tools is completely open source. You can inspect every line of code on
    <a
      href="https://github.com/Gregable/social-security-tools"
      target="_blank"
      rel="noopener">GitHub</a
    >. This transparency means:
  </p>
  <ul>
    <li>
      Anyone can verify these privacy claims by reading the code
    </li>
    <li>
      Security researchers can audit the application
    </li>
    <li>
      The community can contribute improvements
    </li>
  </ul>

  <h3>Key Privacy-Related Code</h3>
  <p>
    Here are direct links to specific files that implement the privacy features:
  </p>
  <ul>
    <li>
      <a
        href="https://github.com/Gregable/social-security-tools/blob/main/src/lib/ssa-parse.ts"
        target="_blank"
        rel="noopener">ssa-parse.ts</a
      >: The client-side parser that processes your pasted earnings data entirely
      in the browser
    </li>
    <li>
      <a
        href="https://github.com/Gregable/social-security-tools/blob/main/src/routes/%2Blayout.ts"
        target="_blank"
        rel="noopener">+layout.ts</a
      >: Analytics configuration showing privacy settings: <code>autocapture: false</code>,
      <code>disable_session_recording: true</code>, and <code>mask_all_text: true</code>
    </li>
    <li>
      <a
        href="https://github.com/Gregable/social-security-tools/blob/main/src/lib/recipient.ts"
        target="_blank"
        rel="noopener">recipient.ts</a
      >: The data model that stores your information only in browser memory
    </li>
  </ul>

  <h2>No Account Required</h2>
  <p>
    Unlike many financial tools, SSA.tools doesn't require you to create an
    account, provide an email address, or sign up for anything. You can use the
    full calculator immediately and anonymously.
  </p>

  <h2>Comparison to Other Calculators</h2>
  <p>
    Many Social Security calculators require you to:
  </p>
  <ul>
    <li>Create an account with your email</li>
    <li>Upload documents to their servers</li>
    <li>Trust their data handling practices</li>
    <li>Hope they don't suffer a data breach</li>
  </ul>
  <p>
    With SSA.tools, none of these concerns apply because your data never leaves
    your device in the first place.
  </p>

  <h2>Questions?</h2>
  <p>
    If you have any questions about how SSA.tools handles data, please
    <a href="/contact">get in touch</a>. You're also welcome to
    <a
      href="https://github.com/Gregable/social-security-tools"
      target="_blank"
      rel="noopener">review the source code</a
    > directly.
  </p>

  <GuideFooter />
</div>
