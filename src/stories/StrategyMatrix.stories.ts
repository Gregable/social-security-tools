import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/svelte';
import StrategyMatrix from '../routes/strategy/components/StrategyMatrix.svelte';
import {
  createCoupleCalculationResults,
  createDeathProbDistribution,
  createRecipientPair,
} from '../test/helpers/strategy-mocks';

const meta: Meta<StrategyMatrix> = {
  title: 'Strategy/StrategyMatrix',
  component: StrategyMatrix,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Create shared test data
const recipients = createRecipientPair();
const calculationResults = createCoupleCalculationResults();
const deathProbDistribution1 = createDeathProbDistribution(62);
const deathProbDistribution2 = createDeathProbDistribution(62);

// Default: Complete matrix showing first recipient's filing dates
export const Default: Story = {
  args: {
    recipientIndex: 0,
    recipients,
    calculationResults,
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: false,
    hoveredCell: null,
    onhovercell: action('onhovercell'),
    onselectcell: action('onselectcell'),
  },
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Complete strategy matrix showing optimal filing dates for the first recipient (Alex). Cell size indicates probability of each death age combination.',
    },
  },
};

// Display as ages instead of dates
export const DisplayAsAges: Story = {
  args: {
    recipientIndex: 0,
    recipients,
    calculationResults,
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: true,
    hoveredCell: null,
    onhovercell: action('onhovercell'),
    onselectcell: action('onselectcell'),
  },
};
DisplayAsAges.parameters = {
  docs: {
    description: {
      story: 'Same matrix but displaying filing ages instead of dates.',
    },
  },
};

// Second recipient's matrix
export const SecondRecipient: Story = {
  args: {
    recipientIndex: 1,
    recipients,
    calculationResults,
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: false,
    hoveredCell: null,
    onhovercell: action('onhovercell'),
    onselectcell: action('onselectcell'),
  },
};
SecondRecipient.parameters = {
  docs: {
    description: {
      story:
        'Strategy matrix showing optimal filing dates for the second recipient (Jordan).',
    },
  },
};

// Hovered cell state
export const HoveredCell: Story = {
  args: {
    recipientIndex: 0,
    recipients,
    calculationResults,
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: false,
    hoveredCell: { rowIndex: 5, colIndex: 5 },
    onhovercell: action('onhovercell'),
    onselectcell: action('onselectcell'),
  },
};
HoveredCell.parameters = {
  docs: {
    description: {
      story:
        'Matrix with a cell in hover state showing the crosshair highlighting pattern.',
    },
  },
};

// Selected cell state
export const SelectedCell: Story = {
  args: {
    recipientIndex: 0,
    recipients,
    calculationResults: (() => {
      const results = createCoupleCalculationResults();
      results.setSelectedCell(6, 6);
      return results;
    })(),
    deathProbDistribution1,
    deathProbDistribution2,
    displayAsAges: false,
    hoveredCell: null,
    onhovercell: action('onhovercell'),
    onselectcell: action('onselectcell'),
  },
};
SelectedCell.parameters = {
  docs: {
    description: {
      story: 'Matrix with a cell in selected state (highlighted blue).',
    },
  },
};
