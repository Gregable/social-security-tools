<script lang="ts">
import { incomePiaExample } from '$lib/income-pia-example';
import { Money } from '$lib/money';

/** The steady annual salary the guide is about, in whole dollars. */
export let annualIncome: number;

$: e = incomePiaExample(Money.from(annualIncome));
$: reachesThirdBracket = e.aime.greaterThan(e.secondBendPoint);
// Bend points are whole dollars and read best that way; an AIME keeps cents.
$: firstBracketBase = e.aime.greaterThanOrEqual(e.firstBendPoint)
  ? e.firstBendPoint.wholeDollars()
  : e.aime.string();
$: secondBracketTop = reachesThirdBracket
  ? e.secondBendPoint.wholeDollars()
  : e.aime.string();

const percent = (rate: number): string => `${Math.round(rate * 100)}%`;
const factor = (rate: number): string => rate.toFixed(2);
</script>

<h2>Calculating Your Primary Insurance Amount (PIA)</h2>
<p>
  Your <strong>Primary Insurance Amount (PIA)</strong> is the benefit you
  would receive if you start collecting Social Security at your
  <a href="https://www.ssa.gov/oact/progdata/nra.html"
    ><strong>Normal Retirement Age</strong></a
  >. It's calculated using a
  <a href="https://www.ssa.gov/oact/cola/piaformula.html">formula</a> that
  applies "<strong>bend points</strong>" to your AIME. For workers turning 62
  in {e.eligibilityYear}, the
  <a href="https://www.ssa.gov/oact/cola/bendpoints.html">bend points</a> are
  <strong>{e.firstBendPoint.wholeDollars()}</strong> and
  <strong>{e.secondBendPoint.wholeDollars()}</strong>.
</p>
<p>Here's how the calculation works for an AIME of {e.aime.string()}:</p>
<ul>
  <li>
    <strong
      >{percent(e.firstBracket.rate)} of the first {e.firstBendPoint.wholeDollars()}:</strong
    >
    {factor(e.firstBracket.rate)} * {firstBracketBase} =
    <strong>{e.firstBracket.amount.string()}</strong>
  </li>
  <li>
    <strong
      >{percent(e.secondBracket.rate)} of the amount over {e.firstBendPoint.wholeDollars()}
      up to {e.secondBendPoint.wholeDollars()}:</strong
    >
    The amount between {e.firstBendPoint.wholeDollars()} and
    {secondBracketTop} is {secondBracketTop} -
    {e.firstBendPoint.wholeDollars()} = {e.secondBracket.base.string()}.
    {factor(e.secondBracket.rate)} * {e.secondBracket.base.string()} =
    <strong>{e.secondBracket.amount.string()}</strong>
  </li>
  <li>
    <strong
      >{percent(e.thirdBracket.rate)} of the amount over {e.secondBendPoint.wholeDollars()}:</strong
    >
    {#if reachesThirdBracket}
      The amount over {e.secondBendPoint.wholeDollars()} is {e.aime.string()} -
      {e.secondBendPoint.wholeDollars()} = {e.thirdBracket.base.string()}.
      {factor(e.thirdBracket.rate)} * {e.thirdBracket.base.string()} =
      <strong>{e.thirdBracket.amount.string()}</strong>
    {:else}
      Since your AIME ({e.aime.string()}) is not over
      {e.secondBendPoint.wholeDollars()}, this portion is
      <strong>{e.thirdBracket.amount.string()}</strong>.
    {/if}
  </li>
</ul>
<p>
  <strong
    >Your estimated Primary Insurance Amount (PIA) = {e.firstBracket.amount.string()}
    + {e.secondBracket.amount.string()} + {e.thirdBracket.amount.string()} =
    {e.pia.string()} per month.</strong
  >
</p>
