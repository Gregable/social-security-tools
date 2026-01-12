import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';
import { Birthdate } from '$lib/birthday';
import BirthdateInput from '$lib/components/BirthdateInput.svelte';

const meta: Meta<BirthdateInput> = {
  component: BirthdateInput,
  title: 'Input/BirthdateInput',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A date input component that allows users to enter a birthdate using separate month, day, and year fields with validation.',
      },
    },
  },
  argTypes: {
    birthdate: {
      control: 'object',
      description: 'Initial birthdate value (Birthdate object or null)',
    },
    inputId: {
      control: 'text',
      description: 'ID prefix for input elements',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Whether to auto-focus the month input on mount',
    },
    isValid: {
      control: 'boolean',
      description: 'Bound validation state (output)',
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: BirthdateInput,
  props: args,
  on: {
    change: action('change'),
  },
});

// Empty state - no initial birthdate
export const Empty = Template.bind({});
Empty.args = {
  birthdate: null,
  inputId: 'birthdate-empty',
};
Empty.parameters = {
  docs: {
    description: {
      story: 'Initial empty state with no pre-filled date.',
    },
  },
};

// Pre-filled with valid date
export const WithValidDate = Template.bind({});
WithValidDate.args = {
  birthdate: Birthdate.FromYMD(1960, 5, 15),
  inputId: 'birthdate-valid',
};
WithValidDate.parameters = {
  docs: {
    description: {
      story: 'Pre-filled with a valid birthdate (June 15, 1960).',
    },
  },
};

// With autoFocus enabled
export const AutoFocused = Template.bind({});
AutoFocused.args = {
  birthdate: null,
  inputId: 'birthdate-focus',
  autoFocus: true,
};
AutoFocused.parameters = {
  docs: {
    description: {
      story:
        'Empty input with autoFocus enabled - month field receives focus on mount.',
    },
  },
};

// Early birthdate (older person near SS eligibility)
export const EarlyBirthdate = Template.bind({});
EarlyBirthdate.args = {
  birthdate: Birthdate.FromYMD(1955, 0, 1),
  inputId: 'birthdate-early',
};
EarlyBirthdate.parameters = {
  docs: {
    description: {
      story:
        'Pre-filled with January 1, 1955 - an older person approaching Social Security eligibility.',
    },
  },
};

// Younger person
export const RecentBirthdate = Template.bind({});
RecentBirthdate.args = {
  birthdate: Birthdate.FromYMD(1985, 6, 4),
  inputId: 'birthdate-recent',
};
RecentBirthdate.parameters = {
  docs: {
    description: {
      story: 'Pre-filled with July 4, 1985 - a younger person planning ahead.',
    },
  },
};
