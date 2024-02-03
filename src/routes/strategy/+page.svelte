<script lang="ts">
  import { MonthDuration } from "$lib/month-time";
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import StrategyWorker from "$lib/workers/strategy?worker";
  import { onDestroy, onMount } from "svelte";
  import { run } from "svelte/internal";

  const MAX_AGE = 110;
  const MIN_AGE = 62;
  const TABLE_WIDTH = MAX_AGE - MIN_AGE + 1;

  let startTime: number;
  let timeElapsed: number = 0;
  let done = false;

  let recipientA = new Recipient();
  let recipientB = new Recipient();
  recipientA.markFirst();
  recipientB.markSecond();

  let nameA = "Alex";
  let nameB = "Chris";
  let piaA = 1000;
  let piaB = 1000;

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

    finalAgeA_: MonthDuration;
    finalAgeB_: MonthDuration;
    sharedIdx_: number;

    strategyA_: MonthDuration;
    strategyB_: MonthDuration;
    initialized_: boolean = false;

    constructor(finalAgeA: MonthDuration, finalAgeB: MonthDuration) {
      this.finalAgeA_ = finalAgeA;
      this.finalAgeB_ = finalAgeB;
      this.sharedIdx_ = this.bufferIndex(finalAgeA.years(), finalAgeB.years());
    }

    bufferIndex(ageAMonths: number, ageBMonths: number): number {
      const TABLE_WIDTH = MAX_AGE - MIN_AGE + 1;
      const offsetAgeAMonths = ageAMonths - MIN_AGE;
      const offsetAgeBMonths = ageBMonths - MIN_AGE;

      return offsetAgeAMonths * TABLE_WIDTH + offsetAgeBMonths;
    }

    initialize() {
      // Only run once:
      if (this.initialized_) {
        return;
      }
      const monthsA = sharedAgeAUint16Array[this.sharedIdx_];
      const monthsB = sharedAgeBUint16Array[this.sharedIdx_];
      this.strategyA_ = new MonthDuration(monthsA);
      this.strategyB_ = new MonthDuration(monthsB);
      this.initialized_ = true;
    }

    text(): string {
      if (this.strategyA_.years() == 0 && this.strategyB_.years() == 0) {
        return "";
      }
      return this.textA() + "\n" + this.textB();
    }

    textA(): string {
      if (this.strategyA_.years() == 0) {
        return "";
      }
      return this.strategyA_.years().toString();
    }

    textB(): string {
      if (this.strategyB_.years() == 0) {
        return "";
      }
      return this.strategyB_.years().toString();
    }

    color(): string {
      if (this.strategyA_.years() == 0 && this.strategyB_.years() == 0) {
        return "rgb(255, 255, 255)";
      }
      const yearsSum =
        this.strategyA_.years() +
        this.strategyB_.years() -
        DisplayedStrategy.minYearSum_;
      const colorValue = Math.round(
        (yearsSum / DisplayedStrategy.maxYearSum_) * 200
      );
      return `rgb(0, ${255 - colorValue}, ${colorValue + 55})`;
    }

    strategyA70(): boolean {
      return this.strategyA_.years() == 70;
    }

    strategyB70(): boolean {
      return this.strategyB_.years() == 70;
    }
  }

  class ScenarioTable {
    public displayedStrategies_: DisplayedStrategy[][] = [];
    public finalAIndex_ = 10;
    public finalBIndex_ = 10;

    constructor() {
      // Displayed Strategy table:
      this.displayedStrategies_ = [];
      for (let i = 0; i < TABLE_WIDTH; i++) {
        let row: DisplayedStrategy[] = [];
        for (let j = 0; j < TABLE_WIDTH; j++) {
          row.push(
            new DisplayedStrategy(
              MonthDuration.initFromYearsMonths({
                years: i + MIN_AGE,
                months: 0,
              }),
              MonthDuration.initFromYearsMonths({
                years: j + MIN_AGE,
                months: 0,
              })
            )
          );
        }
        this.displayedStrategies_.push(row);
      }
    }

    markDone() {
      for (let i = 0; i < TABLE_WIDTH; i++) {
        for (let j = 0; j < TABLE_WIDTH; j++) {
          this.displayedStrategies_[i][j].initialize();

          if (
            this.finalAIndex_ <= i &&
            !this.displayedStrategies_[i][j].strategyA70()
          ) {
            this.finalAIndex_ = i + 1;
          }
          if (
            this.finalBIndex_ <= j &&
            !this.displayedStrategies_[i][j].strategyB70()
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
      piaA: piaA,
      piaB: piaB,
      birthdateA: {
        year: 1960,
        month: 4,
        day: 15,
      },
      birthdateB: {
        year: 1960,
        month: 4,
        day: 15,
      },
      command: "setup",
      ageAValues: sharedAgeAUint16Array,
      ageBValues: sharedAgeBUint16Array,
      strategySumValues: sharedStrategySumUint32Array,
    };
    //worker.addEventListener("message", WorkerEventListener);
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
    recipientA.name = nameA;
    recipientB.name = nameB;
    recipientA.setPia(Money.from(piaA));
    recipientB.setPia(Money.from(piaB));
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
  Name: <input type="text" bind:value={nameA} />
  <br />
  <RecipientName r={recipientA}></RecipientName> PIA:
  <input type="number" bind:value={piaA} />
  <br />
  Name: <input type="text" bind:value={nameB} />
  <br />
  <RecipientName r={recipientB}></RecipientName> PIA:
  <input type="number" bind:value={piaB} />
  <p>
    This page shows the optimal Social Security claiming strategy for a couple
    with the following characteristics:
  </p>
  <ul>
    <li>
      <RecipientName r={recipientA}></RecipientName> PIA = {recipientA
        .pia()
        .primaryInsuranceAmount()
        .string()}, born April 15, 1960
    </li>
    <li>
      <RecipientName r={recipientB}></RecipientName>: PIA = {recipientB
        .pia()
        .primaryInsuranceAmount()
        .string()}, born April 15, 1960
    </li>
  </ul>
  <p>
    For each possible pair of death ages (A, B), the optimal filing strategy is
    shown in the corresponding cell. The bottom left number is {nameA}'s
    recommended filing age, and the top right number is <RecipientName
      r={recipientB}
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

  {#if runId_ > 0}
    <p>Time Elapsed: {timeElapsed}s</p>
    {runId_}

    <br />

    {#key runId_}
      <table>
        <tr>
          <td colspan="2"></td>
          <th colspan={scenarioTable.displayedStrategies_.length}
            ><RecipientName r={recipientB}></RecipientName> survives until age:</th
          ></tr
        >
        <tr>
          <th
            rowspan={scenarioTable.displayedStrategies_.length + 1}
            class="nameASurviveCell"
          >
            <span
              ><RecipientName r={recipientA}></RecipientName> survives until age:</span
            ></th
          >
          <td>
            <div class="cell cellAB">
              <span class="cellA1"
                ><RecipientName r={recipientA}></RecipientName> files</span
              >
              <span class="cellB1"
                ><RecipientName r={recipientB}></RecipientName> files</span
              >
              <div class="divider"></div>
            </div>
          </td>
          {#each { length: scenarioTable.finalBIndex_ + 1 } as _, colIndex}
            {#if colIndex == scenarioTable.finalBIndex_}
              <th>{colIndex + 62}+</th>
            {:else}
              <th>{colIndex + 62}</th>
            {/if}
          {/each}
        </tr>

        {#each { length: scenarioTable.finalAIndex_ + 1 } as _, rowIndex}
          <tr>
            {#if rowIndex == scenarioTable.finalAIndex_}
              <th>{rowIndex + 62}+</th>
            {:else}
              <th>{rowIndex + 62}</th>
            {/if}
            {#each { length: scenarioTable.finalBIndex_ + 1 } as cell, colIndex}
              <td
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
              >
                <div class="cell">
                  <span class="cellA"
                    >{scenarioTable.displayedStrategies_[rowIndex][
                      colIndex
                    ].textA()}</span
                  >
                  <span class="cellB"
                    >{scenarioTable.displayedStrategies_[rowIndex][
                      colIndex
                    ].textB()}</span
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
    width: 30px;
    height: 30px;
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
