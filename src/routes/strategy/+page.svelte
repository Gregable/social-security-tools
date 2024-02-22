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

  const MAX_AGE = 110;
  const MIN_AGE = 62;
  const TABLE_WIDTH = MAX_AGE - MIN_AGE + 1;

  let startTime: number;
  let timeElapsed: number = 0;
  let done = false;

  let recipients = [new Recipient(), new Recipient()];
  recipients[0].markFirst();
  recipients[1].markSecond();
  recipients[0].birthdate = Birthdate.FromYMD(1960, 3, 15);
  recipients[1].birthdate = Birthdate.FromYMD(1960, 3, 15);
  recipients[0].name = "Alex";
  recipients[1].name = "Chris";

  let pia: [number, number] = [1000, 300];

  let buffer_: SharedArrayBuffer;
  // For each "final age" (A, B) pair, create one shared array to hold
  // each one of the results of the calculation. The index into the array is
  // (A - 62) * 49 + (B - 62). The width / height of the table is
  // 49 (110 - 62 + 1). We don't need to store values for ages < 62 because
  // people can't file for benefits before then anyway.

  // sharedAgeAUint16Array hold the recommended filing age for person A.
  let sharedAgeAUint16Array: Uint16Array;
  // sharedAgeBUint16Array hold the recommended filing age for person B.
  let sharedAgeBUint16Array: Uint16Array;
  // sharedStrategySumUint16Array holds the sum of the strategy, in cents.
  let sharedStrategySumUint32Array: Uint32Array;

  function initializeBuffer() {
    // Shared buffer:
    buffer_ = new SharedArrayBuffer(
      // 2 bytes per Uint16Array element, 4 per Unit32Array element.
      TABLE_WIDTH * TABLE_WIDTH * (2 + 2 + 4)
    );
    let offset = 0;
    sharedAgeAUint16Array = new Uint16Array(
      buffer_,
      offset,
      TABLE_WIDTH * TABLE_WIDTH
    );
    offset += TABLE_WIDTH * TABLE_WIDTH * 2;
    sharedAgeBUint16Array = new Uint16Array(
      buffer_,
      offset,
      TABLE_WIDTH * TABLE_WIDTH
    );
    offset += TABLE_WIDTH * TABLE_WIDTH * 2;
    sharedStrategySumUint32Array = new Uint32Array(
      buffer_,
      offset,
      TABLE_WIDTH * TABLE_WIDTH
    );
  }

  class DisplayedStrategy {
    private static minYearSum_ = MIN_AGE * 2;
    private static maxYearSum_ = 70 * 2 - DisplayedStrategy.minYearSum_;

    sharedIdx_: number;

    finalAge_: [MonthDuration, MonthDuration] = [null, null];
    strategy_: [MonthDuration, MonthDuration] = [null, null];
    strategySum_: Money;
    initialized_: boolean = false;

    constructor(finalAgeYears: [number, number]) {
      for (let i = 0; i < 2; i++) {
        // Assume the recipient lives the entire year of the birthdate, so
        // until December.
        this.finalAge_[i] = MonthDuration.initFromYearsMonths({
          years: finalAgeYears[i],
          months: 11 - recipients[i].birthdate.layBirthMonth(),
        });
      }
      this.sharedIdx_ = this.bufferIndex([
        this.finalAge_[0].years(),
        this.finalAge_[1].years(),
      ]);
    }

    bufferIndex(ageMonths: Array<number>): number {
      const tableWidth = MAX_AGE - MIN_AGE + 1;
      const offsetAgeMonths = [ageMonths[0] - MIN_AGE, ageMonths[1] - MIN_AGE];
      return offsetAgeMonths[0] * tableWidth + offsetAgeMonths[1];
    }

    initialize() {
      // Only run once:
      if (this.initialized_) {
        return;
      }

      this.strategy_[0] = new MonthDuration(
        sharedAgeAUint16Array[this.sharedIdx_]
      );
      this.strategy_[1] = new MonthDuration(
        sharedAgeBUint16Array[this.sharedIdx_]
      );
      this.strategySum_ = Money.fromCents(
        sharedStrategySumUint32Array[this.sharedIdx_]
      );
      this.initialized_ = true;
    }

    text(long = false): string {
      if (!this.initialized_) {
        return "";
      }
      return this.recipientText(0, long) + "\n" + this.recipientText(1, long);
    }

    /**
     * Returns the text for both recipients, separated by a newline.
     * @param idx The index of the recipient.
     * @param long If true, return the long form of the text.
     */
    strategyText(idx: number, long: boolean): string {
      const strategy = this.strategy_[idx];
      if (strategy.years() == 0) {
        return "";
      }
      if (long) {
        return (
          strategy.years().toString() +
          " years" +
          " " +
          strategy.modMonths().toString() +
          " months"
        );
      }
      return strategy.years().toString();
    }

    /**
     * Returns the text for the recipient at the given index.
     * @param idx The index of the recipient.
     * @param long If true, return the long form of the text.
     */
    recipientText(idx: number, long = false): string {
      return this.strategyText(idx, long);
    }

    color(): string {
      if (!this.initialized_) {
        return "rgb(255, 255, 255)";
      }
      const yearsSum =
        this.strategy_[0].years() +
        this.strategy_[1].years() -
        DisplayedStrategy.minYearSum_;
      const colorValue = Math.round(
        (yearsSum / DisplayedStrategy.maxYearSum_) * 200
      );
      return `rgb(0, ${255 - colorValue}, ${colorValue + 55})`;
    }

    /**
     * Returns true if the strategy for the given recipient is to file at 70.
     * @param idx
     */
    strategy70(idx: number): boolean {
      return this.strategy_[idx].years() == 70;
    }

    click() {
      selectedStrategy = this;
      strategySequence = StrategySequence({
        pias: pia,
        birthdates: [
          recipients[0].birthdate.layBirthdate(),
          recipients[1].birthdate.layBirthdate(),
        ],
        strategy: [this.strategy_[0].asMonths(), this.strategy_[1].asMonths()],
        finalAge: [this.finalAge_[0].asMonths(), this.finalAge_[1].asMonths()],
      });
    }

    strategyDateString(idx: number): string {
      const date = recipients[idx].birthdate.dateAtLayAge(this.strategy_[idx]);
      return date.monthName() + " " + date.year();
    }

    strategySum(): Money {
      return this.strategySum_;
    }
  }

  let selectedStrategy: DisplayedStrategy = null;
  let strategySequence = [];

  class ScenarioTable {
    public displayedStrategies_: DisplayedStrategy[][] = [];
    // Track the index of the last row and column that we want to display. Once
    // the strategies stop changing in that direction, we can stop displaying
    // them.
    public finalAIndex_ = 10;
    public finalBIndex_ = 10;

    constructor() {
      // Displayed Strategy table:
      this.displayedStrategies_ = [];
      for (let i = 0; i < TABLE_WIDTH; i++) {
        let row: DisplayedStrategy[] = [];
        for (let j = 0; j < TABLE_WIDTH; j++) {
          row.push(new DisplayedStrategy([i + MIN_AGE, j + MIN_AGE]));
        }
        this.displayedStrategies_.push(row);
      }
    }

    markDone() {
      for (let i = 0; i < TABLE_WIDTH; i++) {
        for (let j = 0; j < TABLE_WIDTH; j++) {
          this.displayedStrategies_[i][j].initialize();
        }
      }
      for (let i = 0; i < TABLE_WIDTH; i++) {
        for (let j = 0; j < TABLE_WIDTH; j++) {
          if (
            this.finalAIndex_ <= i &&
            !this.displayedStrategies_[i][j].strategy70(0)
          ) {
            this.finalAIndex_ = i + 1;
          }
          if (
            this.finalBIndex_ <= j &&
            !this.displayedStrategies_[i][j].strategy70(1)
          ) {
            this.finalBIndex_ = j + 1;
          }
        }
      }
      this.finalAIndex_ = Math.min(this.finalAIndex_, TABLE_WIDTH - 1);
      this.finalBIndex_ = Math.min(this.finalBIndex_, TABLE_WIDTH - 1);
    }
  }

  function SetupWorker() {
    let scenario = {
      pias: pia,
      birthdates: [
        recipients[0].birthdate.layBirthdate(),
        recipients[1].birthdate.layBirthdate(),
      ],
      ageValues: [sharedAgeAUint16Array, sharedAgeBUint16Array],
      strategySumValues: sharedStrategySumUint32Array,
    };
    worker.postMessage(scenario);
  }

  function leftborder(
    displayedStrategies: DisplayedStrategy[][],
    i: number,
    j: number
  ): boolean {
    if (j == 0) return true;
    return (
      displayedStrategies[i][j - 1].text() != displayedStrategies[i][j].text()
    );
  }

  function topborder(
    displayedStrategies: DisplayedStrategy[][],
    i: number,
    j: number
  ): boolean {
    if (i == 0) return true;
    return (
      displayedStrategies[i - 1][j].text() != displayedStrategies[i][j].text()
    );
  }

  let workerPromise: Promise<void>;
  let runId_ = 0;
  let worker: Worker = new StrategyWorker();
  let scenarioTable = new ScenarioTable();

  function startWork() {
    selectedStrategy = null;
    strategySequence = [];
    startTime = Date.now();
    initializeBuffer();
    worker.terminate();
    workerPromise = new Promise((resolve, reject) => {
      worker = new StrategyWorker();
      worker.addEventListener("message", (event) => {
        done = true;
        runId_++;
        timeElapsed = (Date.now() - startTime) / 1000;
        scenarioTable = new ScenarioTable();
        scenarioTable.markDone();
        resolve();
      });
    });
    SetupWorker();
  }

  $: {
    for (let i = 0; i < recipients.length; i++) {
      recipients[i].setPia(Money.from(pia[i]));
    }
    startWork();
  }

  onMount(() => {
    startWork();
  });
  onDestroy(() => {
    worker.terminate();
  });
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
  <p>
    For each possible pair of death ages (A, B), the optimal filing strategy is
    shown in the corresponding cell. The bottom left number is {recipients[0]
      .name}'s recommended filing age, and the top right number is <RecipientName
      r={recipients[1]}
      apos
    ></RecipientName> recommended filing age, in years.
  </p>
  <p>
    Note that this page is a work in progress. The calculation is actually
    incorrect in that it does not take into account survivor benefits. It also
    probably should allow for an accounting of the time value of money. Right
    now, I'm just playing around with the UI and some data to see if this even
    seems worth pursuing.
  </p>

  {#if selectedStrategy != null}
    {selectedStrategy.finalAge_[1].years()}
  {/if}

  {#if runId_ > 0}
    {#key runId_}
      <table class:selectedStrategy={selectedStrategy != null}>
        <!-- 2nd Recipient "survives until" text -->
        <tr>
          <td colspan="2"></td>
          <th colspan={scenarioTable.displayedStrategies_.length}
            ><RecipientName r={recipients[1]}></RecipientName> survives until age:</th
          ></tr
        >

        <tr>
          <!-- 1st Recipient "survives until" text -->
          <th
            rowspan={scenarioTable.displayedStrategies_.length + 1}
            class="nameASurviveCell"
          >
            <span
              ><RecipientName r={recipients[0]}></RecipientName> survives until age:</span
            ></th
          >

          <!-- Corner cell: "A files / B files" -->
          <td>
            <div class="cell cellAB">
              <span class="cellA1"
                ><RecipientName r={recipients[0]}></RecipientName> files</span
              >
              <span class="cellB1"
                ><RecipientName r={recipients[1]}></RecipientName> files</span
              >
              <div class="divider"></div>
            </div>
          </td>

          <!-- Survival age labels for 2nd recipient -->
          {#each { length: scenarioTable.finalBIndex_ + 1 } as _, colIndex}
            <th
              class="survivalAgeCell"
              class:clicked={selectedStrategy != null &&
                selectedStrategy.finalAge_[1].years() == colIndex + 62}
            >
              {#if colIndex == scenarioTable.finalBIndex_}
                {colIndex + 62}+
              {:else}
                {colIndex + 62}
              {/if}
            </th>
          {/each}
        </tr>

        {#each { length: scenarioTable.finalAIndex_ + 1 } as _, rowIndex}
          <tr>
            <!-- Survival age labels for 1st recipient -->
            <th
              class="survivalAgeCell"
              class:clicked={selectedStrategy != null &&
                selectedStrategy.finalAge_[0].years() == rowIndex + 62}
            >
              {#if rowIndex == scenarioTable.finalAIndex_}
                {rowIndex + 62}+
              {:else}
                {rowIndex + 62}
              {/if}</th
            >

            <!-- Grid of suggested filing dates -->
            {#each { length: scenarioTable.finalBIndex_ + 1 } as cell, colIndex}
              <td
                class="filingDateCell"
                class:leftborder={leftborder(
                  scenarioTable.displayedStrategies_,
                  rowIndex,
                  colIndex
                )}
                class:topborder={topborder(
                  scenarioTable.displayedStrategies_,
                  rowIndex,
                  colIndex
                )}
                style="background-color: {scenarioTable.displayedStrategies_[
                  rowIndex
                ][colIndex].color()}"
                on:click={() => {
                  scenarioTable.displayedStrategies_[rowIndex][
                    colIndex
                  ].click();
                }}
                class:clicked={selectedStrategy ==
                  scenarioTable.displayedStrategies_[rowIndex][colIndex]}
              >
                <div class="cell">
                  <span class="cellA"
                    >{scenarioTable.displayedStrategies_[rowIndex][
                      colIndex
                    ].recipientText(0)}</span
                  >
                  <span class="cellB"
                    >{scenarioTable.displayedStrategies_[rowIndex][
                      colIndex
                    ].recipientText(1)}</span
                  >
                  <div class="divider"></div>
                </div>
              </td>
            {/each}
          </tr>
        {/each}
      </table>
    {/key}
  {/if}
  {#if selectedStrategy != null}
    <br />

    <p>Selected Strategy:</p>
    <p>
      <RecipientName r={recipients[0]}></RecipientName> files at age {selectedStrategy.strategy_[0].years()}
      years, {selectedStrategy.strategy_[0].modMonths()} months:

      {selectedStrategy.strategyDateString(0)}
    </p>
    <p>
      <RecipientName r={recipients[1]}></RecipientName> files at age {selectedStrategy.strategy_[1].years()}
      years, {selectedStrategy.strategy_[1].modMonths()} months

      {selectedStrategy.strategyDateString(1)}
    </p>

    <p>Sum of benefits: {selectedStrategy.strategySum().wholeDollars()}</p>

    {#each strategySequence as el}
      <p>{el}</p>
    {/each}
  {/if}
</main>

<style>
  table {
    border-collapse: collapse;
    border: 1px solid black;
  }
  td.leftborder {
    border-left: 2px solid black;
  }
  td.topborder {
    border-top: 2px solid black;
  }
  .cell {
    position: relative;
    width: 32px;
    height: 32px;
  }
  .filingDateCell.clicked {
    outline: 1px solid red;
  }
  .selectedStrategy .filingDateCell:not(.clicked) {
    opacity: 0.5;
  }
  .selectedStrategy .survivalAgeCell:not(.clicked) {
    opacity: 0.5;
  }
  .nameASurviveCell {
    writing-mode: vertical-rl;
    white-space: nowrap;
    transform: scale(-1);
  }
  .cellAB {
    position: relative;
    top: -20px;
    left: -20px;
  }
  .cellB {
    position: absolute;
    top: 0;
    left: 13px;
  }
  .cellA {
    position: absolute;
    top: 13px;
    left: 0;
  }
  .cellB1 {
    position: absolute;
    top: 0;
    left: 16px;
    white-space: nowrap;
  }
  .cellA1 {
    position: absolute;
    top: 20px;
    left: 3px;
    writing-mode: vertical-rl;
    white-space: nowrap;
    transform: scale(-1);
  }
  .divider {
    position: absolute;
    top: 10px;
    left: -10px;
    border-top: 1px solid #999;
    transform: rotate(45deg);
    width: 30px;
    height: 30px;
  }
</style>
