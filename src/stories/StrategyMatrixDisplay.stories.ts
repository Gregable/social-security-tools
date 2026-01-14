import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/svelte';
import StrategyMatrixDisplay from '../routes/strategy/components/StrategyMatrixDisplay.svelte';
import {
  createCoupleCalculationResults,
  createDeathProbDistribution,
  createRecipientPair,
} from '../test/helpers/strategy-mocks';

const meta: Meta<StrategyMatrixDisplay> = {
  title: 'Strategy/StrategyMatrixDisplay',
  component: StrategyMatrixDisplay,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create shared test data
const recipients = createRecipientPair();
const deathProbDistribution1 = createDeathProbDistribution(62);
const deathProbDistribution2 = createDeathProbDistribution(62);

/**
 * Creates calculation results with complete status.
 */
function createCompleteResults() {
  const results = createCoupleCalculationResults();
  results.beginRun(1000);
  results.addProgress(1000);
  results.completeRun();
  return results;
}

// Default: Display as dates
export const Default: Story = {
  args: {
    recipients,
    calculationResults: createCompleteResults(),
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: false,
    onselectcell: action('onselectcell'),
  },
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Two matrices side by side showing optimal filing dates for each recipient. Cell sizes indicate death age probability.',
    },
  },
};

// Display as ages
export const DisplayAsAges: Story = {
  args: {
    recipients,
    calculationResults: createCompleteResults(),
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: true,
    onselectcell: action('onselectcell'),
  },
};
DisplayAsAges.parameters = {
  docs: {
    description: {
      story:
        'Same display but showing filing ages instead of dates. Toggle is set to "Age" mode.',
    },
  },
};

// With selected cell
export const WithSelectedCell: Story = {
  args: {
    recipients,
    calculationResults: (() => {
      const results = createCompleteResults();
      results.setSelectedCell(6, 6);
      return results;
    })(),
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: false,
    onselectcell: action('onselectcell'),
  },
};
WithSelectedCell.parameters = {
  docs: {
    description: {
      story:
        'Display with a cell selected (highlighted) in both matrices at the same position.',
    },
  },
};
