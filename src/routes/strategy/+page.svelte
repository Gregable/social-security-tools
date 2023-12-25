<script lang="ts">
  import { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import { Birthdate } from "$lib/birthday";
  import { MonthDate, MonthDuration } from "$lib/month-time";

  import StrategyWorker from "$lib/workers/strategy?worker";
  import { onDestroy, onMount } from "svelte";

  const worker = new StrategyWorker();

  let progress = 0;

  worker.addEventListener("message", (event) => {
    if (event.data[0] == "progress") {
      progress = event.data[1];
    } else if (event.data[0] == "numStrategies") {
      numStrategies = event.data[1];
    } else if (event.data[0] == "timeElapsed") {
      timeElapsed = event.data[1];
    } else if (event.data[0] == "done") {
      bestStrategy = event.data[1];
    } else {
      console.log("unrecognized message from worker", event.data);
    }
  });

  onMount(() => {
    worker.postMessage("run");
  });
  onDestroy(() => {
    worker.terminate();
  });

  let numStrategies = 0;
  let timeElapsed = 0;
  let bestStrategy = {
    strategySum: "$0",
    ageA: 0,
    ageB: 0,
  };
</script>

<main>
  <h1>Calculating... {progress}%</h1>

  Time Elapsed: {timeElapsed}s
  <br />
  Best Strategy: {bestStrategy.strategySum}
  {bestStrategy.ageA}, {bestStrategy.ageB}
  <br />
</main>
