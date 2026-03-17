import { Birthdate, type SerializedBirthdate } from '$lib/birthday';
import * as constants from '$lib/constants';
import {
  EarningRecord,
  type SerializedEarningRecord,
} from '$lib/earning-record';
import { EarningsManager } from '$lib/earnings-manager';
import type { GenderOption } from '$lib/life-tables';
import { Money } from '$lib/money';
import { type MonthDate, MonthDuration } from '$lib/month-time';
import { PrimaryInsuranceAmount } from '$lib/pia';
import { type RecipientColors, recipientColors } from '$lib/recipient-colors';

export type { GenderOption };
export type { RecipientColors };

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
}

/**
 * A Recipient represents a Social Security benefit recipient.
 *
 * Holds domain data (name, birthdate, gender, earnings), retirement age
 * calculations, and implements the Svelte store contract for reactivity.
 *
 * Benefit calculations (benefitAtAge, benefitOnDate, spousal/survivor) live
 * in benefit-calculator.ts. Earnings indexing and top-35 computation live
 * in EarningsManager.
 */
export class Recipient {
  // ---------------------------------------------------------------------------
  // Health & Gender
  // ---------------------------------------------------------------------------

  /** Health multiplier to scale mortality q(x) values (0.7-2.5). */
  private healthMultiplier_: number = 1.0;
  get healthMultiplier(): number {
    return this.healthMultiplier_;
  }
  set healthMultiplier(multiplier: number) {
    // Clamp within supported UI range to avoid invalid inputs.
    // Intentionally silent on invalid input (NaN/Infinity): TypeScript enforces
    // the number type at compile time, so invalid values indicate a bug that
    // should be caught during development rather than at runtime.
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

  // ---------------------------------------------------------------------------
  // Svelte Store Contract (pub/sub)
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Name & Display
  // ---------------------------------------------------------------------------

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
   */
  shortName(length: number): string {
    if (this.name_.length <= length) return this.name_;
    return `${this.name_.substring(0, length - 1)}\u2026`;
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
   * Returns a dark, medium, and light color for the recipient.
   * Delegates to recipientColors from recipient-colors.ts.
   */
  colors(): RecipientColors {
    return recipientColors(this);
  }

  // ---------------------------------------------------------------------------
  // PIA-Only Mode
  // ---------------------------------------------------------------------------

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
      this.earnings_.earningsRecords.length > 0 ||
      this.earnings_.futureEarningsRecords.length > 0
    ) {
      throw new Error('Cannot set PIA when earnings records are present.');
    }
    this.isPiaOnly_ = true;
    this.overridePia_ = pia;
    this.publish_();
  }

  // ---------------------------------------------------------------------------
  // Earnings (delegated to EarningsManager)
  // ---------------------------------------------------------------------------

  private earnings_: EarningsManager = new EarningsManager();

  get earningsRecords(): Array<EarningRecord> {
    return this.earnings_.earningsRecords;
  }
  set earningsRecords(earningsRecords: Array<EarningRecord>) {
    this.requireNotPiaOnly_();
    this.earnings_.earningsRecords = earningsRecords;
    this.reindexEarnings_();
  }

  get futureEarningsRecords(): Array<EarningRecord> {
    return this.earnings_.futureEarningsRecords;
  }
  set futureEarningsRecords(futureEarningsRecords: Array<EarningRecord>) {
    this.requireNotPiaOnly_();
    this.earnings_.futureEarningsRecords = futureEarningsRecords;
    this.reindexEarnings_();
  }

  /**
   * Creates future earning records for the specified number of years.
   * @param numYears The number of years to simulate.
   * @param wage The wage to use for the simulation.
   */
  simulateFutureEarningsYears(numYears: number, wage: Money) {
    this.requireNotPiaOnly_();
    this.earnings_.simulateFutureEarningsYears(numYears, wage);
    this.reindexEarnings_();
  }

  /**
   * Calculates the start year for future earnings simulation.
   * @returns The year to start simulating future earnings from.
   */
  futureEarningsStartYear(): number {
    return this.earnings_.futureEarningsStartYear();
  }

  /**
   * Sets custom future earnings records directly.
   * Used when user manually edits individual year values.
   * @param records Array of {year, wage} objects.
   */
  setCustomFutureEarnings(records: Array<{ year: number; wage: Money }>) {
    this.requireNotPiaOnly_();
    this.earnings_.setCustomFutureEarnings(records);
    this.reindexEarnings_();
  }

  /**
   * Total indexed earnings over the top 35 years.
   */
  totalIndexedEarnings(): Money {
    this.requireNotPiaOnly_();
    return this.earnings_.totalIndexedEarnings();
  }

  /**
   * Monthly indexed earnings for the top 35 years of earnings.
   */
  monthlyIndexedEarnings(): Money {
    this.requireNotPiaOnly_();
    return this.earnings_.monthlyIndexedEarnings();
  }

  /**
   * Minimum indexed earnings needed to affect the top 35 years of earnings.
   * If fewer than 35 years of earnings, this is always 0.
   */
  cutoffIndexedEarnings(): Money {
    this.requireNotPiaOnly_();
    return this.earnings_.cutoffIndexedEarnings();
  }

  hasEarningsBefore1978(): boolean {
    this.requireNotPiaOnly_();
    return this.earnings_.hasEarningsBefore1978();
  }

  /**
   * Reindexes all earnings records after a change to records or birthdate.
   * Calls publish_() to notify subscribers.
   */
  private reindexEarnings_(): void {
    this.earnings_.reindex(this.indexingYear(), this.birthdate_.ssaBirthYear());
    this.publish_();
  }

  // ---------------------------------------------------------------------------
  // Credits & Eligibility
  // ---------------------------------------------------------------------------

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
    return this.earnings_.earnedCredits();
  }

  /**
   * The total number of credits the recipient has earned or will earn.
   */
  totalCredits(): number {
    if (this.isPiaOnly_) {
      return 40;
    }
    return this.earnings_.totalCredits();
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
    return this.earnings_.isEligible();
  }

  // ---------------------------------------------------------------------------
  // Birthdate & Retirement Age
  // ---------------------------------------------------------------------------

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
    // Reindex earnings for the new birthdate (which changes indexingYear).
    if (!this.isPiaOnly_) {
      this.earnings_.reindex(
        this.indexingYear(),
        this.birthdate_.ssaBirthYear()
      );
    }

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

    this.publish_();
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

  // ---------------------------------------------------------------------------
  // Indexing & PIA
  // ---------------------------------------------------------------------------

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
   * The Primary Insurance Amount (PIA) for this recipient.
   */
  pia(): PrimaryInsuranceAmount {
    return new PrimaryInsuranceAmount(this);
  }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /**
   * Serializes this recipient to a plain object for storage.
   */
  serialize(): SerializedRecipient {
    return {
      earningsRecords: this.earnings_.serializeEarnings(),
      birthdate: this.birthdate.serialize(),
      name: this.name,
      isPiaOnly: this.isPiaOnly,
      overridePiaCents: this.overridePia?.cents() ?? null,
      gender: this.gender,
      healthMultiplier: this.healthMultiplier,
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
    const validGenders: readonly string[] = ['male', 'female', 'blended'];
    if (!validGenders.includes(data.gender)) {
      console.warn(
        `Invalid gender "${data.gender}" in session data, defaulting to "blended".`
      );
    }
    r.gender = validGenders.includes(data.gender)
      ? (data.gender as GenderOption)
      : 'blended';
    r.healthMultiplier = data.healthMultiplier;

    return r;
  }
} // class Recipient
