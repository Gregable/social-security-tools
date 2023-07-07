import type {Meta} from '@storybook/svelte';
import Expando from './Expando.demo.svelte';


const meta: Meta<Expando> = {
  component: Expando,
  title: 'Expando',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: Expando,
  props: args,
});

export const Default = Template.bind({});
Default.args = {};
