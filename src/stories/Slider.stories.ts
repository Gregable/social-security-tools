import type {Meta} from '@storybook/svelte';
import {action} from '@storybook/addon-actions';

import Slider from '../components/Slider.svelte';

const meta: Meta<Slider> = {
  component: Slider,
  title: 'Slider',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};
export default meta;

const Template = ({...args}) => ({
  Component: Slider,
  props: args,
  on: {
    change: action('change'),
  },
});

export const Default = Template.bind({});
Default.args = {
  value: 10,
  floor: 0,
  ceiling: 20,
  step: 1,
};

export const LargeStep = Template.bind({});
LargeStep.args = {
  value: 10,
  floor: 0,
  ceiling: 50,
  step: 5,
};

export const Ticks = Template.bind({});
Ticks.args = {
  value: 10,
  floor: 0,
  ceiling: 20,
  step: 1,
  showTicks: true,
};

export const Colors = Template.bind({});
Colors.args = {
  value: 10,
  floor: 0,
  ceiling: 20,
  step: 1,
  showTicks: true,
  tickLeftColor: '#f6dfad',
  tickRightColor: '#e69f00',
  barLeftColor: '#f6dfad',
  barRightColor: '#e69f00',
  handleColor: '#e69f00',
  handleSelectedColor: '#a65f00',
};



export const Translate = Template.bind({});
Translate.args = {
  value: 4,
  floor: 0,
  ceiling: 10,
  step: 1,
  showTicks: true,
  translate: (value: number, _label: string) => value + '°C',
};

export const CustomTicks = Template.bind({});
CustomTicks.args = {
  value: 4,
  floor: 0,
  ceiling: 250,
  step: 1,
  showTicks: true,
  ticksArray: [
    {value: 0},
    {value: 32, label: '32°F', legend: 'Freezing'},
    {value: 98.6, label: '98.6°F', legend: 'Body temp'},
    {value: 212, label: '212°F', legend: 'Boiling'},
    {value: 250},
  ],
};
