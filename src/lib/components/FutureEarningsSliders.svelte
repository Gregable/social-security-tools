<script lang="ts">
  import "$lib/global.css";
  import * as constants from "$lib/constants";
  import Slider from "./Slider.svelte";
  import type { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import RecipientName from "./RecipientName.svelte";

  /**
   * The recipient we are adding future earning years to.
   */
  export let recipient: Recipient;

  function translateFutureYears(value: number, label: string): string {
    if (label == "value") {
      if (value == 35) {
        return "35+";
      } else {
        return value.toString();
      }
    }
    return "";
  }
  function translateFutureEarnings(value: number, label: string): string {
    if (label == "value") {
      if (value == constants.MAXIMUM_EARNINGS[constants.CURRENT_YEAR].value())
        return "$" + value.toLocaleString() + "+";
      else return "$" + value.toLocaleString();
    }
    return "";
  }
  let futureEarningYears: number = 0;
  let futureEarningWage: number = 1000;
  function update(futureEarningYears: number, futureEarningWage: Money) {
    $recipient.simulateFutureEarningsYears(
      futureEarningYears,
      futureEarningWage
    );
  }

  $: update(futureEarningYears, Money.from(futureEarningWage));
</script>

<div class="sliders">
  <div class="grid">
    <div class="item left">
      <RecipientName r={$recipient} shortenTo={15} suffix=" plans"
        >I plan</RecipientName
      > to work for
    </div>
    <div class="item center">
      <Slider
        bind:value={futureEarningYears}
        floor={0}
        ceiling={35}
        step={1}
        translate={translateFutureYears}
      />
    </div>
    <div class="item right">more years,</div>

    <div class="item left">Earning approximately</div>
    <div class="item center">
      <Slider
        bind:value={futureEarningWage}
        floor={1000}
        ceiling={constants.MAXIMUM_EARNINGS[constants.CURRENT_YEAR].value()}
        step={1000}
        translate={translateFutureEarnings}
      />
    </div>
    <div class="item right">per year.</div>
  </div>
  <div class="sticky-shadow" />
  <div class="sticky-shadow-cover" />
</div>

<style>
  /* No need for sliders in print view */
  @media print {
    .sliders {
      display: none;
    }
  }
  @media screen {
    .sliders {
      position: sticky;
      overflow-anchor: none;
      top: 0;
      z-index: 5;
      background-color: #fff;
    }
    /**
     * Hack to create a bottom shadow on the slider when it stick's.
     * The shadow is always there, but is covered by a white
     *  sticky-shadow-cover.
     */
    div.sticky-shadow {
      height: 2px;
      background-color: #bbb;
      z-index: 3;
      position: sticky;
      top: 118px;
    }
    div.sticky-shadow-cover {
      height: 2px;
      background-color: #fff;
      z-index: 4;
      position: relative;
      top: -2px;
    }
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 250px 1fr;
    grid-template-rows: auto auto;
    grid-column-gap: 0px;
    grid-row-gap: 0px;
    align-items: center;
  }
  .item.left {
    justify-self: end;
  }
  .item.center {
    /* Need at least 16px of margin to avoid clipping the slider handles */
    margin: 0 20px;
    font-size: 14px;
  }
  .item.right {
    justify-self: start;
  }
  .item.right,
  .item.left {
    padding-top: 18px;
    white-space: nowrap;
  }
</style>