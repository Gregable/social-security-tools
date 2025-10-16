import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';

import SpouseQuestion from '../lib/components/SpouseQuestion.svelte';

const meta: Meta<SpouseQuestion> = {
  component: SpouseQuestion,
  title: 'Input/PasteFlow/SpouseQuestion',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: SpouseQuestion,
  props: args,
  on: {
    response: action('response'),
  },
});

export const Default = Template.bind({});
Default.args = {};
