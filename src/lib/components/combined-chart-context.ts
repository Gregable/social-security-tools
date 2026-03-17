import type { TickItem } from '$lib/components/chart-utils';
import { translateSliderLabel } from '$lib/components/chart-utils';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';

/**
 * Per-recipient UI state for the combined chart.
 * Wraps a Recipient with slider position, floor, and tick configuration.
 */
export class RecipientContext {
  r: Recipient;
  // sliderMonths is bound to the value of the slider, in months.
  // This is set once in onMount to the user's NRA, typically 66 * 12.
  // It is not set by code, even if the users's birthday / NRA changes, so
  // that we don't override the user's selection should they have changed it
  // manually.
  sliderMonths: number = 62 * 12;
  // userFloor is the minimum age that the user can select. This may be
  // 62 years or 62 years and one month, depending on their birthdate.
  userFloor: number = 62 * 12;
  // Tick marks for the slider, including NRA labels.
  ticks: TickItem[] = [];

  startDate(): MonthDate {
    return this.r.birthdate.dateAtSsaAge(new MonthDuration(this.userFloor));
  }
  endDate(): MonthDate {
    return this.r.birthdate.dateAtSsaAge(
      MonthDuration.initFromYearsMonths({ years: 70, months: 0 })
    );
  }
}

/**
 * Returns the filing date selected by the user via the slider.
 */
export function userSelectedDate(personCtx: RecipientContext): MonthDate {
  const selectedAge = new MonthDuration(personCtx.sliderMonths);
  return personCtx.r.birthdate.dateAtSsaAge(selectedAge);
}

/**
 * Computes and sets the userFloor and tick marks for a recipient's slider.
 */
export function updateSlider(personCtx: RecipientContext): void {
  // We don't want users to select a start date earlier than is allowed.
  // For those born on the 1st/2nd, that's 62y0m. For everyone else, it's
  // 62y1m.
  if (personCtx.r.birthdate.layBirthDayOfMonth() <= 2) {
    personCtx.userFloor = 62 * 12;
  } else {
    personCtx.userFloor = 62 * 12 + 1;
  }

  personCtx.ticks = [];

  const startAge = MonthDuration.initFromYearsMonths({
    years: 62,
    months: 0,
  });
  const endAge = MonthDuration.initFromYearsMonths({ years: 70, months: 0 });
  for (
    let age = MonthDuration.copyFrom(startAge);
    age.lessThanOrEqual(endAge);
    age = age.add(MonthDuration.initFromYearsMonths({ years: 1, months: 0 }))
  ) {
    const monthsUntilNRA = personCtx.r
      .normalRetirementAge()
      .subtract(age)
      .asMonths();
    if (monthsUntilNRA === 0) {
      personCtx.ticks.push({
        value: age.asMonths(),
        label: translateSliderLabel(age.asMonths(), 'tick-value'),
        legend: 'NRA',
        color: personCtx.r.colors().dark,
      });
    } else {
      personCtx.ticks.push({
        value: age.asMonths(),
        label: translateSliderLabel(age.asMonths(), 'tick-value'),
      });
    }

    if (monthsUntilNRA > 0 && monthsUntilNRA < 12) {
      personCtx.ticks.push({
        value: personCtx.r.normalRetirementAge().asMonths(),
        label: '',
        legend: 'NRA',
        color: personCtx.r.colors().dark,
      });
    }
  }
  // eslint-disable-next-line no-self-assign
  personCtx.ticks = personCtx.ticks;
}

/**
 * If a recipient has zero PIA, cap their filing floor at or after the
 * other recipient's filing date.
 */
export function minCapSlider(
  ctx0: RecipientContext,
  ctx1: RecipientContext
): void {
  if (ctx0.r.pia().primaryInsuranceAmount().value() === 0) {
    // Calculate when the spouse files, but never allow filing before age 62
    // (the legal minimum). With large age gaps, the spouse may file before
    // this person turns 62.
    ctx0.userFloor = Math.max(
      62 * 12,
      ctx0.r.birthdate
        .ageAtSsaDate(
          ctx1.r.birthdate.dateAtSsaAge(new MonthDuration(ctx1.sliderMonths))
        )
        .asMonths()
    );
    // Similarly min cap the actual slider value:
    if (ctx0.sliderMonths < ctx0.userFloor) {
      ctx0.sliderMonths = ctx0.userFloor;
    }
  }
}
