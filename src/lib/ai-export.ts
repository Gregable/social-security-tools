import { benefitAtAge } from '$lib/benefit-calculator';
import type { Birthdate } from '$lib/birthday';
import { MAX_COLA_YEAR, MAX_WAGE_INDEX_YEAR } from '$lib/constants';
import { MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { buildStrategyHash } from '$lib/url-params';

/**
 * Options for {@link buildCalculatorAiExport}.
 */
export interface CalculatorAiExportOptions {
  /**
   * Include the year-by-year taxed-earnings table. Defaults to true. Ignored
   * for PIA-only recipients (which have no earnings history).
   */
  includeEarnings?: boolean;
  /**
   * Base URL for the deep link back to the calculator. Defaults to the
   * production URL. Override for tests or alternate deployments.
   */
  baseUrl?: string;
  /**
   * A "generated on" date string (e.g. "2026-06-19") stamped into the header.
   * Injected by the caller so the builder stays pure and deterministic rather
   * than reading the system clock. Omitted means no generated-on line.
   */
  generatedDate?: string;
}

const DEFAULT_BASE_URL = 'https://ssa.tools/calculator';

/**
 * Formats a birthdate as an ISO `YYYY-MM-DD` string for the `dob1` URL
 * parameter (the format {@link buildStrategyHash} and the calculator's URL
 * hydration expect).
 */
function isoBirthdate(birthdate: Birthdate): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  // layBirthMonth() is 0-indexed (January = 0); the dob parameter is 1-indexed.
  const month = pad(birthdate.layBirthMonth() + 1);
  const day = pad(birthdate.layBirthDayOfMonth());
  return `${birthdate.layBirthYear()}-${month}-${day}`;
}

/**
 * Builds the deep link back to the calculator that reloads this recipient's
 * inputs. The link is PIA-based (the same approach as the strategy share link):
 * it carries the current-dollar PIA, so reopening it reconstructs the headline
 * numbers even though the raw earnings history is not encoded in the URL.
 */
function deepLink(recipient: Recipient, baseUrl: string): string {
  const pia = Math.round(recipient.pia().primaryInsuranceAmount().value());
  const hash = buildStrategyHash({
    isSingle: true,
    pia1: pia,
    dob1: isoBirthdate(recipient.birthdate),
    name1:
      recipient.name && recipient.name !== 'Self' ? recipient.name : undefined,
    gender1: recipient.gender,
  });
  return `${baseUrl}${hash}`;
}

function ageOf(years: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months: 0 });
}

/**
 * Describes the recipient's eligibility (40 work credits) so an AI assistant
 * understands a $0 PIA as "not yet eligible" rather than a calculation error.
 * Returns null for PIA-only recipients, who have no earnings/credit history.
 */
function eligibilityLine(recipient: Recipient): string | null {
  if (recipient.isPiaOnly) return null;
  const earned = recipient.earnedCredits();
  if (earned >= 40) {
    return '- Eligibility: 40 of 40 credits earned (eligible for retirement benefits).';
  }
  if (recipient.totalCredits() >= 40) {
    return `- Eligibility: ${earned} of 40 credits earned so far; projected to reach 40 and become eligible with future earnings.`;
  }
  return `- Eligibility: ${earned} of 40 credits earned — not yet eligible for retirement benefits, so the PIA and benefit estimates below remain $0 until 40 credits are earned.`;
}

/**
 * Builds a self-contained markdown snippet summarizing a calculator recipient's
 * Social Security situation, intended to be pasted into an AI assistant such as
 * Claude or ChatGPT. See issue #553.
 *
 * The function performs no I/O and transmits nothing; the caller copies the
 * returned string to the clipboard only when the user asks. The only formatted
 * "as of today" value (the generated-on header line) comes from
 * {@link CalculatorAiExportOptions.generatedDate} rather than the system clock,
 * so the snippet is stable to copy. (Benefit and PIA amounts still depend on
 * `constants.CURRENT_YEAR` via the default COLA cutoff, which is resolved once
 * at module load — the same values the calculator itself displays.)
 */
export function buildCalculatorAiExport(
  recipient: Recipient,
  options: CalculatorAiExportOptions = {}
): string {
  const includeEarnings = options.includeEarnings ?? true;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  const pia = recipient.pia();
  const fra = recipient.normalRetirementAge();
  const fraDate = recipient.normalRetirementDate();

  const sections: string[] = [];

  // --- Header ---
  const generated = options.generatedDate
    ? `_Generated ${options.generatedDate}. All amounts in today's dollars._`
    : "_All amounts in today's dollars._";
  sections.push(
    ['# Social Security benefit summary (from ssa.tools)', '', generated].join(
      '\n'
    )
  );

  // --- Inputs ---
  const inputs: string[] = [
    '## Inputs',
    '',
    `- Birthdate: ${recipient.birthdate.layBirthdateString()}`,
  ];
  if (recipient.isPiaOnly) {
    inputs.push(
      `- Primary Insurance Amount (PIA) entered directly: ${pia
        .primaryInsuranceAmount()
        .wholeDollars()} (no earnings history provided)`
    );
  } else if (includeEarnings && recipient.earningsRecords.length > 0) {
    inputs.push(
      '',
      '### Taxed earnings history',
      '',
      '| Year | Taxed earnings |',
      '| --- | --- |'
    );
    for (const record of recipient.earningsRecords) {
      inputs.push(
        `| ${record.year} | ${record.taxedEarnings.wholeDollars()} |`
      );
    }
  } else {
    inputs.push('- Earnings history omitted.');
  }
  sections.push(inputs.join('\n'));

  // --- Computed results ---
  const results: string[] = ['## Computed results', ''];
  const eligibility = eligibilityLine(recipient);
  if (eligibility) results.push(eligibility);
  results.push(
    `- Primary Insurance Amount (PIA): ${pia.primaryInsuranceAmount().wholeDollars()} / month`,
    `- Full Retirement Age (FRA): ${fra.toFullAgeString()} (reached ${fraDate.monthName()} ${fraDate.year()})`
  );
  if (!recipient.isPiaOnly) {
    results.push(
      `- Average Indexed Monthly Earnings (AIME): ${recipient
        .monthlyIndexedEarnings()
        .wholeDollars()} / month`
    );
  }
  results.push(
    '',
    'Estimated monthly benefit by filing age:',
    '',
    '| Filing age | Monthly benefit |',
    '| --- | --- |'
  );
  const benefitRows: Array<[string, MonthDuration]> = [
    ['62', ageOf(62)],
    [`FRA (${fra.toFullAgeString()})`, fra],
    ['70', ageOf(70)],
  ];
  for (const [label, filingAge] of benefitRows) {
    results.push(
      `| ${label} | ${benefitAtAge(recipient, filingAge).wholeDollars()} |`
    );
  }
  sections.push(results.join('\n'));

  // --- Methodology footnotes (the most important section for an AI: it pins
  //     which SSA constants produced these numbers, preventing the assistant
  //     from inventing different ones). ---
  const methodology: string[] = ['## Methodology', ''];
  if (recipient.isPiaOnly) {
    // The PIA was typed in directly, so the bend-point/COLA/wage-indexing
    // derivation does not apply; only the filing-age adjustments do.
    methodology.push(
      "- The Primary Insurance Amount was entered directly (in today's dollars), not derived from an earnings record, so bend points, wage indexing, and COLA assumptions do not apply."
    );
  } else {
    methodology.push(
      `- PIA uses the SSA bend-point formula wage-indexed to the eligibility year (${recipient.indexingYear()}): first bend point ${pia
        .firstBendPoint()
        .wholeDollars()}, second bend point ${pia.secondBendPoint().wholeDollars()}.`,
      `- Cost-of-living adjustments (COLA) are applied through ${MAX_COLA_YEAR} (the latest published COLA).`,
      `- Average-wage indexing uses national wage data through ${MAX_WAGE_INDEX_YEAR}.`
    );
  }
  methodology.push(
    '- Monthly benefit by filing age applies the standard early-filing reduction and delayed retirement credits to the PIA.',
    "- Figures are estimates in today's dollars and exclude spousal and survivor benefits, taxation, and Medicare premiums."
  );
  sections.push(methodology.join('\n'));

  // --- Deep link ---
  sections.push(
    [
      '## Recompute or adjust on ssa.tools',
      '',
      'Open this link to reload these inputs and explore filing ages, spousal, and survivor scenarios:',
      '',
      deepLink(recipient, baseUrl),
    ].join('\n')
  );

  // --- Caveats ---
  sections.push(
    [
      '## Caveats',
      '',
      '- ssa.tools runs entirely in your browser; none of your data is sent to a server. This summary exists only because you chose to copy it.',
      '- This is an educational estimate, not financial or legal advice.',
      '- An AI assistant can misinterpret Social Security rules; treat its answers as a starting point and verify against ssa.gov.',
    ].join('\n')
  );

  // --- Suggested follow-ups ---
  sections.push(
    [
      '## Suggested follow-up questions',
      '',
      '- How do spousal benefits change the best filing age?',
      '- What survivor benefit would my spouse receive?',
      '- How are these benefits taxed at the federal and state level?',
      '- How does Medicare enrollment timing interact with my filing date?',
    ].join('\n')
  );

  return `${sections.join('\n\n')}\n`;
}
