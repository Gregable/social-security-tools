<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import { MonthDate, MonthDuration } from "$lib/month-time";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import { optimalStrategy } from "$lib/strategy/strategy-calc";

  let startTime: number;
  let timeElapsed: number = 0;
  let done = false;
  let isRunning = false;
  let result = null;

  let recipients: [Recipient, Recipient] = [new Recipient(), new Recipient()];
  recipients[0].markFirst();
  recipients[1].markSecond();
  recipients[0].birthdate = Birthdate.FromYMD(1960, 3, 15);
  recipients[1].birthdate = Birthdate.FromYMD(1960, 3, 15);
  recipients[0].name = "Alex";
  recipients[1].name = "Chris";

  let pia: [number, number] = [1000, 300];
  let death_age = [85, 85];

  async function calculateStrategy() {
    if (isRunning) return;

    isRunning = true;
    done = false;
    result = null;

    startTime = Date.now();

    try {
      // Set PIA for recipients
      recipients[0].setPia(Money.from(pia[0]));
      recipients[1].setPia(Money.from(pia[1]));

      // Calculate final dates from death ages
      const finalDates: [MonthDate, MonthDate] = [
        recipients[0].birthdate.dateAtLayAge(
          MonthDuration.initFromYearsMonths({ years: death_age[0], months: 0 })
        ),
        recipients[1].birthdate.dateAtLayAge(
          MonthDuration.initFromYearsMonths({ years: death_age[1], months: 0 })
        ),
      ];

      // Adjust the final dates to be the last month of the year
      for (let i = 0; i < 2; ++i) {
        finalDates[i] = finalDates[i].addDuration(
          new MonthDuration(11 - finalDates[i].monthIndex())
        );
      }

      // Get current date for optimal strategy calculation
      const now = new Date();
      const currentDate = MonthDate.initFromYearsMonths({
        years: now.getFullYear(),
        months: now.getMonth(),
      });
      console.log("currentDate: " + currentDate.toString());

      // Calculate optimal strategy
      const optimal = optimalStrategy(recipients, finalDates, currentDate);

      // Format the result for display
      const filingDate1 = recipients[0].birthdate.dateAtLayAge(optimal[0]);
      const filingDate2 = recipients[1].birthdate.dateAtLayAge(optimal[1]);

      result = {
        strategy: [
          {
            age: optimal[0],
            benefit: recipients[0].benefitAtAge(optimal[0]),
            filingDate: filingDate1,
          },
          {
            age: optimal[1],
            benefit: recipients[1].benefitAtAge(optimal[1]),
            filingDate: filingDate2,
          },
        ],
        totalLifetimeBenefit: Money.fromCents(optimal[2]),
      };

      done = true;
    } catch (error) {
      console.error("Calculation error:", error);
      result = { error: error.message };
    } finally {
      timeElapsed = (Date.now() - startTime) / 1000;
      isRunning = false;
    }
  }
</script>

<main>
  <h1>
    Warning: This is a work in progress and probably incorrect. Please
    disregard.
  </h1>

  Name:<input type="text" bind:value={recipients[0].name} />
  <br />
  <RecipientName r={recipients[0]}></RecipientName> PIA:
  <input type="number" bind:value={pia[0]} />
  <br />
  Name: <input type="text" bind:value={recipients[1].name} />
  <br />
  <RecipientName r={recipients[1]}></RecipientName> PIA:
  <input type="number" bind:value={pia[1]} />
  <p>
    This page shows the optimal Social Security claiming strategy for a couple
    with the following characteristics:
  </p>
  <ul>
    <li>
      <RecipientName r={recipients[0]}></RecipientName> PIA = ${pia[0]}, born
      {recipients[0].birthdate.layBirthdateString()}
    </li>
    <li>
      <RecipientName r={recipients[1]}></RecipientName>: PIA = ${pia[1]}, born
      {recipients[1].birthdate.layBirthdateString()}
    </li>
  </ul>

  <div class="calculation-section">
    <button
      on:click={calculateStrategy}
      disabled={isRunning}
      class="calculate-button"
    >
      {isRunning ? "Calculating..." : "Calculate Optimal Strategy"}
    </button>

    {#if isRunning}
      <div class="loading">
        <span class="spinner"></span> Processing...
      </div>
    {/if}

    {#if done}
      <div class="result-box">
        <h3>Calculation Results</h3>
        <p>Calculation completed in {timeElapsed.toFixed(2)} seconds</p>

        {#if result}
          <div class="strategy-results">
            <h4>Optimal Filing Strategy:</h4>
            <ul>
              <li>
                <RecipientName r={recipients[0]}></RecipientName> should file at
                age
                <strong>{result.strategy[0].age.years()}</strong> years and
                <strong>{result.strategy[0].age.modMonths()}</strong> months ({result.strategy[0].filingDate.monthName()}
                {result.strategy[0].filingDate.year()}) for a benefit of
                <strong>{result.strategy[0].benefit.string()}</strong>
              </li>
              <li>
                <RecipientName r={recipients[1]}></RecipientName> should file at
                age
                <strong>{result.strategy[1].age.years()}</strong> years and
                <strong>{result.strategy[1].age.modMonths()}</strong> months ({result.strategy[1].filingDate.monthName()}
                {result.strategy[1].filingDate.year()}) for a benefit of
                <strong>{result.strategy[1].benefit.string()}</strong>
              </li>
            </ul>
            <p class="total">
              Total lifetime benefit: <strong
                >{result.totalLifetimeBenefit.string()}</strong
              >
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</main>

<style>
</style>
