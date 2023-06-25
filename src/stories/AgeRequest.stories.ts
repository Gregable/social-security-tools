import type {Meta} from '@storybook/svelte';
import {action} from '@storybook/addon-actions';

import AgeRequest from '../components/AgeRequest.svelte';

const meta: Meta<AgeRequest> = {
  component: AgeRequest,
  title: 'Age Request',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: AgeRequest,
  props: args,
  on: {
    reset: action('submit'),
  },
});

export const Default = Template.bind({});
Default.args = {};
