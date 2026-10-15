import type { Meta, StoryObj } from '@storybook/svelte';
import type { CalculationResults } from '../lib/strategy/ui/calculation-results';
import ScenarioDetailWidowed from '../routes/strategy/components/ScenarioDetailWidowed.svelte';
import {
  widowedContextFor,
  widowedResultsFor,
} from '../test/helpers/widowed-mocks';

const meta: Meta<ScenarioDetailWidowed> = {
  title: 'Strategy/ScenarioDetailWidowed',
  component: ScenarioDetailWidowed,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/** The row for the first death-age bucket at or after `age`. */
function rowAt(results: CalculationResults, age: number) {
  for (let i = 0; i < results.rows(); i++) {
    const row = results.get(i, 0);
    if (row && row.bucket1.startAge >= age) return row;
  }
  throw new Error(`no bucket at age ${age}`);
}

// Computed by the real optimizer, as of October 2026: own benefit $1,200,
// spouse's $2,600, died November 2025 without claiming.
const context = widowedContextFor({
  ownPia: 1200,
  born: [1964, 3, 15],
  spousePia: 2600,
  spouseBorn: [1961, 3, 15],
  died: [2025, 11],
});
const { results } = widowedResultsFor(context);

export const LongLife: Story = {
  args: {
    context,
    result: rowAt(results, 90),
    displayAsAges: true,
    onBack: () => {},
  },
};
LongLife.parameters = {
  docs: {
    description: {
      story:
        'A long life: the own benefit bridges the years until the survivor benefit has grown, with the common approaches compared below.',
    },
  },
};

export const ShortLife: Story = {
  args: {
    context,
    result: rowAt(results, 66),
    displayAsAges: false,
    onBack: () => {},
  },
};
ShortLife.parameters = {
  docs: {
    description: {
      story:
        'A short life: the best plan starts the survivor benefit right away, and the own benefit is not needed.',
    },
  },
};
