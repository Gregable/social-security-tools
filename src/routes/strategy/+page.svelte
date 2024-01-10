<script lang="ts">
  import { MonthDuration } from "$lib/month-time";
  import StrategyWorker from "$lib/workers/strategy?worker";
  import { onDestroy, onMount } from "svelte";

  const workers = [];
  const maxAge = 110;
  const minAge = 62;
  const tableWidth = maxAge - minAge + 1;
  const maxWorkers = 4;

  let progress = 0;
  let startTime: number;
  let timeElapsed: number = 0;
  let done = false;

  class DisplayedStrategy {
    private strategyA_: MonthDuration;
    private strategyB_: MonthDuration;
    private static minMonthSum_ =
      MonthDuration.initFromYearsMonths({
        years: minAge,
        months: 0,
      }).asMonths() * 2;

    private static minYearSum_ = minAge * 2;
    private static maxYearSum_ = 70 * 2 - DisplayedStrategy.minYearSum_;

    constructor(strategyA: MonthDuration, strategyB: MonthDuration) {
      this.strategyA_ = strategyA;
      this.strategyB_ = strategyB;
    }

    done(): boolean {
      return this.strategyA_.years() != 0 || this.strategyB_.years() != 0;
    }

    text(): string {
      if (this.strategyA_.years() == 0 && this.strategyB_.years() == 0) {
        return "";
      }
      return this.strategyA_.years() + "\n" + this.strategyB_.years();
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
  }

  let strategies: DisplayedStrategy[][] = [];
  let displayedStrategies: DisplayedStrategy[][] = [];

  let ageA = minAge;
  let ageB = minAge;
  let scenario = {
    workerIdx: -1,
    piaA: 1000,
    piaB: 300,
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
  };

  function SendSetup(workerIdx: number = 0) {
    scenario.workerIdx = workerIdx;
    workers[workerIdx].postMessage(scenario);
  }

  let skipped = 0;
  let called = 0;
  function SendNextInput(workerIdx: number = 0): boolean {
    if (ageB > maxAge) {
      return false;
    }
    while (strategies[ageA - minAge][ageB - minAge].done()) {
      skipped += 1;
      [ageA, ageB] = IncrementAgeLoop(ageA, ageB);
      if (ageA == 0) {
        return false;
      }
    }
    called += 1;

    workers[workerIdx].postMessage({
      finalAgeA: ageA,
      finalAgeB: ageB,
      command: "run",
    });
    [ageA, ageB] = IncrementAgeLoop(ageA, ageB);
    return true;
  }

  // Returns the next ageA and ageB values to run the simulation on.
  // Returns [0, 0] when done.
  function IncrementAgeLoop(inAgeA: number, inAgeB: number): [number, number] {
    // This increments over the ages diagonally, rather than by row or column.
    // This reduces the amount of calculations when we have high parallelism
    // by skipping over the ends of each row and column when we reach an age 70
    // strategy, avoiding calls that we know will be skipped.
    if (ageB == maxAge) {
      return [maxAge, ageA + 1];
    } else if (ageA == minAge) {
      return [ageB + 1, minAge];
    } else {
      return [ageA - 1, ageB + 1];
    }
  }

  function WorkerEventListener(event: MessageEvent) {
    const strategyA = new MonthDuration(event.data.strategyA);
    const strategyB = new MonthDuration(event.data.strategyB);
    const displayStrategy = new DisplayedStrategy(strategyA, strategyB);
    strategies[event.data.finalAgeA - minAge][event.data.finalAgeB - minAge] =
      displayStrategy;

    if (event.data.strategyA == 70 * 12) {
      for (let i = event.data.finalAgeA - minAge; i < tableWidth; i++) {
        strategies[i][event.data.finalAgeB - minAge] = displayStrategy;
      }
    }
    if (
      event.data.strategyB == 70 * 12 ||
      (scenario.piaB == 0 && event.data.strategyB == 67 * 12)
    ) {
      for (let i = event.data.finalAgeB - minAge; i < tableWidth; i++) {
        strategies[event.data.finalAgeA - minAge][i] = displayStrategy;
      }
    }

    if (!SendNextInput(event.data.workerIdx)) {
      numWorkers -= 1;
      workers[event.data.workerIdx].terminate();
      if (numWorkers == 0) {
        timeElapsed = Math.floor((Date.now() - startTime) / 100) / 10;
        // Done, swap the arrays:
        displayedStrategies = strategies.map((row) => row.slice());
        done = true;
      }
    }
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

  let numWorkers = 0;
  onMount(() => {
    startTime = Date.now();

    for (let i = 0; i < tableWidth; i++) {
      let row: DisplayedStrategy[] = [];
      for (let j = 0; j < tableWidth; j++) {
        row.push(
          new DisplayedStrategy(new MonthDuration(0), new MonthDuration(0))
        );
      }
      strategies.push(row);
    }
    displayedStrategies = strategies.map((row) => row.slice());

    // Parrallelize the calculation by using a worker for each available core.

    numWorkers = Math.max(maxWorkers, window.navigator.hardwareConcurrency);

    for (let i = 0; i < numWorkers; i++) {
      workers.push(new StrategyWorker());
      workers[i].addEventListener("message", WorkerEventListener);
      SendSetup(i);
    }
    for (let i = 0; i < numWorkers; i++) {
      SendNextInput(i);
    }
  });
  onDestroy(() => {
    for (let i = 0; i < numWorkers; i++) {
      workers[i].terminate();
    }
  });
</script>

<main>
  <p>
    This page shows the optimal Social Security claiming strategy for a couple
    with the following characteristics:
  </p>
  <ul>
    <li>Person A: PIA = $1,000, born April 15, 1960</li>
    <li>Person B: PIA = $300, born April 15, 1960</li>
  </ul>
  <p>
    For each possible pair of death ages (A, B), the optimal filing strategy is
    shown in the corresponding cell. The bottom left number is person A's
    recommended filing age, and the top right number is person B's recommended
    filing age, in years.
  </p>
  <p>
    Note that this page is a work in progress. The calculation is actually
    incorrect in that it does not take into account survivor benefits. It also
    probably should allow for an accounting of the time value of money. Right
    now, I'm just playing around with the UI and some data to see if this even
    seems worth pursuing.
  </p>
  <p>
    Calculating... {progress}% ({numWorkers} threads)
  </p>

  {#if done}
    <p>Time Elapsed: {timeElapsed}s</p>
    <p>Skipped: {skipped}</p>
    <p>Called: {called}</p>

    <br />

    <table>
      <tr>
        <td colspan="2"></td>
        <th colspan={tableWidth}>Person B Death Age:</th></tr
      >
      <tr>
        <th
          rowspan={tableWidth + 1}
          style="writing-mode: vertical-rl; white-space:nowrap; transform:scale(-1) "
        >
          <span>Person A Death Age:</span></th
        >
        <td>
          <div class="cell">
            <span class="cellA1">A</span>
            <span class="cellB1">B</span>
            <div class="divider"></div>
          </div>
        </td>
        {#each displayedStrategies[0] as header, colIndex}
          <th>{colIndex + 62}</th>
        {/each}
      </tr>

      {#each displayedStrategies as row, rowIndex}
        <tr>
          <th>{rowIndex + 62}</th>
          {#each row as cell, colIndex}
            <td
              class:leftborder={leftborder(
                displayedStrategies,
                rowIndex,
                colIndex
              )}
              class:topborder={topborder(
                displayedStrategies,
                rowIndex,
                colIndex
              )}
              style="background-color: {displayedStrategies[rowIndex][
                colIndex
              ].color()}"
            >
              <div class="cell">
                <span class="cellA"
                  >{displayedStrategies[rowIndex][colIndex].textA()}</span
                >
                <span class="cellB"
                  >{displayedStrategies[rowIndex][colIndex].textB()}</span
                >
                <div class="divider"></div>
              </div>
            </td>
          {/each}
        </tr>
      {/each}
    </table>
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
  }
  .cellA1 {
    position: absolute;
    top: 13px;
    left: 3px;
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
