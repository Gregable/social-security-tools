import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/svelte';
import ModePicker from '../routes/strategy/components/ModePicker.svelte';

const meta: Meta<ModePicker> = {
  title: 'Strategy/ModePicker',
  component: ModePicker,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The first step of the strategy page: who the plan is for. The three choices sit in a row and stack at phone widths.',
      },
    },
    chromatic: {
      modes: {
        desktop: { viewport: 1280 },
        phone: { viewport: 390 },
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onselect: action('onselect') },
};
