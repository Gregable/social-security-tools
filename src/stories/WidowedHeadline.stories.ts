import type { Meta, StoryObj } from '@storybook/svelte';
import WidowedHeadline from '../routes/strategy/components/WidowedHeadline.svelte';
import {
  HEADLINE_SCENARIOS,
  widowedContextFor,
  widowedRecommendationFor,
} from '../test/helpers/widowed-mocks';

const meta: Meta<WidowedHeadline> = {
  title: 'Strategy/WidowedHeadline',
  component: WidowedHeadline,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Every story is computed by the real optimizer, as of October 2026, and
// widowed-story-scenarios.test.ts checks that each still shows what its
// description says.
function recommendationFor(scenario: keyof typeof HEADLINE_SCENARIOS) {
  return widowedRecommendationFor(
    widowedContextFor(HEADLINE_SCENARIOS[scenario])
  );
}

export const SurvivorFirstThenOwn: Story = {
  args: { recommendation: recommendationFor('survivorFirstThenOwn') },
};
SurvivorFirstThenOwn.parameters = {
  docs: {
    description: {
      story:
        'A higher own benefit: the survivor benefit bridges the years until the own benefit has grown, then the plan switches.',
    },
  },
};

export const OwnFirstThenSurvivor: Story = {
  args: { recommendation: recommendationFor('ownFirstThenSurvivor') },
};
OwnFirstThenSurvivor.parameters = {
  docs: {
    description: {
      story:
        'A higher survivor benefit: the reduced own benefit bridges the years until the survivor benefit has grown, then the plan switches.',
    },
  },
};

export const OwnNotNeeded: Story = {
  args: { recommendation: recommendationFor('ownNotNeeded') },
};
OwnNotNeeded.parameters = {
  docs: {
    description: {
      story:
        'An own benefit that never exceeds the survivor benefit is shown as not needed rather than given a date.',
    },
  },
};

export const FileNowBackdated: Story = {
  args: { recommendation: recommendationFor('fileNowBackdated') },
};
FileNowBackdated.parameters = {
  docs: {
    description: {
      story:
        'Past survivor full retirement age the survivor benefit stops growing, so the advice is to claim now and backdate.',
    },
  },
};

export const AlreadyReceivingSurvivor: Story = {
  args: { recommendation: recommendationFor('alreadyReceivingSurvivor') },
};
AlreadyReceivingSurvivor.parameters = {
  docs: {
    description: {
      story:
        'A survivor benefit that has already started is stated as a fact, and only the own benefit is planned.',
    },
  },
};
