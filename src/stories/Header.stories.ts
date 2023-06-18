import type {Meta, StoryObj} from '@storybook/svelte';

import Header from '../components/Header.svelte';

const meta = {
  title: 'Sitewide Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at:
    // https://storybook.js.org/docs/svelte/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const About: Story = {
  args: {active: 'About'},
};

export const Contributors: Story = {
  args: {active: 'Contributors'},
};

export const Contact: Story = {
  args: {active: 'Contact'},
};
