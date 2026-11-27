<!--
  @component
  @name FilingDateHoverText
  @description
    The sentence under the filing date chart that describes the hovered month:
    what the benefit is in that month, given the filing date selected on the
    slider. The wording depends on whether the hovered month is before, on, or
    after the filing date, so that a month with no benefit explains itself
    rather than reading as $0.

    The colors come from the `--filing-date-text-color` and
    `--selected-date-text-color` custom properties of an enclosing element.
-->

<script lang="ts">
import { benefitOnDateNominal } from '$lib/benefit-calculator';
import type { MonthDate } from '$lib/month-time';
import { Recipient } from '$lib/recipient';
import { hoverPhase } from './filing-date-chart-labels';
import RecipientName from './RecipientName.svelte';

export let recipient: Recipient = new Recipient();

/** The filing date selected on the slider. */
export let filingDate: MonthDate;

/** The filing date as displayed, for example "Oct 2051". */
export let filingDateText: string;

/** The month the reader is hovering over. */
export let hoverDate: MonthDate;

$: phase = hoverPhase(filingDate, hoverDate);
$: benefit = benefitOnDateNominal($recipient, filingDate, hoverDate);
</script>

If filing for benefits in <span class="filingDate">{filingDateText}</span>,
<br />
{#if phase === 'before-filing'}
  In
  <span class="selectedDate">{hoverDate.monthName()} {hoverDate.year()}</span>,
  <RecipientName r={recipient} apos noColor={true} shortenTo={30}
    >your</RecipientName
  > benefit has not started yet.
{:else if phase === 'filing-month'}
  <RecipientName r={recipient} apos noColor={true} shortenTo={30}
    >your</RecipientName
  > benefit starts that month at
  <b>{benefit.wholeDollars()}</b>.
{:else}
  In
  <span class="selectedDate">{hoverDate.monthName()} {hoverDate.year()}</span>,
  <RecipientName r={recipient} apos noColor={true} shortenTo={30}
    >your</RecipientName
  > benefit will be:
  <b>{benefit.wholeDollars()}</b>
{/if}

<style>
  .filingDate {
    color: var(--filing-date-text-color);
    font-weight: bold;
  }
  .selectedDate {
    color: var(--selected-date-text-color);
    font-weight: bold;
  }
</style>
