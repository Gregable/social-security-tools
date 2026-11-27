import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import { recipientFilingDate } from '$lib/context';
import { Money } from '$lib/money';
import { MonthDuration } from '$lib/month-time';
import demo0 from '$lib/pastes/averagepaste.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import FilingDateChart from '../lib/components/FilingDateChart.svelte';

// A recipient whose filing dates are all in the past, so the shaded area
// steps up with each year's cost of living adjustment.
const recipient = new Recipient();
recipient.earningsRecords = parsePaste(demo0);
recipient.birthdate = Birthdate.FromYMD(1950, 6, 1);
recipient.name = 'Alex';
recipient.markFirst();

// A recipient whose filing dates are all in the future, so the shaded area
// is a single flat block.
const futureRecipient = new Recipient();
// Born in October: the month argument is zero indexed.
futureRecipient.birthdate = Birthdate.FromYMD(1984, 9, 15);
futureRecipient.setPia(Money.from(2135));
futureRecipient.name = 'Alex';
futureRecipient.markFirst();

const meta: Meta<FilingDateChart> = {
  component: FilingDateChart,
  title: 'Report/FilingDate/FilingDateChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: FilingDateChart,
  props: args,
});

function age(years: number, months: number = 0): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

/** The chart's left margin, where the dollar labels are drawn. */
const RESERVED_LEFT = 70;
const CHART_START = age(62).asMonths();
const CHART_SPAN = age(71).asMonths() - CHART_START;

interface ChartState {
  /** Age selected on the slider. */
  filingAge: MonthDuration;
  /** Age at the month the pointer rests on, or omitted for no hover. */
  hoverAge?: MonthDuration;
}

/**
 * Builds a play function that puts the chart into a given state, the way a
 * reader would: by moving the slider and then resting the pointer on a month.
 */
function showing(who: Recipient, state: ChartState) {
  return async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    // Let the chart mount and size its canvas before driving it.
    await new Promise((resolve) => setTimeout(resolve, 250));
    recipientFilingDate.set(who.birthdate.dateAtSsaAge(state.filingAge));
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (state.hoverAge === undefined) return;
    const canvas = canvasElement.querySelector('canvas');
    if (canvas === null) throw new Error('The chart canvas was not rendered');
    const bounds = canvas.getBoundingClientRect();
    const fraction = (state.hoverAge.asMonths() - CHART_START) / CHART_SPAN;
    canvas.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX:
          bounds.left +
          RESERVED_LEFT +
          fraction * (bounds.width - RESERVED_LEFT),
        clientY: bounds.top + bounds.height / 2,
        bubbles: true,
      })
    );
  };
}

export const Default = Template.bind({});
Default.args = {
  recipient: recipient,
};

export const HoverBeforeFiling = Template.bind({});
HoverBeforeFiling.args = { recipient: futureRecipient };
HoverBeforeFiling.play = showing(futureRecipient, {
  filingAge: age(67),
  hoverAge: age(64, 6),
});

export const HoverOnFilingMonth = Template.bind({});
HoverOnFilingMonth.args = { recipient: futureRecipient };
HoverOnFilingMonth.play = showing(futureRecipient, {
  filingAge: age(67),
  hoverAge: age(67),
});

export const HoverAfterFiling = Template.bind({});
HoverAfterFiling.args = { recipient: futureRecipient };
HoverAfterFiling.play = showing(futureRecipient, {
  filingAge: age(67),
  hoverAge: age(68, 9),
});

export const HoverJustBeforeFiling = Template.bind({});
HoverJustBeforeFiling.args = { recipient: futureRecipient };
HoverJustBeforeFiling.play = showing(futureRecipient, {
  filingAge: age(67),
  hoverAge: age(66, 10),
});

export const HoverJustAfterFiling = Template.bind({});
HoverJustAfterFiling.args = { recipient: futureRecipient };
HoverJustAfterFiling.play = showing(futureRecipient, {
  filingAge: age(67),
  hoverAge: age(67, 2),
});

export const HoverThroughBenefitAmount = Template.bind({});
HoverThroughBenefitAmount.args = { recipient: futureRecipient };
HoverThroughBenefitAmount.play = showing(futureRecipient, {
  // The hover line crosses the amount printed above the shaded area.
  filingAge: age(65, 3),
  hoverAge: age(65, 10),
});

export const FilingAt62 = Template.bind({});
FilingAt62.args = { recipient: futureRecipient };
FilingAt62.play = showing(futureRecipient, {
  filingAge: age(62, 1),
  hoverAge: age(66),
});

export const FilingAt70 = Template.bind({});
FilingAt70.args = { recipient: futureRecipient };
FilingAt70.play = showing(futureRecipient, {
  filingAge: age(70),
  hoverAge: age(70, 8),
});

export const FilingInJanuary = Template.bind({});
FilingInJanuary.args = { recipient: futureRecipient };
FilingInJanuary.play = showing(futureRecipient, {
  // Born in October, so age 66 and 3 months falls in January, on a year line.
  filingAge: age(66, 3),
});

export const PastFilingDates = Template.bind({});
PastFilingDates.args = { recipient: recipient };
PastFilingDates.play = showing(recipient, {
  filingAge: age(66),
  hoverAge: age(64),
});

export const PastFilingDatesHoverAfter = Template.bind({});
PastFilingDatesHoverAfter.args = { recipient: recipient };
PastFilingDatesHoverAfter.play = showing(recipient, {
  filingAge: age(64),
  hoverAge: age(68, 6),
});

export const Phone = Template.bind({});
Phone.args = { recipient: futureRecipient };
Phone.parameters = { viewport: { defaultViewport: 'mobile1' } };
Phone.play = showing(futureRecipient, {
  filingAge: age(67),
  hoverAge: age(64, 6),
});
