# Probabilistic "Best Answer" Mode

## Goal

Add a probability-weighted NPV calculation that recommends a single optimal
filing age (or pair for couples) based on actuarial life table data. This
collapses the existing per-death-age matrix into a headline recommendation.

## Calculation Design

### Single Filer

For each candidate filing age (monthly, 62y0m to 70y0m):

```
E[NPV](filing_age) = SUM over death_age of:
    P(death at death_age) * NPV(filing_age, death_age, discount_rate)
```

- Death ages: yearly granularity from current age to ~120
- Filing ages before death age: NPV = $0 (died before collecting)
- Reuses `strategySumCentsSingle()` directly for each (filing_age, death_age)
- ~97 filing ages x ~60 death ages = ~5,800 evaluations. Trivially fast.

### Couple

For each candidate filing pair (monthly, 97 x 97 = ~9,400 pairs):

Pre-compute per filing pair:
- Earner/dependent personal monthly benefit via `benefitOnDateOptimized()`
- Spousal monthly benefit via `spousalBenefitOnDate()`
- Survivor benefit amount for each possible earner death year via
  `survivorBenefit()` (~60 calls per filing pair)

Year-by-year forward simulation (O(years) per filing pair):

```
E[annual(Y)] =
    P(earner alive at Y) * earnerPersonal(Y)
  + P(dep alive at Y) * depPersonal(Y)
  + P(earner alive at Y) * P(dep alive at Y) * spousal(Y)
  + P(dep alive at Y) * cumulativeWeightedSurvivor(Y)
```

Where `cumulativeWeightedSurvivor(Y)` accumulates incrementally:
```
cumulativeWeightedSurvivor(Y+1) =
    cumulativeWeightedSurvivor(Y)
  + P(earner dies at Y) * max(0, survivorBenefit(Y) - depPersonal)
```

Each year's expected benefit is discounted to present value and summed.

Total complexity: O(97^2 x 60) ~ 564K lightweight operations.

### Key Assumptions

- Deaths are independent between spouses (standard actuarial assumption)
- Both recipients are alive at the current date
- Deaths before filing eligibility (age 62) are ignored
- Survivor benefit varies by earner death year (NOT simplified like
  opensocialsecurity.com which assumes earner always filed before death)
- Death probability granularity: yearly (matches life table resolution)
- Filing age granularity: monthly

### Survivor Benefit Handling

The survivor benefit amount depends on when the earner dies:

1. **Earner died before filing**: `survivorBenefit()` handles this -- uses PIA
   or delayed credits up to death date
2. **Earner died after filing**: uses max(82.5% PIA, filed benefit) -- constant
   for a given filing age
3. **Survivor age reduction**: varies since survivor starts claiming at
   max(earnerDeath + 1 month, depFilingDate)

The existing `survivorBenefit()` function handles all three cases. We call it
once per possible earner death year per filing pair.

## Refactoring

### Extract `classifyEarnerDependent()`

The earner/dependent classification logic is duplicated between
`strategySumPeriodsCouple()` and `createOptimizationContext()`. Extract into a
shared function:

```typescript
interface EarnerDependentClassification {
  earner: Recipient;
  dependent: Recipient;
  earnerIndex: number;
  dependentIndex: number;
}

function classifyEarnerDependent(
  recipients: [Recipient, Recipient]
): EarnerDependentClassification
```

Both existing code paths and the new probabilistic code use this.

## UI Design

### Placement

New component rendered above the existing matrix/plot after calculation
completes. Simple text display:

- Single: "Optimal filing age: Xy Zm -- Expected NPV: $X"
- Couple: "Optimal filing ages: Xy Zm / Xy Zm -- Expected NPV: $X"

### Integration

- Computed alongside the existing matrix (same Calculate button)
- No reactive recalculation (deferred to Task 3)
- No web workers needed (performance is sufficient)

## What's NOT Changing

- Existing matrix/plot remains as-is below the headline
- No changes to existing `strategySumCentsSingle/Couple` functions
- No changes to death probability distribution calculation
- No changes to the Calculate button flow (just additional computation)

## Files Affected

### New files
- `src/lib/strategy/calculations/expected-npv.ts` -- core probabilistic
  calculation functions
- `src/lib/strategy/calculations/earner-dependent.ts` -- extracted
  classification logic
- `src/test/strategy/expected-npv.test.ts` -- tests for probabilistic
  calculations
- `src/routes/strategy/components/OptimalStrategyHeadline.svelte` -- UI
  component

### Modified files
- `src/lib/strategy/calculations/strategy-calc.ts` -- use extracted
  classification function
- `src/lib/strategy/calculations/index.ts` -- export new functions
- `src/routes/strategy/+page.svelte` -- integrate headline component and
  trigger probabilistic calculation
