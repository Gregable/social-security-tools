<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import { get } from 'svelte/store';
import * as constants from '$lib/constants';
import {
  isFirstStuck,
  isSecondStuck,
  firstFutureEarningsEditable,
  secondFutureEarningsEditable,
} from '$lib/context';
import { activeIntegration } from '$lib/integrations/context';
import { Money } from '$lib/money';
import type { Recipient } from '$lib/recipient';
import RecipientName from './RecipientName.svelte';
import Slider from './Slider.svelte';

/**
 * The recipient we are adding future earning years to.
 */
export let recipient: Recipient;

function translateFutureYears(value: number, label: string): string {
  if (label === 'value') {
    if (value === 35) {
      return '35+';
    } else {
      return value.toString();
    }
  }
  return '';
}
function translateFutureEarnings(value: number, label: string): string {
  if (label === 'value') {
    if (
      value ===
      constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR].value()
    )
      return `$${value.toLocaleString()}+`;
    else return `$${value.toLocaleString()}`;
  }
  return '';
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
  if (numEarningsYears === 0) return Money.from(1000);
  let earningRecord = recipient.earningsRecords[numEarningsYears - 1];
  if (
    earningRecord.year === constants.CURRENT_YEAR ||
    earningRecord.year === constants.CURRENT_YEAR - 1 ||
    earningRecord.year === constants.CURRENT_YEAR - 2
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

// Read custom mode from the global store
$: customMode = recipient.first
  ? $firstFutureEarningsEditable
  : $secondFutureEarningsEditable;

// Get the store for this recipient to set it
$: editableStore = recipient.first
  ? firstFutureEarningsEditable
  : secondFutureEarningsEditable;

// Track if wage slider should be disabled (in custom mode)
$: wageSliderDisabled = customMode;

// State for inline revert confirmation
let showRevertWarning = false;

function toggleCustomMode() {
  if (customMode) {
    // Show inline warning instead of browser dialog
    showRevertWarning = true;
    return;
  }
  editableStore.set(true);
}

function confirmRevert() {
  showRevertWarning = false;
  editableStore.set(false);
}

function cancelRevert() {
  showRevertWarning = false;
}

function update(years: number, wage: Money) {
  recipient.simulateFutureEarningsYears(years, wage);
}

// Only trigger update for flat mode when sliders change
$: if (!customMode) {
  update(futureEarningYears, Money.from(futureEarningWage));
}

// Handle years slider changes in custom mode
function handleYearsChange(newYears: number) {
  if (customMode) {
    const records = recipient.futureEarningsRecords;
    const currentLength = records.length;
    if (newYears > currentLength) {
      // Add new years using the last year's value
      const startYear = recipient.futureEarningsStartYear();
      const lastWage =
        currentLength > 0
          ? records[currentLength - 1].taxedEarnings
          : Money.from(futureEarningWage);
      const newRecords = records.map((r) => ({
        year: r.year,
        wage: r.taxedEarnings,
      }));
      for (let i = currentLength; i < newYears; i++) {
        newRecords.push({ year: startYear + i, wage: lastWage });
      }
      recipient.setCustomFutureEarnings(newRecords);
    } else if (newYears < currentLength) {
      // Remove years from the end
      const newRecords = records.slice(0, newYears).map((r) => ({
        year: r.year,
        wage: r.taxedEarnings,
      }));
      recipient.setCustomFutureEarnings(newRecords);
    }
  }
  futureEarningYears = newYears;
}

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
let lastReportedStuck = false;

function updateStuckness() {
  const next = isStuck;

  if (next !== lastReportedStuck) {
    lastReportedStuck = next;
  }

  if (recipient.first) {
    isFirstStuck.set(next);
  } else {
    isSecondStuck.set(next);
  }
}
let slidersEl: HTMLDivElement;
let isStuck: boolean = false;

function recomputeStuck() {
  if (!slidersEl) return;
  const stickyTop = get(activeIntegration) ? 50 : 0;
  const rect = slidersEl.getBoundingClientRect();
  const next = rect.top <= stickyTop + 1 && rect.bottom >= stickyTop;

  if (next !== isStuck) {
    isStuck = next;
    updateStuckness();
  }
}

function handleScroll() {
  recomputeStuck();
}

function handleResize() {
  recomputeStuck();
}

onMount(() => {
  recomputeStuck();
  window.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', handleResize, { passive: true });
});

onDestroy(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', handleResize);
});
</script>

<div
  class="sliders"
  class:with-integration={$activeIntegration}
  bind:this={slidersEl}
>
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
        onchange={(e) => handleYearsChange(e.value)}
      />
    </div>
    <div class="item right">more years,</div>

    <div class="item left" class:disabled-label={wageSliderDisabled}>
      {#if showRevertWarning}
        <span class="revert-warning noprint">Discard custom edits?</span>
      {:else if wageSliderDisabled}
        <span class="disabled-hint">Edit years below</span>
      {:else}
        Earning approximately
      {/if}
    </div>
    <div class="item center" class:disabled-slider={wageSliderDisabled}>
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
    <div class="item right" class:disabled-label={wageSliderDisabled}>
      {#if showRevertWarning}
        <span class="revert-buttons noprint">
          <button class="revert-btn confirm" on:click={confirmRevert}>Yes</button>
          <button class="revert-btn cancel" on:click={cancelRevert}>No</button>
        </span>
      {:else}
        {#if !wageSliderDisabled}
          per year.
        {/if}
        {#if futureEarningYears > 0}
          <label class="edit-toggle noprint">
            <input
              type="checkbox"
              checked={customMode}
              on:change={toggleCustomMode}
              class="toggle-input"
            />
            <span class="toggle-switch"></span>
            <span class="toggle-text">Edit</span>
          </label>
        {/if}
      {/if}
    </div>
  </div>
  <div class="sticky-shadow"></div>
  <div class="sticky-shadow-cover"></div>
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
    .sliders.with-integration {
      top: 50px;
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
    .sliders.with-integration div.sticky-shadow {
      top: 168px;
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

  /* Disabled slider styling for custom mode */
  .disabled-slider {
    opacity: 0.4;
    pointer-events: none;
  }

  .disabled-label {
    color: #6c757d;
  }

  .disabled-hint {
    font-style: italic;
    font-size: 13px;
  }

  /* Edit toggle styling */
  .edit-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
    margin-left: 12px;
    vertical-align: middle;
  }
  .toggle-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
  .toggle-switch {
    position: relative;
    width: 32px;
    height: 18px;
    background: #d0d4d8;
    border-radius: 9px;
    transition: background 0.2s ease;
  }
  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;
  }
  .toggle-input:checked + .toggle-switch {
    background: #4a90d9;
  }
  .toggle-input:checked + .toggle-switch::after {
    transform: translateX(14px);
  }
  .toggle-input:focus + .toggle-switch {
    box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.3);
  }
  .toggle-text {
    font-size: 13px;
    color: #666;
  }
  .toggle-input:checked ~ .toggle-text {
    color: #1a4d8c;
    font-weight: 500;
  }

  /* Revert confirmation UI */
  .revert-warning {
    color: #495057;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 3px;
    animation: bgFade 0.6s ease-out;
  }
  @keyframes bgFade {
    0% {
      background-color: rgba(74, 144, 217, 0.3);
    }
    100% {
      background-color: transparent;
    }
  }
  .revert-buttons {
    display: inline-flex;
    gap: 8px;
  }
  .revert-btn {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    border: none;
  }
  .revert-btn.confirm {
    background: #4a90d9;
    color: #fff;
  }
  .revert-btn.confirm:hover {
    background: #3a7bc8;
  }
  .revert-btn.cancel {
    background: #e9ecef;
    color: #495057;
  }
  .revert-btn.cancel:hover {
    background: #dee2e6;
  }
</style>
