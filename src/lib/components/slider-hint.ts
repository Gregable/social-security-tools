/**
 * Decides when to point out a chart's slider to a reader who is exploring the
 * chart but has not touched the slider, and so may not have noticed that it
 * can be moved.
 *
 * The hint is shown when the pointer has rested on the chart for a moment. It
 * is shown once per visit to the chart: after the pointer has been away for a
 * while, the next visit shows it again. Once the slider has been used, it is
 * never shown again.
 */

/** How long the pointer rests on the chart before the hint is shown. */
export const SLIDER_HINT_DWELL_MS = 400;
/** How long the pointer is away from the chart before the hint may repeat. */
export const SLIDER_HINT_REARM_MS = 5000;

type Timer = ReturnType<typeof setTimeout>;

export class SliderHint {
  private sliderUsed_: boolean = false;
  private shown_: boolean = false;
  // Runs while the pointer rests on the chart, before the hint is shown.
  private dwellTimer_: Timer | null = null;
  // Runs while the pointer is away from the chart, before the hint may repeat.
  private rearmTimer_: Timer | null = null;

  /**
   * @param show Called each time the hint should be shown.
   */
  constructor(private readonly show_: () => void) {}

  /** The pointer is on the chart. Safe to call on every pointer move. */
  pointerOverChart(): void {
    this.cancelRearm_();
    if (this.sliderUsed_ || this.shown_ || this.dwellTimer_ !== null) return;
    this.dwellTimer_ = setTimeout(() => {
      this.dwellTimer_ = null;
      this.shown_ = true;
      this.show_();
    }, SLIDER_HINT_DWELL_MS);
  }

  /** The pointer has left the chart. */
  pointerLeftChart(): void {
    this.cancelDwell_();
    if (!this.shown_ || this.rearmTimer_ !== null) return;
    this.rearmTimer_ = setTimeout(() => {
      this.rearmTimer_ = null;
      this.shown_ = false;
    }, SLIDER_HINT_REARM_MS);
  }

  /** The reader has used the slider, so the hint is no longer needed. */
  sliderUsed(): void {
    this.sliderUsed_ = true;
    this.dispose();
  }

  /** Cancels any pending timers. Call when the chart goes away. */
  dispose(): void {
    this.cancelDwell_();
    this.cancelRearm_();
  }

  private cancelDwell_(): void {
    if (this.dwellTimer_ === null) return;
    clearTimeout(this.dwellTimer_);
    this.dwellTimer_ = null;
  }

  private cancelRearm_(): void {
    if (this.rearmTimer_ === null) return;
    clearTimeout(this.rearmTimer_);
    this.rearmTimer_ = null;
  }
}
