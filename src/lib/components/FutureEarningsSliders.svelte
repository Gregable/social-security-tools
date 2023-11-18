<script lang="ts">
  import "$lib/global.css";
  import { onMount } from "svelte";
  import * as constants from "$lib/constants";
  import Slider from "./Slider.svelte";
  import type { Recipient } from "$lib/recipient";
  import { Money } from "$lib/money";
  import { context } from "$lib/context";
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
      if (
        value ==
        constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR].value()
      )
        return "$" + value.toLocaleString() + "+";
      else return "$" + value.toLocaleString();
    }
    return "";
  }

  // Computes the remaining years of earnings until the normal retirement age.
  function remainingEarningYears(recipient: Recipient): number {
    if (!recipient) return 0;
    let years =
      recipient.normalRetirementDate().year() - constants.CURRENT_YEAR + 1;
    // The slider can go from 0 to 35 years.
    return Math.min(35, Math.max(0, years));
  }
  function mostRecentEarningWage(recipient: Recipient): Money {
    const numEarningsYears = recipient.earningsRecords.length;
    if (numEarningsYears == 0) return Money.from(1000);
    let earningRecord = recipient.earningsRecords[numEarningsYears - 1];
    if (
      earningRecord.year == constants.CURRENT_YEAR ||
      earningRecord.year == constants.CURRENT_YEAR - 1 ||
      earningRecord.year == constants.CURRENT_YEAR - 2
    ) {
      return earningRecord.taxedEarnings;
    }
    return Money.from(1000);
  }
  // ssa.gov by default shows a projection for someone who earns the same
  // amount every year going forward as last year up until, and inluding,
  // the year of the normal retirement age. We want the sliders to start
  // in the same place as ssa.gov, but the user can of course move them from
  // there.
  let futureEarningYears: number = remainingEarningYears(recipient);
  let futureEarningWage: number = mostRecentEarningWage(recipient)
    .roundToDollar()
    .value();

  function update(futureEarningYears: number, futureEarningWage: Money) {
    recipient.simulateFutureEarningsYears(
      futureEarningYears,
      futureEarningWage
    );
  }
  $: update(futureEarningYears, Money.from(futureEarningWage));

  // We want to track if one of the sliders is stuck to the top of the screen.
  // This is used by the Sidebar to calculate which is the top active section,
  // where we need to know if that section is hidden by the sticky sliders.
  //
  // The strategy is to have two intersection observers, one for the sliders
  // and one for the slider container. The slider observer is offset by 1px so
  // that we detect when the slider is stuck vs simply visible.
  //
  // We consider a slider to be stuck if it's partly intersecting the page top
  // and it's container is visible. We track both slider stuckness seperately
  // in the global context.
  function updateStuckness() {
    if (isStuck && isVisible) {
      if (recipient.first) {
        context.isFirstStuck = true;
      } else {
        context.isSecondStuck = true;
      }
    } else {
      if (recipient.first) {
        context.isFirstStuck = false;
      } else {
        context.isSecondStuck = false;
      }
    }
  }
  let slidersEl: HTMLDivElement;
  let isStuck: boolean = false;
  let isVisible: boolean = false;
  const stickyObserver = new IntersectionObserver(
    (entries, _) => {
      entries.forEach((entry) => {
        isStuck =
          entry.intersectionRatio < 1 &&
          entry.intersectionRatio > 0 &&
          entry.boundingClientRect.top <= 1;
        updateStuckness();
      });
    },
    {
      rootMargin: "-1px 0px 0px 0px",
      threshold: [1],
    }
  );
  const stickyContainerObserver = new IntersectionObserver(
    (entries, _) => {
      entries.forEach((entry) => {
        isVisible = entry.intersectionRatio > 0;
        updateStuckness();
      });
    },
    { threshold: [0] }
  );
  onMount(() => {
    stickyObserver.observe(slidersEl);
    let parent = slidersEl.parentElement;
    while (parent) {
      if (parent.classList.contains("stickyContainer")) {
        stickyContainerObserver.observe(parent);
        break;
      }
      parent = parent.parentElement;
    }
  });
</script>

<div class="sliders" bind:this={slidersEl}>
  <div class="grid">
    <div class="item left">
      <RecipientName r={recipient} shortenTo={15} suffix=" plans"
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
        ceiling={constants.MAXIMUM_EARNINGS[
          constants.MAX_MAXIMUM_EARNINGS_YEAR
        ].value()}
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
  @media screen and (max-width: 500px) {
    .grid {
      display: grid;
      grid-template-columns: auto;
      grid-template-rows: auto auto auto auto auto auto;
      grid-column-gap: 0px;
      grid-row-gap: 0px;
      align-items: center;
    }
    .item.left,
    .item.right {
      justify-self: center;
      white-space: nowrap;
    }
    .item.right {
      padding-bottom: 18px;
    }
    .item.left {
      padding-top: 18px;
    }
  }
  @media screen and (min-width: 501px) {
    .sliders {
      position: sticky;
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
    .item.right {
      justify-self: start;
    }
    .item.right,
    .item.left {
      padding-top: 18px;
      white-space: nowrap;
    }
  }

  .item.center {
    /* Need at least 16px of margin to avoid clipping the slider handles */
    margin: 0 20px;
    font-size: 14px;
  }
</style>
