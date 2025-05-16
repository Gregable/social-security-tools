<!-- svelte-ignore a11y-click-events-have-key-events -->
<script lang="ts">
  import { Birthdate } from "$lib/birthday";
  import { MonthDuration } from "$lib/month-time";
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import StrategyWorker from "$lib/workers/strategy-worker?worker";
  import { onDestroy, onMount } from "svelte";
  import { StrategySequence } from "$lib/strategy";

  let startTime: number;
  let timeElapsed: number = 0;
  let done = false;
  let isRunning = false;
  let result = null;

  let recipients = [new Recipient(), new Recipient()];
  recipients[0].markFirst();
  recipients[1].markSecond();
  recipients[0].birthdate = Birthdate.FromYMD(1960, 3, 15);
  recipients[1].birthdate = Birthdate.FromYMD(1960, 3, 15);
  recipients[0].name = "Alex";
  recipients[1].name = "Chris";

  let pia: [number, number] = [1000, 300];
  let death_age = [75, 75];

  async function calculateStrategy() {
    if (isRunning) return;

    isRunning = true;
    done = false;
    result = null;

    startTime = Date.now();

    try {
      // Simulate a complex calculation (replace with your actual function)
      // This is just a placeholder for your real calculation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Example result - replace with your actual calculation
      result = {
        strategy: [
          { age: 70, benefit: Money.from(1400) },
          { age: 62, benefit: Money.from(840) },
        ],
        total: Money.from(2240),
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
      <RecipientName r={recipients[0]}></RecipientName> PIA = {recipients[0]
        .pia()
        .primaryInsuranceAmount()
        .string()}, born {recipients[0].birthdate.layBirthdateString()}
    </li>
    <li>
      <RecipientName r={recipients[1]}></RecipientName>: PIA = {recipients[1]
        .pia()
        .primaryInsuranceAmount()
        .string()}, born {recipients[0].birthdate.layBirthdateString()}
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
                <strong>{result.strategy[0].age}</strong> for a benefit of
                <strong>{result.strategy[0].benefit.wholeDollars()}</strong>
              </li>
              <li>
                <RecipientName r={recipients[1]}></RecipientName> should file at
                age
                <strong>{result.strategy[1].age}</strong> for a benefit of
                <strong>{result.strategy[1].benefit.wholeDollars()}</strong>
              </li>
            </ul>
            <p class="total">
              Total monthly benefit: <strong
                >{result.total.wholeDollars()}</strong
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
