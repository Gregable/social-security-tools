import type { Meta } from '@storybook/svelte';
import IntegrationsDemo from './Integrations.demo.svelte';

const meta: Meta<IntegrationsDemo> = {
  component: IntegrationsDemo,
  title: 'Integrations/AllIntroBanners',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Consolidated view of all IntroBanner components used across different financial tool integrations. Each integration has its own branded banner that explains how Social Security data will be used with that tool.',
      },
    },
  },
  argTypes: {
    isReportView: {
      control: 'boolean',
      description:
        'When true, shows a "Scroll to see results" badge. When false (paste flow), no badge is shown.',
    },
  },
};
export default meta;

const Template = ({ ...args }) => ({
  Component: IntegrationsDemo,
  props: args,
});

// All IntroBanners in paste flow view (default - no badge)
export const PasteFlowView = Template.bind({});
PasteFlowView.args = {
  isReportView: false,
};
PasteFlowView.parameters = {
  docs: {
    description: {
      story:
        'IntroBanners as they appear during the paste flow (before report is generated). No badge is shown.',
    },
  },
};

// All IntroBanners in report view (with scroll badge)
export const ReportView = Template.bind({});
ReportView.args = {
  isReportView: true,
};
ReportView.parameters = {
  docs: {
    description: {
      story:
        'IntroBanners as they appear in the report view. Shows a "Scroll to see results" badge to guide users.',
    },
  },
};
