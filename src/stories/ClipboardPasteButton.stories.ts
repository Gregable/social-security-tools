import { action } from '@storybook/addon-actions';
import type { Meta } from '@storybook/svelte';

import type { ClipboardTextReader } from '../lib/clipboard-paste';
import ClipboardPasteButton from '../lib/components/ClipboardPasteButton.svelte';

const meta: Meta<ClipboardPasteButton> = {
  component: ClipboardPasteButton,
  title: 'Input/PasteFlow/ClipboardPasteButton',
  tags: ['autodocs'],
};
export default meta;

const Template = ({ ...args }) => ({
  Component: ClipboardPasteButton,
  props: { ontext: action('ontext'), ...args },
});

// Stand-in clipboards, so each outcome can be tried by clicking the button
// without granting the story clipboard access.
const holding = (text: string): ClipboardTextReader => ({
  readText: () => Promise.resolve(text),
});

export const WithRecord = Template.bind({});
WithRecord.args = {
  clipboard: holding('2018 $100,000\n2017 $90,000\n2016 $80,000'),
};

export const EmptyClipboard = Template.bind({});
EmptyClipboard.args = { clipboard: holding('') };

export const ReadDenied = Template.bind({});
ReadDenied.args = {
  clipboard: {
    readText: () =>
      Promise.reject(new DOMException('Denied', 'NotAllowedError')),
  },
};
