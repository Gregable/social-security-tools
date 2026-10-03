import type { Meta, StoryObj } from '@storybook/svelte';
import { MonthDate } from '../lib/month-time';
import WidowedHeadline from '../routes/strategy/components/WidowedHeadline.svelte';
import {
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

// Every story is computed by the real optimizer, as of October 2026.

export const SurvivorFirstThenOwn: Story = {
  args: {
    recommendation: widowedRecommendationFor(
      widowedContextFor({
        ownPia: 2500,
        born: [1968, 3, 15],
        spousePia: 1500,
        spouseBorn: [1964, 5, 10],
        died: [2025, 11],
      })
    ),
  },
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
  args: {
    recommendation: widowedRecommendationFor(
      widowedContextFor({
        ownPia: 1200,
        born: [1964, 3, 15],
        spousePia: 2600,
        spouseBorn: [1961, 3, 15],
        died: [2025, 11],
      })
    ),
  },
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
  args: {
    recommendation: widowedRecommendationFor(
      widowedContextFor({
        ownPia: 500,
        born: [1968, 3, 15],
        spousePia: 2000,
        spouseBorn: [1960, 1, 2],
        died: [2026, 6],
        claim: {
          kind: 'retirement',
          startedAt: MonthDate.initFromYearsMonths({ years: 2022, months: 0 }),
        },
      })
    ),
  },
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
  args: {
    recommendation: widowedRecommendationFor(
      widowedContextFor({
        ownPia: 1500,
        born: [1950, 5, 10],
        spousePia: 2500,
        spouseBorn: [1948, 2, 10],
        died: [2025, 3],
      })
    ),
  },
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
  args: {
    recommendation: widowedRecommendationFor(
      widowedContextFor({
        ownPia: 1800,
        born: [1963, 7, 20],
        spousePia: 2400,
        spouseBorn: [1961, 9, 5],
        died: [2024, 2],
        claim: {
          kind: 'retirement',
          startedAt: MonthDate.initFromYearsMonths({ years: 2024, months: 0 }),
        },
        filed: {
          survivor: MonthDate.initFromYearsMonths({ years: 2024, months: 3 }),
          own: null,
        },
      })
    ),
  },
};
AlreadyReceivingSurvivor.parameters = {
  docs: {
    description: {
      story:
        'A survivor benefit that has already started is stated as a fact, and only the own benefit is planned.',
    },
  },
};
