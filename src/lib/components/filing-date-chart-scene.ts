import type { ChartLayout } from '$lib/components/chart-utils';
import type { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import {
  placeFilingDateLabel,
  renderFilingDateLabel,
  renderFilingDateLine,
  selectedDateLabelText,
} from './filing-date-chart-annotations';
import {
  benefitBoxes,
  renderBenefitLabels,
  renderFilingDateBenefitBoxes,
  renderHorizontalLines,
  renderSelectedDateVerticalLine,
  renderTrendline,
  renderYearVerticalLines,
} from './filing-date-chart-renderer';

/** Everything that decides what the filing date chart shows. */
export interface FilingDateChartScene {
  recipient: Recipient;
  /** The filing date selected on the slider. */
  filingDate: MonthDate;
  /** The month the reader is hovering over, or null if there is none. */
  hoverDate: MonthDate | null;
  /** The youngest age, in months, at which this recipient can file. */
  userFloor: number;
  layout: ChartLayout;
}

/**
 * Draws the whole filing date chart onto a cleared canvas.
 *
 * The order of the steps decides what covers what where things cross. The
 * filing date line is drawn in two parts: the year labels sit on top of the
 * part under the slider, and the part inside the chart sits on top of the
 * benefit labels, which would otherwise cut it short. The benefit labels in
 * turn sit on top of the hover line, so their text stays readable.
 */
export function renderFilingDateChart(
  ctx: CanvasRenderingContext2D,
  scene: FilingDateChartScene
): void {
  const { recipient, filingDate, hoverDate, userFloor, layout } = scene;

  const filingLabel = placeFilingDateLabel(
    ctx,
    recipient,
    filingDate,
    hoverDate,
    layout
  );

  renderFilingDateLine(ctx, recipient, filingDate, 'below-slider', layout);
  renderYearVerticalLines(
    ctx,
    recipient,
    layout,
    filingLabel?.label.bounds ?? null
  );
  renderHorizontalLines(ctx, recipient, layout);
  const boxes = benefitBoxes(recipient, filingDate, layout);
  renderFilingDateBenefitBoxes(ctx, boxes, recipient, layout);
  renderTrendline(ctx, recipient, userFloor, layout);

  if (hoverDate !== null) {
    renderSelectedDateVerticalLine(
      ctx,
      hoverDate,
      recipient,
      layout,
      selectedDateLabelText(ctx, recipient, filingDate, hoverDate, layout)
    );
  }

  renderBenefitLabels(ctx, boxes, recipient, layout);
  renderFilingDateLine(ctx, recipient, filingDate, 'inside-chart', layout);
  if (filingLabel !== null) {
    renderFilingDateLabel(ctx, recipient, filingLabel);
  }
}
