import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';
import RecipientInputs from '../routes/strategy/components/RecipientInputs.svelte';
import { createRecipientPair } from '../test/helpers/strategy-mocks';

const meta: Meta<RecipientInputs> = {
  title: 'Strategy/RecipientInputs',
  component: RecipientInputs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

const Template = ({ ...args }) => ({
  Component: RecipientInputs,
  props: args,
});

// Default: Two recipients with valid data, Continue enabled
export const Default = Template.bind({});
Default.args = {
  recipients: createRecipientPair(),
  piaValues: [2500, 1200] as [number | null, number | null],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  continueDisabled: false,
  errorMessage: null,
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};

// Single mode: Only show one recipient column
export const SingleMode = Template.bind({});
SingleMode.args = {
  recipients: createRecipientPair(),
  piaValues: [2500, 1200] as [number | null, number | null],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: true,
  continueDisabled: false,
  errorMessage: null,
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};

// Blank PIA: Fields empty, Continue disabled
export const BlankPIA = Template.bind({});
BlankPIA.args = {
  recipients: createRecipientPair(),
  piaValues: [null, null] as [number | null, number | null],
  birthdateInputs: ['', ''] as [string, string],
  isSingle: false,
  continueDisabled: true,
  errorMessage: null,
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};
BlankPIA.parameters = {
  docs: {
    description: {
      story:
        'Initial state: blank PIA and birthdate inputs, Continue disabled until the user fills them in.',
    },
  },
};

// Zero PIA is valid (spousal-only scenarios)
export const ZeroPiaSpousal = Template.bind({});
ZeroPiaSpousal.args = {
  recipients: createRecipientPair(),
  piaValues: [2500, 0] as [number | null, number | null],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  continueDisabled: false,
  errorMessage: null,
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};
ZeroPiaSpousal.parameters = {
  docs: {
    description: {
      story:
        'Valid state with one recipient PIA at $0 — spousal-only benefit scenario.',
    },
  },
};

// Invalid PIA: Shows validation error for high PIA
export const InvalidPIA = Template.bind({});
InvalidPIA.args = {
  recipients: createRecipientPair(),
  piaValues: [15000, 1200] as [number | null, number | null],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  continueDisabled: true,
  errorMessage: null,
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};
InvalidPIA.parameters = {
  docs: {
    description: {
      story:
        'Shows validation error when PIA exceeds the typical maximum of $10,000.',
    },
  },
};

// With error banner (after a failed Continue)
export const WithErrorBanner = Template.bind({});
WithErrorBanner.args = {
  recipients: createRecipientPair(),
  piaValues: [2500, 1200] as [number | null, number | null],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  continueDisabled: false,
  errorMessage: 'Could not compute results. Check your inputs and try again.',
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};
WithErrorBanner.parameters = {
  docs: {
    description: {
      story:
        'Form with an error banner surfaced after a Continue click that failed computation.',
    },
  },
};

// Different genders selected
export const DifferentGenders = Template.bind({});
const genderRecipients = createRecipientPair();
genderRecipients[0].gender = 'male';
genderRecipients[1].gender = 'female';
DifferentGenders.args = {
  recipients: genderRecipients,
  piaValues: [2500, 1200] as [number | null, number | null],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  continueDisabled: false,
  errorMessage: null,
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};
DifferentGenders.parameters = {
  docs: {
    description: {
      story:
        'Shows recipients with specific gender selections for mortality calculations.',
    },
  },
};
