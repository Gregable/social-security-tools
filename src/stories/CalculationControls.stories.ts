import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/svelte';
import { CalculationResults } from '../lib/strategy/ui/calculation-results';
import CalculationControls from '../routes/strategy/components/CalculationControls.svelte';

const meta: Meta<CalculationControls> = {
  title: 'Strategy/CalculationControls',
  component: CalculationControls,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Creates a CalculationResults instance in the specified state.
 */
function createCalculationResults(
  status: 'idle' | 'running' | 'complete',
  progress: number = 0,
  total: number = 1000
): CalculationResults {
  const results = new CalculationResults(10, 10);

  if (status === 'running') {
    results.beginRun(total);
    // Manually set progress by adding increments
    if (progress > 0) {
      results.addProgress(progress);
    }
  } else if (status === 'complete') {
    results.beginRun(total);
    results.addProgress(total);
    results.completeRun();
  }
  // 'idle' is the default state

  return results;
}

// Default: Ready to calculate (idle state)
export const Default: Story = {
  args: {
    calculationResults: createCalculationResults('idle'),
    disabled: false,
    oncalculate: action('oncalculate'),
  },
};
Default.parameters = {
  docs: {
    description: {
      story: 'Default state with button ready to trigger calculation.',
    },
  },
};

// Running: Calculation in progress
export const Running: Story = {
  args: {
    calculationResults: createCalculationResults('running', 500, 1000),
    disabled: false,
    oncalculate: action('oncalculate'),
  },
};
Running.parameters = {
  docs: {
    description: {
      story:
        'Calculation in progress showing spinner, progress text, and progress bar at 50%.',
    },
  },
};

// Running: Early progress (10%)
export const RunningEarlyProgress: Story = {
  args: {
    calculationResults: createCalculationResults('running', 100, 1000),
    disabled: false,
    oncalculate: action('oncalculate'),
  },
};
RunningEarlyProgress.parameters = {
  docs: {
    description: {
      story: 'Calculation in progress at 10% completion.',
    },
  },
};

// Running: Late progress (90%)
export const RunningLateProgress: Story = {
  args: {
    calculationResults: createCalculationResults('running', 900, 1000),
    disabled: false,
    oncalculate: action('oncalculate'),
  },
};
RunningLateProgress.parameters = {
  docs: {
    description: {
      story: 'Calculation in progress at 90% completion.',
    },
  },
};

// Disabled: Button disabled due to validation errors
export const Disabled: Story = {
  args: {
    calculationResults: createCalculationResults('idle'),
    disabled: true,
    oncalculate: action('oncalculate'),
  },
};
Disabled.parameters = {
  docs: {
    description: {
      story:
        'Button disabled because of input validation errors. The button shows a tooltip explaining why it is disabled.',
    },
  },
};

// Complete: After calculation finished
export const Complete: Story = {
  args: {
    calculationResults: createCalculationResults('complete'),
    disabled: false,
    oncalculate: action('oncalculate'),
  },
};
Complete.parameters = {
  docs: {
    description: {
      story:
        'After calculation is complete. Button returns to enabled state, ready for recalculation.',
    },
  },
};

// Large calculation: Many combinations
export const LargeCalculation: Story = {
  args: {
    calculationResults: createCalculationResults('running', 50000, 100000),
    disabled: false,
    oncalculate: action('oncalculate'),
  },
};
LargeCalculation.parameters = {
  docs: {
    description: {
      story:
        'Large calculation with 100,000 combinations, showing 50,000 of 100,000 processed.',
    },
  },
};
