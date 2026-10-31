import type { Meta, StoryObj } from '@storybook/svelte';
import { averageCola, colaHistory } from '$lib/cola';
import ColaHistoryChart from '../routes/guides/cola/ColaHistoryChart.svelte';

const meta: Meta<ColaHistoryChart> = {
  component: ColaHistoryChart,
  title: 'Guides/ColaHistoryChart',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;

type Story = StoryObj<ColaHistoryChart>;

/** Every adjustment in constants.ts; moves with the annual update. */
export const FullHistory: Story = {
  args: {
    history: colaHistory(),
    average: averageCola(),
  },
};

/** A short, fixed series for layout checks that never drift. */
export const RecentDecade: Story = {
  args: {
    history: colaHistory().filter((a) => a.paymentYear >= 2016),
    average: averageCola(),
  },
};
