import type { Meta, StoryObj } from '@storybook/svelte';
import SponsorAd from '$lib/components/SponsorAd.svelte';

const meta: Meta<SponsorAd> = {
  component: SponsorAd,
  title: 'Components/SponsorAd',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "The sponsor card. When used inside a link it shows one decorative Schedule button. Given `links` (and while SPONSOR.chatUrl is set), it carries real Schedule and Live Chat buttons itself; the chat button links to the sponsor's hosted chat page, so no third-party script runs on ssa.tools.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<SponsorAd>;

export const Default: Story = {};

const noop = () => {};

export const WithChat: Story = {
  args: {
    links: { onSchedule: noop, onChat: noop },
  },
};

export const WithChatMobile: Story = {
  args: {
    links: { onSchedule: noop, onChat: noop },
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone6',
    },
  },
};
