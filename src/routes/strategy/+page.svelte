<script lang="ts">
  import { MonthDuration } from "$lib/month-time";
  import StrategyWorker from "$lib/workers/strategy?worker";
  import { onDestroy, onMount } from "svelte";

  const workers = [];
  const maxAge = 110;
  const minAge = 62;
  const maxWorkers = 4;

  let startTime: number;
  let timeElapsed: number = 0;
  let done = false;

  class DisplayedStrategy {
    private strategyA_: MonthDuration;
    private strategyB_: MonthDuration;

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

  class ScenarioTable {
    public static maxAge = 110;
    public static minAge = 62;

    private strategies_: DisplayedStrategy[][];
    public displayedStrategies_: DisplayedStrategy[][] = [];

    constructor() {
      const tableWidth_ = maxAge - minAge + 1;
      this.strategies_ = [];
      for (let i = 0; i < tableWidth_; i++) {
        let row: DisplayedStrategy[] = [];
        for (let j = 0; j < tableWidth_; j++) {
          row.push(
            new DisplayedStrategy(new MonthDuration(0), new MonthDuration(0))
          );
        }
        this.strategies_.push(row);
      }
      this.displayedStrategies_ = this.strategies_.map((row) => row.slice());
    }

    private nextX_: number = 0;
    private nextY_: number = 0;
    private scenariosDone_: boolean = false;

    IncrementNextScenario(): boolean {
      // The idea here is to always increment once, because even if the current
      // cell isn't done, it has already been sent for processing. We may
      // increment more than once if the cell we are incrementing to is done
      // already.
      //
      // Increments move over the table diagonally rather than by row or column.
      // This reduces the amount of calculations when we have high parallelism
      // by skipping over the ends of each row and column when we reach an age
      // 70 strategy, avoiding calls that we know will be skipped.
      const maxIdx = this.strategies_.length - 1;
      if (this.nextX_ == maxIdx && this.nextY_ == maxIdx) {
        // Done, we've reached the end of the table:
        // 0 0 0
        // 0 0 0
        // 0 0 *
        this.scenariosDone_ = true;
        return false;
      } else {
        if (this.nextX_ == maxIdx) {
          // Increment to the next row, then reflect across the diagonal:
          // 0 0 *      0 0 0
          // 0 0 0  ->  0 0 0
          // 0 0 0      0 * 0
          //       -or-
          // 0 0 0      0 0 0
          // 0 0 *  ->  0 0 0
          // 0 0 0      0 0 *
          this.nextX_ = this.nextY_ + 1;
          this.nextY_ = maxIdx;
        } else if (this.nextY_ == 0) {
          // Increment to the next column, then reflect across the diagonal:
          // * 0 0      0 0 0
          // 0 0 0  ->  * 0 0
          // 0 0 0      0 0 0
          //       -or-
          // 0 * 0      0 0 0
          // 0 0 0  ->  0 0 0
          // 0 0 0      * 0 0
          this.nextY_ = this.nextX_ + 1;
          this.nextX_ = 0;
        } else {
          // Move along the diagonal:
          // 0 0 0      0 0 *
          // 0 * 0  ->  0 0 0
          // 0 0 0      0 0 0
          this.nextX_ += 1;
          this.nextY_ -= 1;
        }
        if (!this.strategies_[this.nextX_][this.nextY_].done()) {
          return true;
        } else {
          return this.IncrementNextScenario();
        }
      }
    }

    done(): boolean {
      return this.scenariosDone_;
    }

    NextScenario(): [number, number] {
      console.assert(!this.done());
      return [this.nextX_ + minAge, this.nextY_ + minAge];
    }

    RecordStrategy(
      ageA: number,
      ageB: number,
      strategyA: MonthDuration,
      strategyB: MonthDuration
    ) {
      this.strategies_[ageA - minAge][ageB - minAge] = new DisplayedStrategy(
        strategyA,
        strategyB
      );
    }

    SwapStrategies() {
      this.displayedStrategies_ = this.strategies_.map((row) => row.slice());
    }
  }

  let scenarioTable = new ScenarioTable();

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

  function SetupWorker(workerIdx: number = 0) {
    workers[workerIdx].addEventListener("message", WorkerEventListener);
    scenario.workerIdx = workerIdx;
    workers[workerIdx].postMessage(scenario);
  }

  function SendNextInput(workerIdx: number = 0) {
    if (scenarioTable.done()) {
      workers[workerIdx].terminate();
      numWorkers--;
      if (numWorkers == 0) {
        timeElapsed = Math.floor((Date.now() - startTime) / 100) / 10;
        scenarioTable.SwapStrategies();
        done = true;
      }
    } else {
      let [ageA, ageB] = scenarioTable.NextScenario();
      workers[workerIdx].postMessage({
        finalAgeA: ageA,
        finalAgeB: ageB,
        command: "run",
      });
      scenarioTable.IncrementNextScenario();
    }
  }

  function WorkerEventListener(event: MessageEvent) {
    const strategyA = new MonthDuration(event.data.strategyA);
    const strategyB = new MonthDuration(event.data.strategyB);

    scenarioTable.RecordStrategy(
      event.data.finalAgeA,
      event.data.finalAgeB,
      strategyA,
      strategyB
    );

    // If we have a strategy that starts person A at age 70, we can fill in the
    // rest of that row since we can never strart later than 70.
    if (event.data.strategyA == 70 * 12) {
      for (let i = event.data.finalAgeA; i < ScenarioTable.maxAge; i++) {
        scenarioTable.RecordStrategy(
          i,
          event.data.finalAgeB,
          strategyA,
          strategyB
        );
      }
    }
    // Same for person B. However, in addition if person B has zero PIA,
    // there is no reason to start later than 67.
    if (
      event.data.strategyB == 70 * 12 ||
      (scenario.piaB == 0 && event.data.strategyB == 67 * 12)
    ) {
      for (let i = event.data.finalAgeB; i < ScenarioTable.maxAge; i++) {
        scenarioTable.RecordStrategy(
          event.data.finalAgeA,
          i,
          strategyA,
          strategyB
        );
      }
    }

    SendNextInput(event.data.workerIdx);
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
    // Parrallelize the calculation by using a worker for each available core.
    numWorkers = Math.max(maxWorkers, window.navigator.hardwareConcurrency);

    for (let i = 0; i < numWorkers; i++) {
      workers.push(new StrategyWorker());
      SetupWorker(i);
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
    Calculating... ({numWorkers} threads working)
  </p>

  {#if done}
    <p>Time Elapsed: {timeElapsed}s</p>

    <br />

    <table>
      <tr>
        <td colspan="2"></td>
        <th colspan={scenarioTable.displayedStrategies_.length}
          >Person B Death Age:</th
        ></tr
      >
      <tr>
        <th
          rowspan={scenarioTable.displayedStrategies_.length + 1}
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
        {#each scenarioTable.displayedStrategies_[0] as header, colIndex}
          <th>{colIndex + 62}</th>
        {/each}
      </tr>

      {#each scenarioTable.displayedStrategies_ as row, rowIndex}
        <tr>
          <th>{rowIndex + 62}</th>
          {#each row as cell, colIndex}
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
