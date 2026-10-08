import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';
import { MonthDate } from '../lib/month-time';
import { Recipient } from '../lib/recipient';
import { emptyWidowedInput } from '../lib/strategy/calculations/late-spouse';
import WidowedInputs from '../routes/strategy/components/WidowedInputs.svelte';

const meta: Meta<WidowedInputs> = {
  title: 'Strategy/WidowedInputs',
  component: WidowedInputs,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

const Template = ({ ...args }) => ({
  Component: WidowedInputs,
  props: args,
});

const handlers = {
  onUpdate: action('onUpdate'),
  onValidityChange: action('onValidityChange'),
  oncontinue: action('oncontinue'),
  onstartover: action('onstartover'),
};

// Blank: nothing entered yet, Continue disabled.
export const Blank = Template.bind({});
Blank.args = {
  recipients: [new Recipient(), new Recipient()],
  piaValues: [null, null] as [number | null, number | null],
  birthdateInputs: ['', ''] as [string, string],
  widowedInput: emptyWidowedInput(),
  continueDisabled: true,
  errorMessage: null,
  ...handlers,
};

// Filled in: a spouse who claimed retirement benefits early. The survivor is
// old enough to have started either benefit, so both "already receive"
// controls show.
export const SpouseClaimedEarly = Template.bind({});
SpouseClaimedEarly.args = {
  recipients: [new Recipient(), new Recipient()],
  piaValues: [1800, 2400] as [number | null, number | null],
  birthdateInputs: ['1958-07-20', '1955-09-05'] as [string, string],
  widowedInput: {
    ...emptyWidowedInput(),
    deathMonth: MonthDate.initFromYearsMonths({ years: 2024, months: 1 }),
    claimKind: 'retirement',
    retirementStartedAt: MonthDate.initFromYearsMonths({
      years: 2018,
      months: 0,
    }),
  },
  continueDisabled: false,
  errorMessage: null,
  ...handlers,
};
SpouseClaimedEarly.parameters = {
  docs: {
    description: {
      story:
        'A late spouse who started retirement benefits early: the form asks when, because that caps the survivor benefit.',
    },
  },
};
