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
  on: {
    update: action('onUpdate'),
    validityChange: action('onValidityChange'),
  },
});

// Default: Two recipients with valid data
export const Default = Template.bind({});
Default.args = {
  recipients: createRecipientPair(),
  piaValues: [2500, 1200] as [number, number],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  birthdateValidity: [true, true],
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
};

// Single mode: Only show one recipient
export const SingleMode = Template.bind({});
SingleMode.args = {
  recipients: createRecipientPair(),
  piaValues: [2500, 1200] as [number, number],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: true,
  birthdateValidity: [true, true],
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
};

// Invalid PIA: Shows validation error for high PIA
export const InvalidPIA = Template.bind({});
InvalidPIA.args = {
  recipients: createRecipientPair(),
  piaValues: [15000, 1200] as [number, number], // 15000 exceeds max
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  birthdateValidity: [true, true],
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
};
InvalidPIA.parameters = {
  docs: {
    description: {
      story:
        'Shows validation error when PIA exceeds the typical maximum of $10,000.',
    },
  },
};

// Different health multipliers
export const HealthVariations = Template.bind({});
const healthRecipients = createRecipientPair();
healthRecipients[0].healthMultiplier = 0.7; // Exceptional health
healthRecipients[1].healthMultiplier = 2.0; // Poor health
HealthVariations.args = {
  recipients: healthRecipients,
  piaValues: [2500, 1200] as [number, number],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  birthdateValidity: [true, true],
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
};
HealthVariations.parameters = {
  docs: {
    description: {
      story:
        'Shows recipients with different health multipliers: Alex has exceptional health (0.7x), Jordan has poor health (2.0x).',
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
  piaValues: [2500, 1200] as [number, number],
  birthdateInputs: ['1965-03-15', '1967-07-22'] as [string, string],
  isSingle: false,
  birthdateValidity: [true, true],
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
};
DifferentGenders.parameters = {
  docs: {
    description: {
      story:
        'Shows recipients with specific gender selections for mortality calculations.',
    },
  },
};

// Empty birthdates (initial state)
export const EmptyBirthdates = Template.bind({});
EmptyBirthdates.args = {
  recipients: createRecipientPair(),
  piaValues: [2500, 1200] as [number, number],
  birthdateInputs: ['', ''] as [string, string],
  isSingle: false,
  birthdateValidity: [false, false],
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
};
EmptyBirthdates.parameters = {
  docs: {
    description: {
      story:
        'Initial state with empty birthdates showing validation as invalid.',
    },
  },
};
