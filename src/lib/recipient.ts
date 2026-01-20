import { Birthdate, type SerializedBirthdate } from '$lib/birthday';
import * as constants from '$lib/constants';
import {
  EarningRecord,
  type SerializedEarningRecord,
} from '$lib/earning-record';
import type { GenderOption } from '$lib/life-tables';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { PrimaryInsuranceAmount } from '$lib/pia';

export type { GenderOption };

export interface RecipientColors {
  dark: string;
  medium: string;
  light: string;
}

/**
 * Serialized format for session storage.
 */
export interface SerializedRecipient {
  earningsRecords: SerializedEarningRecord[];
  birthdate: SerializedBirthdate;
  name: string;
  isPiaOnly: boolean;
  overridePiaCents: number | null;
  gender: string;
  healthMultiplier: number;
  isFirst: boolean;
}

/**
 * A Recipient object manages calculating a user's SSA and IRS data.
 */
export class Recipient {
  /** Health multiplier to scale mortality q(x) values (0.7–2.5). */
  private healthMultiplier_: number = 1.0;
  get healthMultiplier(): number {
    return this.healthMultiplier_;
  }
  set healthMultiplier(multiplier: number) {
    // Clamp within supported UI range to avoid invalid inputs
    const clamped = Math.max(0.7, Math.min(2.5, Number(multiplier)));
    if (!Number.isFinite(clamped)) return;
    this.healthMultiplier_ = clamped;
    this.publish_();
  }

  /** The recipient's gender (for mortality calculation). */
  private gender_: GenderOption = 'blended';
  get gender(): GenderOption {
    return this.gender_;
  }
  set gender(gender: GenderOption) {
    this.gender_ = gender;
    this.publish_();
  }

  /**
   * Subscribers to call back for changes to this Recipient.
   */
  private subscribers_: Array<(recipient: Recipient) => void> = [];

  /**
   * Registers a callback to be called when this Recipient changes.
   * @param callback The callback to call when this Recipient changes.
   * @return A function that can be called to unsubscribe the callback.
   * @see https://svelte.dev/docs#Store_contract
   */
  subscribe(callback: (recipient: Recipient) => void): () => void {
    this.subscribers_.push(callback);
    callback(this);
    // Return an unsubscribe function.
    return () => {
      const index = this.subscribers_.indexOf(callback);
      if (index !== -1) {
        this.subscribers_.splice(index, 1);
      }
    };
  }

  private publish_() {
    this.subscribers_.forEach((callback) => {
      callback(this);
    });
  }

  /** The recipient's name. */
  private name_: string;
  get name(): string {
    return this.name_;
  }
  set name(name: string) {
    this.name_ = name;
    this.publish_();
  }

  /**
   * Returns a shortened version of the recipient's name, if necessary.
   * @param length The maximum character length of the output.
   * @returns
   */
  shortName(length: number): string {
    if (this.name_.length <= length) return this.name_;
    return `${this.name_.substring(0, length - 1)}…`;
  }

  /** True if this is the only recipient, false if there are two. */
  private only_: boolean = true;
  /** True if this is the only recipient or the first recipient. */
  private first_: boolean = true;
  get only(): boolean {
    return this.only_;
  }
  get first(): boolean {
    return this.first_;
  }
  markFirst() {
    this.only_ = false;
    this.first_ = true;
    this.publish_();
  }
  markSecond() {
    this.only_ = false;
    this.first_ = false;
    this.publish_();
  }

  /**
   * If true, the user only entered the PIA, not individual earnings records,
   * for this user. In this case, many of the reports can not be shown since
   * they depend on the earnings records.
   */
  private isPiaOnly_: boolean = false;
  get isPiaOnly(): boolean {
    return this.isPiaOnly_;
  }

  private overridePia_: Money | null = null;
  get overridePia(): Money | null {
    return this.overridePia_;
  }

  /**
   * Throws an error if this recipient is in PIA-only mode.
   * @throws Error if isPiaOnly is true
   */
  private requireNotPiaOnly_(): void {
    if (this.isPiaOnly_) {
      throw new Error('Operation not supported when PIA is set.');
    }
  }

  setPia(pia: Money) {
    if (
      this.earningsRecords_.length > 0 ||
      this.futureEarningsRecords_.length > 0
    ) {
      throw new Error('Cannot set PIA when earnings records are present.');
    }
    this.isPiaOnly_ = true;
    this.overridePia_ = pia;
  }

  /**
   * The recipient's earning records over all years in the SSA database, if
   * any.
   */
  private earningsRecords_: Array<EarningRecord> = [];
  get earningsRecords(): Array<EarningRecord> {
    return this.earningsRecords_;
  }
  set earningsRecords(earningsRecords: Array<EarningRecord>) {
    this.requireNotPiaOnly_();
    this.earningsRecords_ = earningsRecords;
    // Update the indexing year for the new records.
    this.updateEarningsRecords_();
  }

  /**
   * The recipient's planned future earning records, if any.
   */
  private futureEarningsRecords_: Array<EarningRecord> = [];
  get futureEarningsRecords(): Array<EarningRecord> {
    return this.futureEarningsRecords_;
  }
  set futureEarningsRecords(futureEarningsRecords: Array<EarningRecord>) {
    this.requireNotPiaOnly_();
    this.futureEarningsRecords_ = futureEarningsRecords;
    // Update the indexing year for the new records.
    this.updateEarningsRecords_();
  }

  /**
   * Creates future earning records for the specified number of years.
   * @param numYears The number of years to simulate.
   * @param wage The wage to use for the simulation.
   */
  simulateFutureEarningsYears(numYears: number, wage: Money) {
    this.requireNotPiaOnly_();
    this.futureEarningsRecords_ = [];

    // We can't simulate the past, so start the simulation at the current
    // year. However, if there are records for this year or future years,
    // start the simulation at the next year not in the records as long as
    // that record is complete.
    let startYear = constants.CURRENT_YEAR;
    if (this.earningsRecords_.length > 0) {
      const lastRecord =
        this.earningsRecords_[this.earningsRecords_.length - 1];
      if (
        lastRecord.year === constants.CURRENT_YEAR - 1 &&
        lastRecord.incomplete
      ) {
        // If the previous year's record is listed as incomplete, we allow the
        // user to simulate that year as well.
        startYear = constants.CURRENT_YEAR - 1;
      } else if (lastRecord.year >= constants.CURRENT_YEAR) {
        // If the user has already input earnings for this year or a future
        // year, we start the simulation at the next year.
        startYear = lastRecord.year + 1;
      }
    }

    // Add the simulated records for the number of years requested.
    for (let i = 0; i < numYears; ++i) {
      let cappedWage = wage;
      if (startYear + i <= constants.MAX_MAXIMUM_EARNINGS_YEAR) {
        cappedWage = Money.min(wage, constants.MAXIMUM_EARNINGS[startYear + i]);
      } else {
        cappedWage = Money.min(
          wage,
          constants.MAXIMUM_EARNINGS[constants.MAX_MAXIMUM_EARNINGS_YEAR]
        );
      }
      this.futureEarningsRecords_.push(
        new EarningRecord({
          year: startYear + i,
          taxedEarnings: cappedWage,
          taxedMedicareEarnings: cappedWage,
        })
      );
    }
    // Update the indexing year for the new records.
    this.updateEarningsRecords_();
  }

  /**
   * Top constants.SSA_EARNINGS_YEARS (35) years of earning records.
   *
   * Updated in updateEarningsRecords_().
   */
  private top35IndexedEarnings_: Array<EarningRecord> = [];

  /**
   * Total indexed earnings over the top 35 years.
   *
   * Updated in updateEarningsRecords_().
   */
  private totalIndexedEarnings_: Money = Money.from(0);
  totalIndexedEarnings(): Money {
    this.requireNotPiaOnly_();
    return this.totalIndexedEarnings_;
  }

  /**
   * The recipient's normal retirement age.
   *
   * Recalculated when birthdate is updated.
   */
  private normalRetirementAge_: MonthDuration;

  /**
   * The recipient's normal retirement age for survivor benefits.
   *
   * Recalculated when birthdate is updated.
   */
  private survivorNormalRetirementAge_: MonthDuration;

  /**
   * The recipient's annual delayed retirement increase.
   *
   * Recalculated when birthdate is updated.
   */
  private delayedRetirementIncrease_: number;

  /**
   * The recipient's birthdate.
   */
  private birthdate_: Birthdate = Birthdate.FromYMD(1980, 0, 1);
  get birthdate(): Birthdate {
    return this.birthdate_;
  }
  set birthdate(birthdate: Birthdate) {
    this.birthdate_ = birthdate;
    // Update the indexing year for the all records based on the new
    // birthdate.
    if (!this.isPiaOnly_) this.updateEarningsRecords_();

    const retirementAgeBracket = this.retirementAgeBracket();

    // Recompute the NRA based on the new birthdate.
    this.normalRetirementAge_ = MonthDuration.initFromYearsMonths({
      years: retirementAgeBracket.ageYears,
      months: retirementAgeBracket.ageMonths,
    });

    const survivorRetirementAgeBracket = this.survivorRetirementAgeBracket();

    // Recompute the survivor NRA based on the new birthdate.
    this.survivorNormalRetirementAge_ = MonthDuration.initFromYearsMonths({
      years: survivorRetirementAgeBracket.ageYears,
      months: survivorRetirementAgeBracket.ageMonths,
    });

    // Recompute the delayed retirement increase based on the new birthdate.
    this.delayedRetirementIncrease_ =
      retirementAgeBracket.delayedIncreaseAnnual;
  }

  /**
   * Finds the retirement age bracket for this recipient's birth year.
   * @param brackets Array of age brackets with minYear/maxYear ranges.
   * @returns The bracket matching this recipient's SSA birth year.
   * @throws Error if no matching bracket is found.
   */
  private findAgeBracket<T extends { minYear: number; maxYear: number }>(
    brackets: readonly T[]
  ): T {
    const birthYear = this.birthdate_.ssaBirthYear();
    const bracket = brackets.find(
      (b) => birthYear >= b.minYear && birthYear <= b.maxYear
    );
    if (!bracket) {
      throw new Error(
        `No retirement age bracket found for birth year ${birthYear}`
      );
    }
    return bracket;
  }

  /** Returns the normal retirement age bracket for this recipient. */
  private retirementAgeBracket() {
    return this.findAgeBracket(constants.FULL_RETIREMENT_AGE);
  }

  /**
   * Returns the survivor benefit retirement age bracket for this recipient.
   * Survivor benefits have different full retirement ages than personal benefits.
   */
  private survivorRetirementAgeBracket() {
    return this.findAgeBracket(constants.FULL_RETIREMENT_AGE_SURVIVOR);
  }

  /*
   * Recipient's normal retirement age.
   */
  normalRetirementAge(): MonthDuration {
    return this.normalRetirementAge_;
  }

  delayedRetirementIncrease(): number {
    return this.delayedRetirementIncrease_;
  }

  /*
   * Recipient's normal retirement date.
   */
  normalRetirementDate(): MonthDate {
    return this.birthdate_
      .ssaBirthMonthDate()
      .addDuration(this.normalRetirementAge());
  }

  /*
   * Recipient's normal retirement age for survivor benefits.
   */
  survivorNormalRetirementAge(): MonthDuration {
    return this.survivorNormalRetirementAge_;
  }

  /*
   * Recipient's normal retirement date for survivor benefits.
   */
  survivorNormalRetirementDate(): MonthDate {
    return this.birthdate_
      .ssaBirthMonthDate()
      .addDuration(this.survivorNormalRetirementAge());
  }

  /**
   * The early retirement reduction factor changes from 6.67%/yr for years
   * earlier than 3 years before normal retirement age to 5%/yr for the 3 years
   * immediately before normal retirement age. This function returns the age at
   * which the reduction factor changes.
   */
  earlyRetirementInflectionAge(): MonthDuration {
    return this.normalRetirementAge().subtract(new MonthDuration(36));
  }

  /**
   * The early retirement reduction factor changes from 6.67%/yr for years
   * earlier than 3 years before normal retirement age to 5%/yr for the 3 years
   * immediately before normal retirement age. This function returns the date at
   * which the reduction factor changes.
   */
  earlyRetirementInflectionDate(): MonthDate {
    return this.normalRetirementDate().subtractDuration(new MonthDuration(36));
  }

  /**
   * The year from which benefits are indexed for the PIA calculation.
   *
   * From https://www.ssa.gov/oact/cola/piaformula.html, the PIA calculation
   * depends on the year at which an individual first becomes eligible for
   * benefits, (when they turn 62). The computation is based on the wage
   * index from two years prior (when they turn 60).
   */
  indexingYear(): number {
    return this.birthdate_
      .dateAtSsaAge(MonthDuration.initFromYearsMonths({ years: 60, months: 0 }))
      .year();
  }

  /**
   * The total number of credits the recipient has earned so far.
   *
   * This does not include future credits.
   */
  earnedCredits(): number {
    // Assume that PIA only recipients have enough credits.
    if (this.isPiaOnly_) {
      return 40;
    }
    let credits: number = 0;
    for (let i = 0; i < this.earningsRecords_.length; ++i) {
      credits += this.earningsRecords_[i].credits();
    }
    return Math.min(40, credits);
  }

  /**
   * The total number of credits the recipient has earned or will earn.
   */
  totalCredits(): number {
    let credits: number = this.earnedCredits();
    for (let i = 0; i < this.futureEarningsRecords_.length; ++i) {
      credits += this.futureEarningsRecords_[i].credits();
    }

    return Math.min(40, credits);
  }

  /**
   * Detects if the recipient is eligible for benefits. Uses future earnings
   * records if present.
   * @returns True if the recipient is eligible for benefits, false otherwise.
   */
  isEligible(): boolean {
    // Assume that PIA only recipients are eligible.
    if (this.isPiaOnly_) {
      return true;
    }
    return this.totalCredits() >= 40;
  }

  /**
   * Initializes an array of earnings records with indexing year and age.
   * Sorts the records by year ascending and resets isTop35EarningsYear.
   */
  private initializeEarningsRecords_(
    records: EarningRecord[],
    indexingYear: number
  ): void {
    const birthYear = this.birthdate_.ssaBirthYear();
    records.sort((a, b) => a.year - b.year);
    for (const record of records) {
      record.indexingYear = indexingYear;
      record.age = record.year - birthYear;
      record.isTop35EarningsYear = false;
    }
  }

  /**
   * Populates the indexingYear field of each earnings record.
   * Sorts the earnings records by year ascending.
   */
  private updateEarningsRecords_() {
    this.requireNotPiaOnly_();
    const indexingYear = this.indexingYear();

    this.initializeEarningsRecords_(this.earningsRecords_, indexingYear);
    this.initializeEarningsRecords_(this.futureEarningsRecords_, indexingYear);

    this.top35IndexedEarnings_ = this.earningsRecords_.concat(
      this.futureEarningsRecords_
    );
    this.top35IndexedEarnings_.sort((a, b) => {
      // Prefer higher indexed earnings, break ties by older years.
      const aEarnings = a.indexedEarnings();
      const bEarnings = b.indexedEarnings();
      if (!aEarnings.equals(bEarnings)) {
        return bEarnings.cents() - aEarnings.cents();
      }
      return a.year - b.year;
    });
    // Remove all but the top 35 years.
    this.top35IndexedEarnings_.splice(constants.SSA_EARNINGS_YEARS);
    // Calculate the total indexed earnings and mark the top 35 years.
    this.totalIndexedEarnings_ = Money.from(0);
    for (let i = 0; i < this.top35IndexedEarnings_.length; ++i) {
      this.top35IndexedEarnings_[i].isTop35EarningsYear = true;
      this.totalIndexedEarnings_ = this.totalIndexedEarnings_.plus(
        this.top35IndexedEarnings_[i].indexedEarnings()
      );
    }

    this.publish_();
  }

  hasEarningsBefore1978(): boolean {
    this.requireNotPiaOnly_();
    // Only check the first earnings record. Future records are after 1978.
    return this.earningsRecords_.length === 0
      ? false
      : this.earningsRecords_[0].year < 1978;
  }

  /**
   * Minimum indexed earnings needed to affect the top 35 years of earnings.
   * If fewer than 35 years of earnings, this is always 0.
   */
  cutoffIndexedEarnings(): Money {
    this.requireNotPiaOnly_();
    return this.top35IndexedEarnings_.length < constants.SSA_EARNINGS_YEARS
      ? Money.from(0)
      : this.top35IndexedEarnings_[
          this.top35IndexedEarnings_.length - 1
        ].indexedEarnings();
  }

  /**
   * Monthly indexed earnings for the top 35 years of earnings.
   */
  monthlyIndexedEarnings(): Money {
    this.requireNotPiaOnly_();
    return this.totalIndexedEarnings_
      .div(12)
      .div(constants.SSA_EARNINGS_YEARS)
      .floorToDollar();
  }

  /**
   * The Primary Insurance Amount (PIA) for this recipient.
   */
  pia(): PrimaryInsuranceAmount {
    return new PrimaryInsuranceAmount(this);
  }

  /**
   * Returns benefit multiplier at a given age.
   */
  benefitMultiplierAtAge(age: MonthDuration): number {
    const nra = this.normalRetirementAge();
    // Compute the number of total months between birth and full retirement age.
    if (nra.greaterThan(age)) {
      // Reduced benefits due to taking benefits early.
      const before = nra.subtract(age);
      return (
        -1.0 *
        ((Math.min(36, before.asMonths()) * 5) / 900 +
          (Math.max(0, before.asMonths() - 36) * 5) / 1200)
      );
    } else {
      // Increased benefits due to taking benefits late.
      const after = age.subtract(nra);
      return (this.delayedRetirementIncrease() / 12) * after.asMonths();
    }
  }

  /**
   * Returns personal benefit amount if starting benefits at a given age.
   */
  benefitAtAge(age: MonthDuration): Money {
    return this.pia()
      .primaryInsuranceAmount()
      .floorToDollar()
      .times(1 + this.benefitMultiplierAtAge(age))
      .floorToDollar();
  }

  /**
   * Given a certain filing date and current date, returns the benefit amount
   * for the recipient on that date. Does not include spousal benefits.
   *
   * @param filingDate - The date the recipient files for benefits
   * @param atDate - The date to calculate the benefit for
   * @throws Error if filing age is less than 62
   */
  benefitOnDate(filingDate: MonthDate, atDate: MonthDate): Money {
    const filingAge = this.birthdate.ageAtSsaDate(filingDate);
    const minFilingAge = MonthDuration.initFromYearsMonths({
      years: 62,
      months: 0,
    });
    if (filingAge.lessThan(minFilingAge)) {
      throw new Error(
        `Filing age must be at least 62, got ${filingAge.years()}y ${filingAge.modMonths()}m`
      );
    }

    // If the recipient hasn't filed yet, return $0:
    if (filingDate.greaterThan(atDate)) return Money.from(0);

    return this.benefitOnDateCore(filingDate, atDate, filingAge);
  }

  /**
   * Optimized version of benefitOnDate that skips validation.
   * Use only when inputs are already validated (e.g., in strategy calculations).
   */
  benefitOnDateOptimized(filingDate: MonthDate, atDate: MonthDate): Money {
    const filingAge = this.birthdate.ageAtSsaDate(filingDate);
    return this.benefitOnDateCore(filingDate, atDate, filingAge);
  }

  /**
   * Core benefit calculation logic shared between benefitOnDate variants.
   * Calculates delayed retirement credits based on filing date.
   */
  private benefitOnDateCore(
    filingDate: MonthDate,
    atDate: MonthDate,
    filingAge: MonthDuration
  ): Money {
    // If this is the year after filing, delayed credits are fully applied.
    if (filingDate.year() < atDate.year()) return this.benefitAtAge(filingAge);

    const normalRetirementDate: MonthDate = this.normalRetirementDate();

    // If you are filing before normal retirement, no delayed credits apply.
    if (filingDate.lessThanOrEqual(normalRetirementDate))
      return this.benefitAtAge(filingAge);

    // 70 is an explicit exception because the SSA likes to make my life harder.
    // Normally, you'd need to wait until the next year to get delayed credits,
    // but not if you file at exactly 70.
    if (filingAge.years() >= 70) return this.benefitAtAge(filingAge);

    // If you file in January, delayed credits are fully applied.
    if (filingDate.monthIndex() === 0) return this.benefitAtAge(filingAge);

    // Otherwise, you only get credits up to January of this year,
    // or NRA, whichever is later.
    const thisJan = MonthDate.initFromYearsMonths({
      years: filingDate.year(),
      months: 0,
    });

    const benefitComputationDate = normalRetirementDate.greaterThan(thisJan)
      ? normalRetirementDate
      : thisJan;

    return this.benefitAtAge(
      this.birthdate.ageAtSsaDate(benefitComputationDate)
    );
  }

  /**
   * @returns True if this recipient is eligible for spousal benefits.
   */
  eligibleForSpousalBenefit(spouse: Recipient): boolean {
    const piaAmount: Money = this.pia().primaryInsuranceAmount();
    const spousePiaAmount: Money = spouse.pia().primaryInsuranceAmount();

    return spousePiaAmount.div(2).greaterThan(piaAmount);
  }

  /**
   * Calculates the spousal benefit amount on a specific date based on filing
   * dates.
   *
   * It accounts for:
   * - The earnings relationship between spouses (higher vs lower earner)
   * - Whether the benefit start date has been reached
   * - Normal retirement age adjustments
   * - Early filing reductions (different rates for first 36 months vs beyond)
   * - Delayed retirement credits impact on spousal benefits
   *
   * @param {Recipient} spouse - The spouse (higher earner) whose record
   *                             provides the spousal benefit
   * @param {MonthDate} spouseFilingDate - The date when the higher-earning
   *                                       spouse files for benefits
   * @param {MonthDate} filingDate - The date when this recipient (lower
   *                                 earner) files for benefits
   * @param {MonthDate} atDate - The specific date for which to calculate the
   *                             benefit amount
   * @returns {Money} The calculated spousal benefit amount for the specified
   *                  date, reduced appropriately based on filing age relative
   *                  to normal retirement age.
   */
  spousalBenefitOnDateGivenStartDate(
    spouse: Recipient,
    spouseFilingDate: MonthDate,
    filingDate: MonthDate,
    atDate: MonthDate
  ): Money {
    // Calculate the starting date as the latest of the two filing dates:
    const startDate = spouseFilingDate.greaterThan(filingDate)
      ? spouseFilingDate
      : filingDate;

    // If the spouse has lower earnings, return $0:
    if (this.higherEarningsThan(spouse)) return Money.zero();

    // If the start date is in the future, return $0:
    if (startDate.greaterThan(atDate)) return Money.zero();

    const piaAmountCents: number = this.pia().primaryInsuranceAmount().cents();
    const spousePiaAmountCents: number = spouse
      .pia()
      .primaryInsuranceAmount()
      .cents();

    // Calculate the base spousal benefit amount:
    const spousalCents = spousePiaAmountCents / 2 - piaAmountCents;
    if (spousalCents <= 0) {
      return Money.zero();
    }

    const normalRetirementDate = this.normalRetirementDate();

    // Spousal Benefits start on after normal retirement date:
    if (startDate.greaterThanOrEqual(normalRetirementDate)) {
      if (filingDate.lessThanOrEqual(normalRetirementDate)) {
        return Money.fromCents(spousalCents).floorToDollar();
      }
      // https://www.bogleheads.org/forum/viewtopic.php?p=3986794#p3986794
      // https://secure.ssa.gov/apps10/poms.nsf/lnx/0300615694
      // The combined spousal and personal benefits cannot be greater than
      // 50% of the higher earner's PIA, except in the case where personal
      // benefits alone are higher than 50% of the higher earner's PIA.
      // The way this is computed is to reduce the spousal benefit if the sum
      // of the spousal and personal benefits exceeds 50% of the higher
      // earner's PIA.
      const personalBenefit = this.benefitOnDate(filingDate, atDate);
      const spouseBenefitCents =
        spousePiaAmountCents / 2 - personalBenefit.cents();
      if (spouseBenefitCents <= 0) {
        return Money.zero();
      } else {
        return Money.fromCents(spouseBenefitCents).floorToDollar();
      }
    }

    // Spousal Benefits start before normal retirement date:
    let monthsBeforeNra: number =
      normalRetirementDate.monthsSinceEpoch() - startDate.monthsSinceEpoch();
    if (monthsBeforeNra <= 36) {
      // 25 / 36 of one percent for each month:
      return Money.fromCents(
        spousalCents * (1 - monthsBeforeNra / 144)
      ).floorToDollar();
    } else {
      // 25% for the first 36 months:
      const firstReductionCents: number = spousalCents * 0.25;
      monthsBeforeNra = monthsBeforeNra - 36;
      // 5 / 12 of one percent for each additional month:
      const secondReductionCents: number =
        spousalCents * (monthsBeforeNra / 240);

      return Money.fromCents(
        spousalCents - firstReductionCents - secondReductionCents
      ).floorToDollar();
    }
  }

  /**
   * Returns the spousal and primary benefit on a given date for this recipient.
   */
  allBenefitsOnDate(
    spouse: Recipient,
    spouseFilingDate: MonthDate,
    filingDate: MonthDate,
    atDate: MonthDate
  ): Money {
    return this.benefitOnDate(filingDate, atDate).plus(
      this.spousalBenefitOnDateGivenStartDate(
        spouse,
        spouseFilingDate,
        filingDate,
        atDate
      )
    );
  }

  /**
   * Returns true if this recipient is the higher earner in the couple.
   */
  higherEarningsThan(other: Recipient): boolean {
    return this.pia()
      .primaryInsuranceAmount()
      .greaterThan(other.pia().primaryInsuranceAmount());
  }

  /**
   * Detemines the survivor benefit for this recipient.
   * @param deceased The deceased recipient.
   * @param deceasedFilingDate The date the deceased recipient filed for
   * benefits. If the deceased recipient did not file for benefits, use the
   * date of death or any date later.
   * @param deceasedDeathDate The date of death of the deceased recipient.
   * @param survivorFilingDate The date the survivor recipient filed for
   * survivor benefits.
   */
  survivorBenefit(
    deceased: Recipient,
    deceasedFilingDate: MonthDate,
    deceasedDeathDate: MonthDate,
    survivorFilingDate: MonthDate
  ): Money {
    // First calculate the base survivor benefit. There are two situations based
    // on if the deceased recipient filed for benefits before death or not.
    let baseSurvivorBenefit: Money;

    if (survivorFilingDate.lessThanOrEqual(deceasedDeathDate)) {
      throw new Error(
        `Cannot file for survivor benefits before spouse died: ` +
          `${survivorFilingDate.toString()} <= ${deceasedDeathDate.toString()}`
      );
    }

    if (deceasedFilingDate.greaterThanOrEqual(deceasedDeathDate)) {
      // If the deceased recipient did not file for benefits before death:
      if (deceasedDeathDate.lessThan(deceased.normalRetirementDate())) {
        // If the deceased died before Normal Retirement Age, the survivor
        // benefit is based on the deceased recipient's PIA.
        baseSurvivorBenefit = deceased.pia().primaryInsuranceAmount();
      } else {
        // If the deceased died after Normal Retirement Age, the survivor
        // benefit is based on the deceased recipient's benefit as though they
        // filed for benefits on the date of death.
        baseSurvivorBenefit = deceased.benefitOnDate(
          deceasedDeathDate,
          deceased.birthdate.dateAtSsaAge(
            MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
          )
        );
      }
    } else {
      // If the deceased recipient filed for benefits before death, then the base survivor benefit is the greater of the deceased recipient's benefit at the time of death or 82.5% of the deceased recipient's PIA.
      baseSurvivorBenefit = Money.max(
        deceased.pia().primaryInsuranceAmount().times(0.825),
        deceased.benefitOnDate(
          deceasedFilingDate,
          deceased.birthdate.dateAtSsaAge(
            MonthDuration.initFromYearsMonths({ years: 71, months: 0 })
          )
        )
      );
      baseSurvivorBenefit = Money.fromCents(
        Math.floor(baseSurvivorBenefit.cents())
      );
    }

    // Next, calculate the survivor benefit for the recipient based on the
    // survivor's age. If the survivor is at or above Full Retirement Age,
    // the survivor benefit is the base survivor benefit. If the survivor is
    // below Full Retirement Age, the survivor benefit is reduced based on the
    // survivor's age, adjusted proportionally between 71.5% and 100% of the
    // base amount based on the survivor's age between 60 and Full Retirement
    // Age.
    const survivorAgeAtFiling = this.birthdate.ageAtSsaDate(survivorFilingDate);
    if (
      survivorAgeAtFiling.greaterThanOrEqual(this.survivorNormalRetirementAge())
    ) {
      return baseSurvivorBenefit.floorToDollar();
    } else {
      const monthsBetween60AndNRA = this.survivorNormalRetirementAge()
        .subtract(MonthDuration.initFromYearsMonths({ years: 60, months: 0 }))
        .asMonths();
      const monthsBetweenAge60AndSurvivorAge = survivorAgeAtFiling
        .subtract(MonthDuration.initFromYearsMonths({ years: 60, months: 0 }))
        .asMonths();

      const reductionRatio = Math.max(
        0,
        monthsBetweenAge60AndSurvivorAge / monthsBetween60AndNRA
      );
      const minSurvivorBenefitRatio = 0.715;
      const survivorBenefit = baseSurvivorBenefit.times(
        minSurvivorBenefitRatio + (1 - minSurvivorBenefitRatio) * reductionRatio
      );
      return survivorBenefit.floorToDollar();
    }
  }

  /**
   * Returns a dark, medium, and light color for the recipient.
   * First and only recipients are orange, while second recipients are green.
   */
  colors(): RecipientColors {
    if (this.first) {
      return { dark: '#8d6100', medium: '#e69f00', light: '#f6dfad' };
    } else {
      return { dark: '#004400', medium: '#558855', light: '#d9ebd9' };
    }
  }

  /**
   * Serializes this recipient to a plain object for storage.
   */
  serialize(): SerializedRecipient {
    return {
      earningsRecords: this.earningsRecords.map((er) => er.serialize()),
      birthdate: this.birthdate.serialize(),
      name: this.name,
      isPiaOnly: this.isPiaOnly,
      overridePiaCents: this.overridePia?.cents() ?? null,
      gender: this.gender,
      healthMultiplier: this.healthMultiplier,
      isFirst: this.first,
    };
  }

  /**
   * Deserializes a plain object back to a Recipient.
   */
  static deserialize(data: SerializedRecipient): Recipient {
    const r = new Recipient();

    // Set birthdate first (needed for earnings record indexing)
    r.birthdate = Birthdate.deserialize(data.birthdate);

    if (data.isPiaOnly && data.overridePiaCents !== null) {
      r.setPia(Money.fromCents(data.overridePiaCents));
    } else {
      r.earningsRecords = data.earningsRecords.map((er) =>
        EarningRecord.deserialize(er)
      );
    }

    r.name = data.name;
    r.gender = data.gender as GenderOption;
    r.healthMultiplier = data.healthMultiplier;

    return r;
  }
} // class Recipient
