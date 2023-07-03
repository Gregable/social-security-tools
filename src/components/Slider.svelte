<script lang="ts">
  import { afterUpdate, createEventDispatcher } from "svelte";

  let sliderEl: HTMLDivElement;
  let handleEl: HTMLSpanElement;
  let handleLabelEl: HTMLSpanElement;

  export let value: number = 0;

  /**
   * Minimum value of the slider.
   */
  export let floor: number = 0;

  /**
   * Maximum value of the slider.
   */
  export let ceiling: number = 10;

  /**
   * Increment between slider values.
   */
  export let step: number = 1;

  /**
   * Color of the ticks to the left of the slider handle.
   */
  export let tickLeftColor: string = "#0db9f0";
  /**
   * Color of the ticks to the right of the slider handle.
   */
  export let tickRightColor: string = "#d8e0f3";
  /**
   * Color of the bar to the left of the slider handle.
   */
  export let barLeftColor: string = "#0db9f0";
  /**
   * Color of the bar to the right of the slider handle.
   */
  export let barRightColor: string = "#d8e0f3";
  /**
   * Color of the slider handle.
   */
  export let handleColor: string = "#0db9f0";
  /**
   * Color of the slider handle inner dot when selected.
   */
  export let handleSelectedColor: string = "#451aff";

  /**
   * Shows the ticks along the slider bar.
   * If ticksArray is unset, ticks will be shown at the step interval.
   */
  export let showTicks: boolean = false;

  /**
   * Selection of specific tick locations, labels, and legends.
   *
   * Usage:
   *   Values in the array should be either of form:
   *     {value: 1}
   *   or:
   *     {value: 1, label: "One", legend: "Foo"}
   *
   *   Label and Legend are optional. If either is missing, nothing will
   *   be shown.
   *
   * If the array is empty, ticks will be shown at the step interval.
   */
  export let ticksArray: Array<{
    value: number;
    label?: string;
    legend?: string;
  }> = [];

  /**
   * Custom translate function. Use this if you want to translate the values
   * displayed in the slider bar. `label` is a string that can take the
   * following values:
   * - `'value'`: The current value label
   * - `'ceiling'`: The high label
   * - `'floor'`: The low label
   */
  export let translate: (value: number, label: string) => string = (
    value,
    _label
  ) => value.toLocaleString();

  const dispatch = createEventDispatcher();
  $: dispatch("change", { value: value });

  // By binding to window.innerWidth, we can update the width when the
  // window is resized and update the slider position visibly.
  function getWidth(_windowWidth: number, el: HTMLDivElement): number {
    if (el != undefined) return el.getBoundingClientRect().width;
    else return 1;
  }
  let innerWidth: number = window.innerWidth;
  let width: number = 0;
  $: width = getWidth(innerWidth, sliderEl);

  // If we're dragging the slider, it's selected. However, it can also be
  // selected by tabbing to it. It also remains selected after dragging until
  // the user clicks elsewhere.
  let dragging: boolean = false;
  let selected: boolean = false;
  function onFocus(event: FocusEvent) {
    selected = true;
  }
  function onBlur(event: FocusEvent) {
    selected = false;
  }

  function onStart(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
    dragging = true;
    handleEl.focus();
    dragTo(event.clientX);
  }
  function onMove(event: PointerEvent) {
    if (dragging) {
      dragTo(event.clientX);
    }
  }
  function onEnd(event: PointerEvent) {
    dragging = false;
  }
  function onKeyDown(event: KeyboardEvent) {
    if (!selected) return;

    let val = value;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      val = Math.max(floor, val - step);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      val = Math.min(ceiling, val + step);
    } else if (event.key === "PageDown") {
      val = Math.max(floor, val - step * 5);
    } else if (event.key === "PageUp") {
      val = Math.min(ceiling, val + step * 5);
    } else if (event.key === "Home") {
      val = floor;
    } else if (event.key === "End") {
      val = ceiling;
    } else {
      return;
    }

    // Only prevent default if we actually changed the value. Otherwise, we
    // want to allow the default behavior of whatever key we didn't interpret.
    // For example, this could be <tab> which we want to allow to remove focus.
    event.preventDefault();
    event.stopPropagation();

    // Ensure that we snap to the nearest "step" increment unless we are at
    // the bounds:
    if (val > floor && val < ceiling) {
      val = Math.round(val / step) * step;
    }
    // Ensure that we don't go out of bounds.
    val = Math.max(floor, Math.min(ceiling, val));

    value = val;
  }

  /**
   * Set the value of the slider from the x coordinate of the event.
   * The value is rounded to the nearest step.
   * @param eventX The x coordinate of the event.
   */
  function dragTo(eventX: number) {
    const percent = (eventX - sliderEl.getBoundingClientRect().left) / width;
    let val = floor + percent * (ceiling - floor);
    val = Math.round(val / step) * step;
    val = Math.max(floor, Math.min(ceiling, val));
    value = val;
  }

  /**
   * Compute the pixel position of an element matching a given value,
   * considering the current width of the slider.
   * @param valueIn The logical value to move the slider to.
   * @param floorIn The minimum value of the slider.
   * @param ceilingIn The maximum value of the slider.
   * @param widthIn The width of the slider element.
   * @returns The position of the slider in pixels.
   */
  function valueToPosition(
    value: number,
    floor: number,
    ceiling: number,
    width: number
  ): number {
    const percent = (value - floor) / (ceiling - floor);
    return Math.floor(percent * width);
  }
  let sliderPosition: string = "0px";
  $: sliderPosition = valueToPosition(value, floor, ceiling, width) + "px";

  // When the label for the handle changes, it's width may change as well.
  // We need to update it's position to be centered over the handle.
  let handleLabel: string = "";
  $: handleLabel = translate(value, "value");

  /**
   * Update the position of the handle label based on the current value and
   * element width. Called in afterUpdate to ensure that the label has been
   * rendered before we try to measure it.
   */
  function updateHandleLabel(widthIn = width) {
    if (!handleLabelEl) return;
    const rect = handleLabelEl.getBoundingClientRect();
    const percent = (value - floor) / (ceiling - floor);
    handleLabelEl.style.left =
      Math.floor(percent * widthIn) - rect.width / 2 + "px";
  }
  afterUpdate(updateHandleLabel);
  $: updateHandleLabel(width);

  /**
   * Update the list of ticks based on the current input values.
   *
   * If `showTicks` is false, the list is empty. If `ticksArray` is non-empty,
   * it is used as the list of ticks. Otherwise, the list is generated from
   * `floor`, `ceiling`, and `step` with labels generated by `translate`.
   */
  function updateTicks(
    width,
    floor,
    ceil,
    step,
    showTicks,
    ticksArray: Array<{ value: number; label?: string; legend?: string }>
  ): Array<{ value: number; label?: string; legend?: string; x?: number }> {
    if (!showTicks) return [];
    let ticks: Array<{
      value: number;
      label?: string;
      legend?: string;
      x?: number;
    }> = [];
    if (ticksArray.length > 0) {
      ticks = ticksArray;
      ticks.forEach((element) => {
        element.x = valueToPosition(element.value, floor, ceiling, width);
      });
    } else {
      for (let i = floor; i <= ceil; i += step) {
        ticks.push({
          value: i,
          label: translate(i, "tick"),
          x: valueToPosition(i, floor, ceiling, width),
        });
      }
    }
    return ticks;
  }
  let ticks: Array<{
    value: number;
    label?: string;
    legend?: string;
    x?: number;
  }> = [];
  $: ticks = updateTicks(width, floor, ceiling, step, showTicks, ticksArray);
</script>

<svelte:window bind:innerWidth />
<svelte:document
  on:pointermove={onMove}
  on:pointerdown={onBlur}
  on:pointerup={onEnd}
/>

<div
  class="slider"
  bind:this={sliderEl}
  style:--tick-left-color={tickLeftColor}
  style:--tick-right-color={tickRightColor}
  style:--bar-left-color={barLeftColor}
  style:--bar-right-color={barRightColor}
  style:--slider-position={sliderPosition}
  style:--handle-color={handleColor}
  style:--handle-selected-color={handleSelectedColor}
>
  <span
    class="barWrapper"
    on:pointerdown={onStart}
    on:pointermove={onMove}
    on:pointerup={onEnd}
  >
    <span class="bar" />
  </span>
  <span
    class="barWrapper selection"
    on:pointerdown={onStart}
    on:pointermove={onMove}
    on:pointerup={onEnd}
  >
    <span class="bar selection" />
  </span>
  <span
    class="handle"
    class:selected
    tabindex="0"
    role="slider"
    aria-valuemin={floor}
    aria-valuemax={ceiling}
    aria-valuenow={value}
    aria-valuetext={translate(value, "value")}
    on:pointerdown={onStart}
    on:pointermove={onMove}
    on:pointerup={onEnd}
    on:focus={onFocus}
    on:blur={onBlur}
    on:keydown={onKeyDown}
    bind:this={handleEl}
  />
  <span class="handleLabel" bind:this={handleLabelEl}>{handleLabel}</span>
  <ul class="ticks">
    {#each ticks as tick}
      <li
        class="tick"
        class:right={tick.value > value}
        style="transform: translateX({tick.x}px)"
      >
        {#if tick.label}
          <span class="tickLabel">{tick.label}</span>
        {/if}
        {#if tick.legend}
          <span class="tickLegend">{tick.legend}</span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .slider {
    width: 100%;
    display: inline-block;
    /* Set relative so that this becomes "positioned" and the children will be
     * positioned relative to this element. */
    position: relative;
    height: 4px;
    margin: 35px 0 15px 0;
    vertical-align: middle;
    user-select: none;
    box-sizing: border-box;
  }
  span {
    position: absolute;
    display: inline-block;
  }
  .barWrapper {
    left: 0;
    z-index: 1;
    width: 100%;
    height: 32px;
    padding-top: 16px;
    margin-top: -16px;
  }
  .barWrapper.selection {
    width: var(--slider-position, 0);
  }
  .bar {
    left: 0;
    z-index: 1;
    width: 100%;
    height: 4px;
    background-color: var(--bar-right-color);
    border-radius: 2px;
  }
  .bar.selection {
    z-index: 2;
    background-color: var(--bar-left-color);
    border-radius: 2px;
  }
  .handle {
    cursor: pointer;
    width: 32px;
    height: 32px;
    top: -14px; /* 32px (height) - 4px (bar height) / 2 */
    z-index: 3;
    background-color: var(--handle-color);
    border-radius: 16px;
    left: calc(var(--slider-position, 16px) - 16px);
  }
  .handle::after {
    /* Forms the inner dot on the handle */
    content: "";
    width: 8px;
    height: 8px;
    position: absolute;
    /* 32px (height) / 2 - 8px (handle inner height) / 2 */
    top: 12px;
    left: 12px;
    background-color: #fff;
    border-radius: 4px;
  }
  .handle.selected::after {
    background-color: var(--handle-selected-color);
  }
  .handle:hover::after {
    background-color: var(--handle-selected-color);
  }
  .handleLabel {
    bottom: 16px;
    padding: 3px 3px;
    cursor: default;
    background-color: #fff;
    z-index: 2;
  }
  ul.ticks {
    position: absolute;
    list-style: none;
    margin: 0;
    left: 0;
    /* (10px (tick height) - 4px (bar height)) / 2 */
    top: -3px;
    z-index: 1;
    width: 100%;
    height: 0;
  }
  li.tick {
    background-color: var(--tick-left-color, #000);
    position: absolute;
    width: 10px;
    height: 10px;
    top: 0;
    /* Half of the width of the tick */
    left: -5px;
    /* 32px (handle height) / 2 - 10px (tick width) / 2 */
    /* margin-left: 11px; */
    text-align: center;
    cursor: pointer;
    border-radius: 50%;
  }
  li.tick.right {
    background-color: var(--tick-right-color, #000);
  }
  .tickLabel {
    top: -28px;
    position: absolute;
    transform: translate(-50%, 0);
    white-space: nowrap;
  }
  .tickLegend {
    top: 24px;
    position: absolute;
    transform: translate(-50%, 0);
    white-space: nowrap;
  }
</style>
