import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';
import DiscountRateInput from '../routes/strategy/components/DiscountRateInput.svelte';

const meta: Meta<DiscountRateInput> = {
  title: 'Strategy/DiscountRateInput',
  component: DiscountRateInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

const Template = ({ ...args }) => ({
  Component: DiscountRateInput,
  props: args,
  on: {
    validityChange: action('onValidityChange'),
  },
});

// Default: Treasury rate selected (2.5% default before fetch)
export const Default = Template.bind({});
Default.args = {
  discountRatePercent: 2.5,
  onValidityChange: action('onValidityChange'),
};
Default.parameters = {
  docs: {
    description: {
      story:
        'Default state with Treasury rate selected. The actual treasury rate is fetched on mount, so this shows the default 2.5% before fetch completes.',
    },
  },
};

// Stock 10-year expected rate (3.5%)
export const Stock10YearExpected = Template.bind({});
Stock10YearExpected.args = {
  discountRatePercent: 3.5,
  onValidityChange: action('onValidityChange'),
};
Stock10YearExpected.parameters = {
  docs: {
    description: {
      story: 'US Stock 10-year expected return rate (3.5%).',
    },
  },
};

// Stock historical rate (7%)
export const StockHistorical = Template.bind({});
StockHistorical.args = {
  discountRatePercent: 7,
  onValidityChange: action('onValidityChange'),
};
StockHistorical.parameters = {
  docs: {
    description: {
      story: 'US Stock historical return rate (7%).',
    },
  },
};

// Custom rate (not matching any preset)
export const CustomRate = Template.bind({});
CustomRate.args = {
  discountRatePercent: 5.5,
  onValidityChange: action('onValidityChange'),
};
CustomRate.parameters = {
  docs: {
    description: {
      story:
        'Custom discount rate (5.5%) that does not match any preset button.',
    },
  },
};

// Zero discount rate
export const ZeroRate = Template.bind({});
ZeroRate.args = {
  discountRatePercent: 0,
  onValidityChange: action('onValidityChange'),
};
ZeroRate.parameters = {
  docs: {
    description: {
      story:
        'Zero discount rate - useful for simple nominal value comparisons without time value of money adjustments.',
    },
  },
};

// Invalid: Negative rate
export const InvalidNegativeRate = Template.bind({});
InvalidNegativeRate.args = {
  discountRatePercent: -5,
  onValidityChange: action('onValidityChange'),
};
InvalidNegativeRate.parameters = {
  docs: {
    description: {
      story:
        'Invalid state showing error for negative discount rate. Discount rate must be >= 0.',
    },
  },
};

// Invalid: Rate too high
export const InvalidHighRate = Template.bind({});
InvalidHighRate.args = {
  discountRatePercent: 55,
  onValidityChange: action('onValidityChange'),
};
InvalidHighRate.parameters = {
  docs: {
    description: {
      story:
        'Invalid state showing error for rate exceeding maximum (50%). Such high rates are unrealistic.',
    },
  },
};
