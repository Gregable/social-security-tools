<script lang="ts">
  import { GuidesSchema } from "$lib/schema-org";
  import GuideFooter from "../guide-footer.svelte";

  const title = "Third-Party Integrations";
  const description =
    "Learn about third-party tools that integrate with SSA.tools to provide enhanced retirement planning capabilities.";
  const published = "2025-12-20";
  const modified = "2026-01-14";

  const schema = new GuidesSchema();
  schema.url = "https://ssa.tools/guides/integrations";
  schema.title = title;
  schema.description = description;
  schema.datePublished = published;
  schema.dateModified = modified;
  schema.image = "https://ssa.tools/laptop-piggybank.jpg";
  schema.imageAlt = "SSA.tools Integrations Guide";
  schema.tags = [
    "Social Security",
    "Retirement Planning",
    "Integrations",
    "Tools",
  ];
</script>

<svelte:head>
  <title>{title} | SSA.tools</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={schema.url} />
  {@html schema.renderSocialMeta()}
  {@html schema.render()}
</svelte:head>

<div class="guide-page">
  <h1>{title}</h1>
  <p class="postdate">Published: {new Date(published).toLocaleDateString()}</p>

  <p>
    SSA.tools is designed to be a powerful, standalone calculator for Social
    Security benefits. However, retirement planning often involves more than
    just Social Security. That's why I've built an integration system that
    allows other financial planning tools to seamlessly connect with SSA.tools.
  </p>

  <p>
    These integrations allow you to move data between SSA.tools and other
    platforms, ensuring that your Social Security estimates are accurate and
    consistent across your entire financial plan.
  </p>

  <h2>Current Integrations</h2>
  <p>
    The following tools have built-in integrations with SSA.tools. Each
    integration is designed to streamline your planning workflow.
  </p>

  <table class="integration-table">
    <thead>
      <tr>
        <th>Tool</th>
        <th>Description</th>
        <th>Integration Features</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <a href="/calculator#integration=opensocialsecurity.com"
            >Open Social Security</a
          >
        </td>
        <td>
          A free, open-source tool that helps you determine the optimal claiming
          strategy to maximize your lifetime benefits.
        </td>
        <td>
          Transfers your detailed earnings record from SSA.tools to Open Social
          Security, ensuring their optimization engine uses the most accurate
          benefit estimates.
        </td>
      </tr>
      <tr>
        <td><a href="/calculator#integration=linopt.com">Linopt</a></td>
        <td>Focuses on retirement income optimization.</td>
        <td>
          Displays your Primary Insurance Amount (PIA) adjusted for inflation,
          formatted specifically for input into Linopt's planning models.
        </td>
      </tr>
      <tr>
        <td><a href="/calculator#integration=firecalc.com">FIRECalc</a></td>
        <td>
          A popular tool for testing the viability of your retirement portfolio
          against historical market data.
        </td>
        <td>
          Provides your Social Security benefits in today's dollars, with start
          years rather than ages, making it easy to plug accurate figures into
          FIRECalc's "Social Security" tab.
        </td>
      </tr>
      <tr>
        <td><a href="/calculator#integration=ficalc.app">FI Calc</a></td>
        <td>
          A modern retirement calculator that helps you visualize your
          withdrawal strategy success rates.
        </td>
        <td>
          Generates specific income entries for FI Calc, including annual
          amounts and start-year offsets, so you can accurately model your
          Social Security income streams within their app.
        </td>
      </tr>
      <tr>
        <td><a href="/calculator#integration=cfiresim.com">cFIREsim</a></td>
        <td>
          Crowdsourced FIRE Simulator is another historical simulation tool for
          retirement planning.
        </td>
        <td>
          Guides you through creating the correct adjustment entries for
          cFIREsim, ensuring your Social Security benefits are modeled correctly
          in your simulations.
        </td>
      </tr>
      <tr>
        <td>
          <a href="/calculator#integration=finpodsai.com">Fin Pods AI</a>
        </td>
        <td>
          Uses auditable intelligence to assist with financial planning.
        </td>
        <td>
          Connects your SSA.tools data with Fin Pods AI's analysis tools.
        </td>
      </tr>
      <tr>
        <td>
          <a href="/calculator#integration=owlplanner.streamlit.app"
            >Owl Retirement Planner</a
          >
        </td>
        <td>A comprehensive retirement planning application.</td>
        <td> Displays your Primary Insurance Amount (PIA) values. </td>
      </tr>
      <tr>
        <td>
          <a href="/calculator#integration=fireproofme.com">FIREProof</a>
        </td>
        <td>
          A retirement planning tool that helps you model income streams and
          expenses throughout retirement.
        </td>
        <td>
          Provides your Social Security benefits as annual amounts with start
          years, formatted for easy entry into FIREProof's income tracking
          system.
        </td>
      </tr>
    </tbody>
  </table>

  <h2>How Integrations Work</h2>

  <h3>Passing Data In</h3>
  <p>
    Integrations are typically activated via a special URL parameter. For
    example, a third-party site might send you to SSA.tools with a link like:
  </p>
  <pre><code>https://ssa.tools/calculator#integration=sitename.com</code></pre>
  <p>
    They can also pre-fill your data using the <a href="/guides/url-parameters"
      >URL parameters</a
    >, so you don't have to re-enter your information:
  </p>
  <pre><code
      >https://ssa.tools/calculator#integration=sitename.com&pia1=3000&dob1=1980-01-01</code
    ></pre>

  <h3>Getting Data Out</h3>
  <p>
    When an integration is active, you'll see a banner at the top of the page.
    Once you've completed your earnings record entry, a new section will appear
    at the bottom of your report.
  </p>
  <p>
    This "Report End" section is customized for each integration. It might
    display your data in a specific format, provide copy-paste values, or offer
    a button to send your calculated benefits back to the third-party tool.
  </p>

  <h2>Interested in Integrating?</h2>
  <p>
    I am always looking to expand the ecosystem of high-quality financial
    planning tools. If you run a retirement planning site or financial tool and
    would like to integrate with SSA.tools, I'd love to hear from you.
  </p>
  <p>
    The integration system is designed to be flexible and secure. I can work
    with you to define the best way to exchange data and provide a seamless
    experience for our mutual users.
  </p>
  <p>
    Please <a href="/contact">contact me</a> to discuss potential integrations.
  </p>

  <GuideFooter />
</div>

<style>
  .integration-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2em 0;
    font-size: 0.9em;
  }

  .integration-table th,
  .integration-table td {
    padding: 12px 15px;
    border: 1px solid #ddd;
    text-align: left;
    vertical-align: top;
  }

  .integration-table th {
    background-color: #f4f4f4;
    font-weight: bold;
    color: #333;
  }

  .integration-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }

  .integration-table tr:hover {
    background-color: #f1f1f1;
  }

  .integration-table a {
    font-weight: bold;
  }

  pre {
    background: #f4f4f4;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9em;
  }
</style>
