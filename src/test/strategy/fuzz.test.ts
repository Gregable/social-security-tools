import { describe, it, expect } from 'vitest';
import {
  optimalStrategy,
  optimalStrategyOptimized,
} from '$lib/strategy/calculations/strategy-calc';
import { Recipient } from '$lib/recipient';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Money } from '$lib/money';
import { PrimaryInsuranceAmount } from '$lib/pia';
import { EarningRecord } from '$lib/earning-record';
import { Birthdate } from '$lib/birthday';

// Helper function to generate a random number within a range
function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Helper function to generate a random integer within a range
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to create a mock PrimaryInsuranceAmount object with a specific primaryInsuranceAmount
function createMockPia(piaCents: number): PrimaryInsuranceAmount {
  const mockPia = {
    primaryInsuranceAmount: () => Money.fromCents(piaCents),
  } as PrimaryInsuranceAmount; // Cast to PrimaryInsuranceAmount to satisfy type checking
  return mockPia;
}

// Helper to create a Recipient with a controlled PIA
function createFuzzRecipient(
  currentDate: MonthDate,
  minAge: number,
  maxAge: number,
  minPia: number,
  maxPia: number
): Recipient {
  const randomAgeInMonths = getRandomInt(minAge * 12, maxAge * 12);
  const birthMonthDate = currentDate.subtractDuration(
    new MonthDuration(randomAgeInMonths)
  );
  // Convert MonthDate to Birthdate
  const birthdate = Birthdate.FromYMD(
    birthMonthDate.year(),
    birthMonthDate.monthIndex(),
    1
  );

  // Create a dummy earning record
  const dummyEarningRecord = new EarningRecord({
    year: 2000,
    taxedEarnings: Money.from(0),
    taxedMedicareEarnings: Money.from(0),
  });

  const recipient = new Recipient();
  recipient.birthdate = birthdate;
  recipient.gender = 'male'; // Using 'male' as per GenderOption type
  recipient.earningsRecords = [dummyEarningRecord]; // Set earnings records

  // Override the pia() method to return a controlled PIA
  const randomPiaCents = getRandomInt(minPia * 100, maxPia * 100);
  (recipient as any).pia = () => createMockPia(randomPiaCents);

  return recipient;
}

describe('Optimal Strategy Fuzz Test', () => {
  const NUM_ITERATIONS = 100000;
  const currentDate = MonthDate.initFromYearsMonths({ years: 2025, months: 7 }); // Fixed current date

  it(`should produce the same result for optimalStrategy and optimalStrategyOptimized over ${NUM_ITERATIONS} iterations`, async () => {
    for (let i = 0; i < NUM_ITERATIONS; i++) {
      // Generate random recipients
      const recipient1 = createFuzzRecipient(currentDate, 50, 80, 0, 4000);
      const recipient2 = createFuzzRecipient(currentDate, 50, 80, 0, 4000);
      const recipients: [Recipient, Recipient] = [recipient1, recipient2];

      // Generate random final dates
      const finalDate1Age = getRandomInt(62, 120);
      const finalDate1 = recipient1.birthdate.dateAtSsaAge(
        new MonthDuration(finalDate1Age * 12)
      );
      const finalDate2Age = getRandomInt(62, 120);
      const finalDate2 = recipient2.birthdate.dateAtSsaAge(
        new MonthDuration(finalDate2Age * 12)
      );
      const finalDates: [MonthDate, MonthDate] = [finalDate1, finalDate2];

      // Generate random discount rate
      const discountRate = getRandomNumber(0.01, 0.07); // 1% to 7%

      // Run both optimal strategy functions
      const resultOriginal = optimalStrategy(
        recipients,
        finalDates,
        currentDate,
        discountRate
      );
      const resultOptimized = optimalStrategyOptimized(
        recipients,
        finalDates,
        currentDate,
        discountRate
      );

      // Compare results
      const [strat0Original, strat1Original, outcomeOriginal] = resultOriginal;
      const [strat0Optimized, strat1Optimized, outcomeOptimized] =
        resultOptimized;

      // Expect filing ages to be the same
      expect(
        strat0Original.asMonths(),
        `Iteration ${i}: Recipient 0 strategy mismatch`
      ).toBe(strat0Optimized.asMonths());
      expect(
        strat1Original.asMonths(),
        `Iteration ${i}: Recipient 1 strategy mismatch`
      ).toBe(strat1Optimized.asMonths());

      // Expect outcomes to be very close (due to potential floating point differences)
      // Using a small epsilon for comparison
      const epsilon = 0.01; // 1 cent difference allowed
      expect(outcomeOriginal, `Iteration ${i}: Outcome mismatch`).toBeCloseTo(
        outcomeOptimized,
        epsilon
      );
    }
  }, 600000); // timeout of 10 minutes
});
