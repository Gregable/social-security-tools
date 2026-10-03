<!--
  @component
  @name FiledMonthInput
  @description
    The couple form's "already receives benefits" control for one recipient:
    a checkbox that reveals a month select and a year input for the month
    benefits started. Publishes a validated MonthDate (or null) through
    `bind:value`, and reports through `onvaliditychange` whether the answer
    is complete, so the parent can hold Continue while the box is ticked
    with no valid month. The parent renders this only for someone old enough
    to have filed.
-->

<script lang="ts">
  import type { Birthdate } from "$lib/birthday";
  import InfoTip from "$lib/components/InfoTip.svelte";
  import RecipientName from "$lib/components/RecipientName.svelte";
  import type { MonthDate } from "$lib/month-time";
  import type { Recipient } from "$lib/recipient";
  import {
    earliestFilingDate,
    validateFiledMonth,
  } from "$lib/strategy/calculations/already-filed";
  import ReceivingSinceInput from "./ReceivingSinceInput.svelte";

  /** Whose benefits these are; names the checkbox label. */
  export let recipient: Recipient;
  /** Non-null: the parent only renders this control for an eligible person. */
  export let birthdate: Birthdate;
  /** The month the form is being filled in; a filed month cannot be later. */
  export let currentDate: MonthDate;
  /** Prefix for the element ids, so two instances on a page stay distinct. */
  export let inputId: string;
  /** Bounds for the year field; shared with the birthdate field's check. */
  export let yearRange: { min: number; max: number };
  /** The validated filed month, or null when unticked, incomplete, or invalid. */
  export let value: MonthDate | null = null;
  /** Fires on any change, so the parent can refresh derived state. */
  export let onchange: (() => void) | undefined = undefined;
  /** False while the box is ticked but no valid month has been entered. */
  export let onvaliditychange: ((isValid: boolean) => void) | undefined =
    undefined;

  // The birthdate can change while this stays mounted (an edit that keeps the
  // person eligible). A filed month the new birthdate rules out must not
  // reach the optimizer, so the month inputs re-validate when this changes.
  $: birthdateKey = `${birthdate.layBirthYear()}-${birthdate.layBirthMonth()}-${birthdate.layBirthDayOfMonth()}`;
</script>

<ReceivingSinceInput
  {inputId}
  {yearRange}
  yearMin={earliestFilingDate(birthdate).year()}
  yearMax={currentDate.year()}
  bind:value
  validate={(month) => validateFiledMonth(birthdate, month, currentDate)}
  revalidateKey={birthdateKey}
  {onchange}
  {onvaliditychange}
>
  <RecipientName r={recipient} /> already receives benefits
  <InfoTip label="Why we ask">
    If benefits have already started, that filing date is fixed. We will show
    it as a fact and optimize only the other person's filing date.
  </InfoTip>
</ReceivingSinceInput>
