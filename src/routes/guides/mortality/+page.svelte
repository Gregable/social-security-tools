<script lang="ts">
import { GuidesSchema } from '$lib/schema-org';
import GuideFooter from '../guide-footer.svelte';
import lifeTable from './life-table.png'; // imported so bundler serves asset

const title = 'Mortality Tables and Health Adjustments';
const description =
  'How SSA cohort life tables are used, how q(x) death probabilities are derived, gender blending, and how the health multiplier adjusts mortality.';
const publishDate = new Date('2025-08-08T00:00:00+00:00');
const updateDate = publishDate; // Update when content changes

let schema: GuidesSchema = new GuidesSchema();
schema.url = 'https://ssa.tools/guides/mortality';
schema.title = title;
schema.image = lifeTable; // use bundled image path
schema.datePublished = publishDate.toISOString();
schema.dateModified = updateDate.toISOString();
schema.description = description;
schema.imageAlt =
  'Laptop with piggybank representing Social Security and life expectancy';
schema.tags = ['Life Expectancy', 'Social Security', 'Mortality', 'Actuarial'];
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
  <figure class="hero-float">
    <img src={lifeTable} width="512" height="512" alt="" loading="lazy" />
  </figure>

  <p>
    This guide explains how Social Security cohort life tables are used to
    estimate mortality, how probabilities are transformed into a distribution of
    death ages for the strategy matrix, and how the optional health adjustment
    slider modifies those probabilities.
  </p>

  <h2>Data Sources</h2>
  <p>
    The default mortality inputs come from the U.S. Social Security
    Administration (SSA) cohort life tables (Alternative 2 / Best Estimate).
    Source: <a
      href="https://www.ssa.gov/OACT/Downloadables/CY/index.html"
      target="_blank"
      rel="noopener">SSA Office of the Chief Actuary</a
    >.
  </p>

  <h3>Cohort vs. Period Life Tables</h3>
  <ul>
    <li>
      <strong>Period tables</strong> apply one year’s observed mortality rates to
      all future ages for a hypothetical person; they freeze longevity improvement.
    </li>
    <li>
      <strong>Cohort (generation) tables</strong> follow an actual birth cohort across
      time, blending historical experience with projected future mortality improvement.
    </li>
  </ul>
  <p>
    Because medical and longevity improvements are expected to continue, cohort
    tables are typically preferred for forward-looking retirement planning—they
    better reflect expected future survival than static period tables.
  </p>

  <h2>Using the SSA Cohort Tables</h2>
  <p>
    The tables provide <code>q(x)</code>: the probability that someone alive at
    exact age <code>x</code> dies before reaching age <code>x+1</code>. For each
    recipient we load the cohort file for their birth year and extract the
    sequence of <code>q(x)</code> values beginning at their current age.
  </p>
  <p>
    If gender is left as “Unspecified”, we construct a blended mortality by
    averaging male and female values:
  </p>
  <div class="math-block">
    <math
      display="block"
      aria-label="Blended mortality q blended of x equals the average of male and female cohort death probabilities at age x"
    >
      <msub><mi>q</mi><mi>blended</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo>
      <mo>=</mo>
      <mfrac>
        <mrow>
          <msub><mi>q</mi><mi>male</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo>
          <mo>+</mo>
          <msub><mi>q</mi><mi>female</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo>
        </mrow>
        <mn>2</mn>
      </mfrac>
    </math>
  </div>
  <p class="math-summary">
    In words: blended mortality is the simple average of male and female
    probabilities at each age.
  </p>

  <h3>From q(x) to a Death Age Distribution</h3>
  <ol>
    <li>
      Initialize survival probability <math display="inline"
        ><mi>S</mi><mo>=</mo><mn>1</mn></math
      >.
    </li>
    <li>
      For each age <math display="inline"><mi>x</mi></math>, compute yearly
      death probability:
      <math display="inline"
        ><msub
          ><mi>p</mi><mrow
            ><mi>d</mi><mi>e</mi><mi>a</mi><mi>t</mi><mi>h</mi></mrow
          ></msub
        ><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mi>S</mi><mo>&#x2062;</mo><mi
          >q</mi
        ><mo>(</mo><mi>x</mi><mo>)</mo></math
      >.
    </li>
    <li>
      Update survival for next age: <math display="inline"
        ><msub><mi>S</mi><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow></msub><mo
          >=</mo
        ><msub><mi>S</mi><mi>x</mi></msub><mo>(</mo><mn>1</mn><mo>-</mo><mi
          >q</mi
        ><mo>(</mo><mi>x</mi><mo>)</mo><mo>)</mo></math
      >.
    </li>
    <li>
      Repeat until maximum age (cap 120); assign any residual survival
      probability to the terminal age.
    </li>
  </ol>
  <p>
    The resulting list of <code>&#123; age, probability &#125;</code> pairs forms
    a discrete distribution used to scale the row and column segment sizes in the
    strategy matrix—larger segments correspond to more likely death age ranges.
  </p>

  <h2>Health Adjustment Slider</h2>
  <p>
    You can optionally apply a uniform health multiplier between 0.7× and 2.5×
    to each annual mortality probability before converting to the distribution:
  </p>
  <div class="math-block">
    <math
      display="block"
      aria-label="Adjusted mortality q adj of x equals baseline mortality q base of x times the selected health multiplier"
    >
      <msub><mi>q</mi><mi>adj</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo>
      <mo>=</mo>
      <msub><mi>q</mi><mi>base</mi></msub><mo>(</mo><mi>x</mi><mo>)</mo>
      <mo>&#x00B7;</mo>
      <mi>m</mi><mi>u</mi><mi>l</mi><mi>t</mi><mi>i</mi><mi>p</mi><mi>l</mi><mi
        >i</mi
      ><mi>e</mi><mi>r</mi>
    </math>
  </div>
  <p class="math-summary">
    In words: adjusted mortality equals baseline mortality multiplied by the
    selected health multiplier.
  </p>
  <p>
    This keeps the relative shape of the mortality curve while shifting overall
    mortality levels up or down; it assumes your relative difference vs. average
    persists across ages.
  </p>
  <p>
    <strong>Illustrative impact (approximate):</strong> If a 66-year-old baseline
    cohort life expectancy is ~20 additional years (to age 86), a 0.8× health multiplier
    might extend that to roughly 21–22 years, while a 1.7× health multiplier could
    reduce it to roughly 15–16 years. (Illustrative only; actual results depend on
    full age-specific pattern.)
  </p>

  <h3>Interpretation of Multipliers</h3>
  <div class="multiplier-interpretation">
    <table>
      <thead>
        <tr><th>Multiplier</th><th>Label</th><th>Indicative Meaning</th></tr>
      </thead>
      <tbody>
        <tr
          ><td>0.7×</td><td>Exceptional Health</td><td
            >Preferred-plus style underwriting class; markedly lower risk.</td
          ></tr
        >
        <tr
          ><td>0.8×</td><td>Excellent Health</td><td
            >Clearly better than average risk.</td
          ></tr
        >
        <tr
          ><td>0.9×</td><td>Good Health</td><td
            >Moderately better than average.</td
          ></tr
        >
        <tr class="baseline"
          ><td>1.0×</td><td>Average Health</td><td
            >Baseline SSA cohort mortality.</td
          ></tr
        >
        <tr
          ><td>1.3×</td><td>Fair Health</td><td
            >Elevated risk; some chronic factors.</td
          ></tr
        >
        <tr
          ><td>1.7×</td><td>Poor Health</td><td
            >Substantially elevated mortality risk.</td
          ></tr
        >
        <tr
          ><td>2.5×</td><td>Very Poor Health</td><td
            >Severe / multiple conditions; substantially elevated risk.</td
          ></tr
        >
      </tbody>
    </table>
  </div>

  <p>
    <em>Note:</em> These adjustments reflect broad population statistics; individual
    outcomes vary.
  </p>

  <h3>Why These Values?</h3>
  <ul>
    <li>
      <strong>Medical research:</strong> Meta-analysis (<a
        href="https://doi.org/10.1111/j.1525-1497.2005.00291.x"
        target="_blank"
        rel="noopener">DeSalvo et al., 2006</a
      >) shows ~20% lower mortality for “excellent” vs. average, and ~30% / ~70%
      higher for “fair” / “poor”; long-term follow-up (<a
        href="https://doi.org/10.1186/s12877-020-1475-6"
        target="_blank"
        rel="noopener">Eriksson et al., 2020</a
      >) shows very poor states can approach ~2×.
    </li>
    <li>
      <strong>Actuarial practice:</strong> Life insurance preferred classes cluster
      around 70–85% of standard mortality; table ratings escalate to 150–250%+ for
      impaired risks.
    </li>
  </ul>

  <h2>References</h2>
  <ul>
    <li>
      <a
        href="https://doi.org/10.1111/j.1525-1497.2005.00291.x"
        target="_blank"
        rel="noopener">DeSalvo, K.B., et al. (2006)</a
      >. <em>Journal of General Internal Medicine</em>, 21(3), 267–275.
    </li>
    <li>
      <a
        href="https://doi.org/10.1186/s12877-020-1475-6"
        target="_blank"
        rel="noopener">Eriksson, M., et al. (2020)</a
      >. <em>BMC Geriatrics</em>, 20, 75.
    </li>
    <li>
      <a
        href="https://www.ssa.gov/OACT/Downloadables/CY/index.html"
        target="_blank"
        rel="noopener"
        >SSA Office of the Chief Actuary: Cohort Life Tables (Alt 2)</a
      >.
    </li>
  </ul>

  <GuideFooter />
</div>
