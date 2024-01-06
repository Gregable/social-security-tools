<script lang="ts">
  import { MonthDuration } from "$lib/month-time";
  import StrategyWorker from "$lib/workers/strategy?worker";
  import { onDestroy, onMount } from "svelte";

  const worker = new StrategyWorker();
  const maxAge = 95;
  const minAge = 62;
  const tableWidth = maxAge - minAge + 1;

  let progress = 0;
  let startTime: number;
  let timeElapsed: number = 0;

  class DisplayedStrategy {
    private strategyA_: MonthDuration;
    private strategyB_: MonthDuration;
    private static minMonthSum_ =
      MonthDuration.initFromYearsMonths({
        years: minAge,
        months: 0,
      }).asMonths() * 2;
    private static maxMonthSum_ =
      MonthDuration.initFromYearsMonths({
        years: 70,
        months: 0,
      }).asMonths() *
        2 -
      DisplayedStrategy.minMonthSum_;
    private static minYearSum_ = minAge * 2;
    private static maxYearSum_ = 70 * 2 - DisplayedStrategy.minYearSum_;

    constructor(strategyA: MonthDuration, strategyB: MonthDuration) {
      this.strategyA_ = strategyA;
      this.strategyB_ = strategyB;
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
      /*
      const monthsSum =
        this.strategyA_.asMonths() +
        this.strategyB_.asMonths() -
        DisplayedStrategy.minMonthSum_;
      const colorValue = Math.round(
        (monthsSum / DisplayedStrategy.maxMonthSum_) * 200
      );
      */
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
  for (let i = 0; i < tableWidth; i++) {
    let row: DisplayedStrategy[] = [];
    for (let j = 0; j < tableWidth; j++) {
      row.push(
        new DisplayedStrategy(new MonthDuration(0), new MonthDuration(0))
      );
    }
    strategies.push(row);
  }
  let displayedStrategies: DisplayedStrategy[][] = strategies.map((row) =>
    row.slice()
  );

  let ageA = minAge;
  let ageB = minAge;
  let scenario = {
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
    finalAgeA: ageA,
    finalAgeB: ageB,
  };

  function SendNextInput() {
    scenario.finalAgeA = ageA;
    scenario.finalAgeB = ageB;
    worker.postMessage(scenario);
  }

  // Returns the next ageA and ageB values to run the simulation on.
  // Returns [0, 0] when done.
  function IncrementAgeLoop(inAgeA: number, inAgeB: number): [number, number] {
    if (ageB == maxAge) {
      if (ageA == maxAge) {
        progress = 100;
        return [0, 0];
      }
      progress = Math.round(((ageA - minAge) / tableWidth) * 100);
      return [ageA + 1, minAge];
    } else {
      return [ageA, ageB + 1];
    }
  }

  worker.addEventListener("message", (event) => {
    const strategyA = new MonthDuration(event.data.ageA);
    const strategyB = new MonthDuration(event.data.ageB);
    strategies[ageA - minAge][ageB - minAge] = new DisplayedStrategy(
      strategyA,
      strategyB
    );

    [ageA, ageB] = IncrementAgeLoop(ageA, ageB);

    if (ageA == 0) {
      // Done, swap the arrays:
      displayedStrategies = strategies.map((row) => row.slice());
    } else {
      SendNextInput();
    }

    timeElapsed = Math.floor((Date.now() - startTime) / 100) / 10;
  });

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

  onMount(() => {
    startTime = Date.now();
    worker.postMessage(scenario);
  });
  onDestroy(() => {
    worker.terminate();
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
  <p>Calculating... {progress}%</p>
  <p>Time Elapsed: {timeElapsed}s</p>

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
            class:topborder={topborder(displayedStrategies, rowIndex, colIndex)}
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
</main>

<style>
  th,
  td {
    /*white-space: nowrap;*/
    /*padding: 0.5rem;*/
  }
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
