import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';
import StrategyCell from '../routes/strategy/components/StrategyCell.svelte';
import {
  createBucket,
  createRecipientPair,
  createStrategyResult,
} from '../test/helpers/strategy-mocks';

const meta: Meta<StrategyCell> = {
  title: 'Strategy/StrategyCell',
  component: StrategyCell,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

const Template = ({ ...args }) => ({
  Component: StrategyCell,
  props: args,
  on: {
    hover: action('hover'),
    hoverout: action('hoverout'),
    select: action('select'),
  },
});

const recipients = createRecipientPair();
const calculationResult = createStrategyResult({
  deathAge1: 85,
  deathAge2: 87,
  filingAgeMonths1: 67 * 12 + 3,
  filingAgeMonths2: 64 * 12 + 6,
  bucket1: createBucket(85),
  bucket2: createBucket(87),
});

// Default: Normal cell state
export const Default = Template.bind({});
Default.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: false,
  recipients,
  recipientIndex: 0,
  hoveredCell: null,
  isSelected: false,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #90EE90;',
};

// Display as age
export const DisplayAsAge = Template.bind({});
DisplayAsAge.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: true,
  recipients,
  recipientIndex: 0,
  hoveredCell: null,
  isSelected: false,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #90EE90;',
};

// Hovered cell (directly hovered)
export const Hovered = Template.bind({});
Hovered.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: false,
  recipients,
  recipientIndex: 0,
  hoveredCell: { rowIndex: 5, colIndex: 5 },
  isSelected: false,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #90EE90;',
};
Hovered.parameters = {
  docs: {
    description: {
      story: 'Cell in directly hovered state with blue highlight.',
    },
  },
};

// Highlighted row (same row as hovered cell)
export const HighlightedRow = Template.bind({});
HighlightedRow.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: false,
  recipients,
  recipientIndex: 0,
  hoveredCell: { rowIndex: 5, colIndex: 3 }, // Same row, different column
  isSelected: false,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #90EE90;',
};
HighlightedRow.parameters = {
  docs: {
    description: {
      story: 'Cell in same row as hovered cell (crosshair row highlight).',
    },
  },
};

// Highlighted column (same column as hovered cell)
export const HighlightedColumn = Template.bind({});
HighlightedColumn.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: false,
  recipients,
  recipientIndex: 0,
  hoveredCell: { rowIndex: 3, colIndex: 5 }, // Same column, different row
  isSelected: false,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #90EE90;',
};
HighlightedColumn.parameters = {
  docs: {
    description: {
      story:
        'Cell in same column as hovered cell (crosshair column highlight).',
    },
  },
};

// Selected cell
export const Selected = Template.bind({});
Selected.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: false,
  recipients,
  recipientIndex: 0,
  hoveredCell: null,
  isSelected: true,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #90EE90;',
};
Selected.parameters = {
  docs: {
    description: {
      story: 'Cell in selected state (bold text, blue background).',
    },
  },
};

// Small cell (truncated content)
export const SmallCell = Template.bind({});
SmallCell.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: false,
  recipients,
  recipientIndex: 0,
  hoveredCell: null,
  isSelected: false,
  cellWidth: 35,
  cellHeight: 25,
  cellStyle: 'background-color: #90EE90;',
};
SmallCell.parameters = {
  docs: {
    description: {
      story: 'Small cell with truncated date format to fit limited space.',
    },
  },
};

// Large cell (full content)
export const LargeCell = Template.bind({});
LargeCell.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult,
  displayAsAges: false,
  recipients,
  recipientIndex: 0,
  hoveredCell: null,
  isSelected: false,
  cellWidth: 150,
  cellHeight: 100,
  cellStyle: 'background-color: #90EE90;',
};
LargeCell.parameters = {
  docs: {
    description: {
      story: 'Large cell with full date format displayed.',
    },
  },
};

// Early filing age (62)
export const EarlyFiling = Template.bind({});
EarlyFiling.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult: createStrategyResult({
    filingAgeMonths1: 62 * 12,
    filingAgeMonths2: 62 * 12,
  }),
  displayAsAges: true,
  recipients,
  recipientIndex: 0,
  hoveredCell: null,
  isSelected: false,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #FFD700;', // Yellow for early
};
EarlyFiling.parameters = {
  docs: {
    description: {
      story: 'Cell showing early filing age (62) with yellow coloring.',
    },
  },
};

// Late filing age (70)
export const LateFiling = Template.bind({});
LateFiling.args = {
  rowIndex: 5,
  colIndex: 5,
  calculationResult: createStrategyResult({
    filingAgeMonths1: 70 * 12,
    filingAgeMonths2: 70 * 12,
  }),
  displayAsAges: true,
  recipients,
  recipientIndex: 0,
  hoveredCell: null,
  isSelected: false,
  cellWidth: 80,
  cellHeight: 60,
  cellStyle: 'background-color: #228B22;', // Green for late
};
LateFiling.parameters = {
  docs: {
    description: {
      story: 'Cell showing late filing age (70) with green coloring.',
    },
  },
};
