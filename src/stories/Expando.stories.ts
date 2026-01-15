import type { Meta } from '@storybook/svelte';
import Expando from './Expando.demo.svelte';

const meta: Meta<Expando> = {
  component: Expando,
  title: 'Widgets/Expando',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'inline', 'section'],
      description: 'Visual style variant',
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: Expando,
  props: args,
});

export const Default = Template.bind({});
Default.args = {
  variant: 'default',
  collapsedText: 'Expand for details',
  expandedText: 'Collapse',
};

export const Inline = Template.bind({});
Inline.args = {
  variant: 'inline',
  collapsedText: 'Show example',
  expandedText: 'Hide',
};

export const Section = Template.bind({});
Section.args = {
  variant: 'section',
  collapsedText: 'Alternative options',
  expandedText: 'Alternative options',
};
