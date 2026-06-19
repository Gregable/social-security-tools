import {
  benefitAtAge,
  eligibleForSpousalBenefit,
  spousalBenefitOnDate,
  survivorBenefit,
} from '$lib/benefit-calculator';
import type { Birthdate } from '$lib/birthday';
import {
  AFTER_BENDPOINT2_MULTIPLIER,
  BEFORE_BENDPOINT1_MULTIPLIER,
  BEFORE_BENDPOINT2_MULTIPLIER,
  MAX_COLA_YEAR,
  MAX_WAGE_INDEX_YEAR,
} from '$lib/constants';
import { MonthDuration } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { buildStrategyHash, type Gender } from '$lib/url-params';

/**
 * Options for the AI-export builders.
 */
export interface CalculatorAiExportOptions {
  /**
   * Base URL for the deep link back to the calculator. Defaults to the
   * production URL. Override for tests or alternate deployments.
   */
  baseUrl?: string;
  /**
   * A "generated on" date string (e.g. "2026-06-18") stamped into the header.
   * Injected by the caller so the builder stays deterministic rather than
   * reading the system clock. Omitted means no generated-on line.
   *
   * The caller is responsible for formatting a local-time date — do not derive
   * this from `new Date().toISOString()`, whose UTC value can be a day off.
   */
  generatedDate?: string;
}

const DEFAULT_BASE_URL = 'https://ssa.tools/calculator';

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

type Align = 'left' | 'right' | 'center';

/**
 * Renders an aligned GitHub-flavored markdown table. Cells are padded to a
 * fixed column width so the table also lines up when read as plain monospace
 * text (e.g. before an AI renders the markdown). Exported for unit testing.
 */
export function renderTable(
  headers: string[],
  rows: string[][],
  aligns: Align[]
): string {
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => row[i].length))
  );

  const padCell = (text: string, width: number, align: Align): string => {
    if (align === 'right') return text.padStart(width);
    if (align === 'center') {
      const total = width - text.length;
      const left = Math.floor(total / 2);
      return ' '.repeat(left) + text + ' '.repeat(total - left);
    }
    return text.padEnd(width);
  };

  const sepCell = (width: number, align: Align): string => {
    // Clamp the dash count so very narrow columns can't make repeat() throw.
    if (align === 'right') return `${'-'.repeat(Math.max(1, width - 1))}:`;
    if (align === 'center')
      return width < 2
        ? '-'.repeat(Math.max(1, width))
        : `:${'-'.repeat(width - 2)}:`;
    return '-'.repeat(Math.max(1, width));
  };

  const line = (cells: string[]): string => `| ${cells.join(' | ')} |`;

  return [
    line(headers.map((h, i) => padCell(h, widths[i], aligns[i]))),
    line(widths.map((w, i) => sepCell(w, aligns[i]))),
    ...rows.map((row) =>
      line(row.map((cell, i) => padCell(cell, widths[i], aligns[i])))
    ),
  ].join('\n');
}

/** Formats a fraction (e.g. 0.32) as a percent string (e.g. "32%"). */
function asPercent(fraction: number): string {
  return `${+(fraction * 100).toFixed(2)}%`;
}

/** Formats a birthdate as an ISO `YYYY-MM-DD` string for the `dob` URL param. */
function isoBirthdate(birthdate: Birthdate): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  // layBirthMonth() is 0-indexed (January = 0); the dob parameter is 1-indexed.
  const month = pad(birthdate.layBirthMonth() + 1);
  const day = pad(birthdate.layBirthDayOfMonth());
  return `${birthdate.layBirthYear()}-${month}-${day}`;
}

function piaParam(recipient: Recipient): number {
  return Math.round(recipient.pia().primaryInsuranceAmount().value());
}

function nameParam(name: string, defaultName: string): string | undefined {
  return name && name !== defaultName ? name : undefined;
}

// ---------------------------------------------------------------------------
// Per-recipient sections (reused by the single and couple exports)
// ---------------------------------------------------------------------------

/** Eligibility: 40 work credits, with a year-by-year breakdown until reached. */
function eligibilitySection(recipient: Recipient): string {
  const lines = [
    '## Eligibility',
    '',
    'Retirement benefits require 40 Social Security credits (up to 4 per year).',
  ];

  const earned = recipient.earnedCredits();
  if (earned >= 40) {
    lines.push('Status: 40 of 40 credits earned — eligible.');
  } else if (recipient.totalCredits() >= 40) {
    lines.push(
      `Status: ${earned} of 40 credits earned so far — projected to reach 40 with future earnings.`
    );
  } else {
    lines.push(
      `Status: ${earned} of 40 credits earned — NOT yet eligible. Benefit estimates remain $0 until 40 credits are earned.`
    );
  }

  // Year-by-year credits, stopping once 40 are reached (the rest do not matter
  // for eligibility).
  const rows: string[][] = [];
  let cumulative = 0;
  for (const record of recipient.earningsRecords) {
    if (cumulative >= 40) break;
    cumulative = Math.min(40, cumulative + record.credits());
    rows.push([
      String(record.year),
      record.taxedEarnings.wholeDollars(),
      String(record.credits()),
      String(cumulative),
    ]);
  }
  if (rows.length > 0) {
    lines.push(
      '',
      renderTable(['Year', 'Taxed earnings', 'Credits', 'Cumulative'], rows, [
        'left',
        'right',
        'right',
        'right',
      ])
    );
  }

  return lines.join('\n');
}

/** AIME: the indexed-earnings table (top 35) and the averaging formula. */
function aimeSection(recipient: Recipient): string {
  const lines = [
    '## Average Indexed Monthly Earnings (AIME)',
    '',
    'The AIME is the monthly average of the highest 35 years of earnings, each',
    'adjusted for national wage growth, then averaged over 420 months.',
    '',
    'For each year:',
    '',
    '    indexed earnings = capped taxed earnings × index factor',
    '',
    '    index factor = (average wage index for the year you turn 60)',
    '                   ÷ (average wage index for the earning year)',
    '',
    'The index factor is 1.0 for the year you turn 60 and every year after, so',
    'later earnings are counted at face value. "Capped" means earnings above the',
    "Social Security taxable maximum for that year don't count.",
    '',
  ];

  const rows = recipient.earningsRecords.map((record) => [
    String(record.year),
    record.taxedEarnings.wholeDollars(),
    record.indexFactor().toFixed(4),
    record.indexedEarnings().wholeDollars(),
    record.isTop35EarningsYear ? 'yes' : 'no',
  ]);
  lines.push(
    renderTable(
      ['Year', 'Taxed earnings', 'Index factor', 'Indexed earnings', 'Top 35'],
      rows,
      ['left', 'right', 'right', 'right', 'center']
    )
  );

  const total = recipient.totalIndexedEarnings();
  const aime = recipient.monthlyIndexedEarnings();
  lines.push(
    '',
    `AIME = (sum of the top 35 indexed earnings) / 35 years / 12 months`,
    `     = ${total.wholeDollars()} / 420`,
    `     = ${aime.wholeDollars()} / month`
  );

  return lines.join('\n');
}

/** PIA: the worked bend-point formula applied to the AIME. */
function piaSection(recipient: Recipient): string {
  const pia = recipient.pia();
  const aime = recipient.monthlyIndexedEarnings();
  const bend1 = pia.firstBendPoint();
  const bend2 = pia.secondBendPoint();

  const rows = [
    [
      `${asPercent(BEFORE_BENDPOINT1_MULTIPLIER)} of AIME up to ${bend1.wholeDollars()}`,
      pia.primaryInsuranceAmountByBracket(0).string(),
    ],
    [
      `${asPercent(BEFORE_BENDPOINT2_MULTIPLIER)} of AIME between ${bend1.wholeDollars()} and ${bend2.wholeDollars()}`,
      pia.primaryInsuranceAmountByBracket(1).string(),
    ],
    [
      `${asPercent(AFTER_BENDPOINT2_MULTIPLIER)} of AIME above ${bend2.wholeDollars()}`,
      pia.primaryInsuranceAmountByBracket(2).string(),
    ],
    [
      'Total (rounded down to the dime)',
      pia.primaryInsuranceAmountUnadjusted().string(),
    ],
  ];

  return [
    '## Primary Insurance Amount (PIA)',
    '',
    `The PIA applies the SSA bend-point formula to the AIME (${aime.wholeDollars()}).`,
    `Bend points for the eligibility year (${recipient.indexingYear()}) are ${bend1.wholeDollars()} and ${bend2.wholeDollars()}.`,
    '',
    renderTable(['Bracket', 'Amount'], rows, ['left', 'right']),
    '',
    `After cost-of-living adjustments (COLA) applied through ${MAX_COLA_YEAR}, the`,
    `final PIA is ${pia.primaryInsuranceAmount().wholeDollars()} / month.`,
    '',
    'Note: the PIA is rounded down to the dime; monthly benefits are rounded',
    'down to the dollar. Wage indexing uses data through ' +
      `${MAX_WAGE_INDEX_YEAR}.`,
  ].join('\n');
}

/** Explains the early-filing reduction and delayed retirement credits. */
function filingRulesSection(recipient: Recipient): string {
  const fra = recipient.normalRetirementAge();
  const fraDate = recipient.normalRetirementDate();
  const dri = recipient.delayedRetirementIncrease();

  return [
    '## Filing age adjustments',
    '',
    `Full Retirement Age (FRA): ${fra.toFullAgeString()} (reached ${fraDate.monthName()} ${fraDate.year()}).`,
    'Your monthly benefit is your PIA adjusted for when you file relative to FRA:',
    '',
    '- Filing before FRA reduces the benefit: 5/9 of 1% per month (about',
    '  0.556%/mo, 6.67%/yr) for the first 36 months early, then 5/12 of 1% per',
    '  month (about 0.417%/mo, 5%/yr) for each earlier month beyond 36.',
    `- Filing after FRA adds delayed retirement credits of ${asPercent(dri)} per year`,
    '  (2/3 of 1% per month), up to age 70.',
    '- Delayed retirement credits do not take effect until January of the',
    '  following year — except at age 70, which receives them immediately. So',
    '  someone who files mid-year may see their benefit step up the next January.',
  ].join('\n');
}

/** Month-by-month benefit for every filing age from the earliest through 70. */
function benefitByMonthSection(recipient: Recipient): string {
  const start = recipient.birthdate.earliestFilingMonth().asMonths();
  const end = 70 * 12;

  const rows: string[][] = [];
  for (let m = start; m <= end; m++) {
    const age = new MonthDuration(m);
    rows.push([
      `${age.years()}y ${age.modMonths()}m`,
      benefitAtAge(recipient, age).wholeDollars(),
    ]);
  }

  return [
    '## Monthly benefit by filing age',
    '',
    "Estimated monthly benefit (today's dollars) if you start benefits at each",
    'age. This is the eventual steady-state amount; see the January rule above',
    'for the first-year timing of delayed credits.',
    '',
    renderTable(['Filing age', 'Monthly benefit'], rows, ['left', 'right']),
  ].join('\n');
}

/**
 * Returns the ordered markdown sections describing one recipient. PIA-only
 * recipients skip the earnings-derived sections (eligibility, AIME, PIA
 * formula), since their PIA was entered directly.
 */
function recipientSections(recipient: Recipient): string[] {
  const pia = recipient.pia();
  const sections: string[] = [];

  if (recipient.isPiaOnly) {
    sections.push(
      [
        '## Primary Insurance Amount (PIA)',
        '',
        `The PIA was entered directly: ${pia.primaryInsuranceAmount().wholeDollars()} / month`,
        "(in today's dollars). It was not derived from an earnings record, so",
        'bend points, wage indexing, and COLA assumptions do not apply.',
      ].join('\n')
    );
  } else {
    sections.push(
      eligibilitySection(recipient),
      aimeSection(recipient),
      piaSection(recipient)
    );
  }
  sections.push(
    filingRulesSection(recipient),
    benefitByMonthSection(recipient)
  );
  return sections;
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

function header(title: string, generatedDate?: string): string {
  const lines = [title, ''];
  lines.push(
    generatedDate
      ? `_Generated ${generatedDate}. All amounts in today's dollars unless noted._`
      : "_All amounts in today's dollars unless noted._"
  );
  return lines.join('\n');
}

function recipientDeepLink(recipient: Recipient, baseUrl: string): string {
  const hash = buildStrategyHash({
    isSingle: true,
    pia1: piaParam(recipient),
    dob1: isoBirthdate(recipient.birthdate),
    name1: nameParam(recipient.name, 'Self'),
    gender1: recipient.gender as Gender,
  });
  return `${baseUrl}${hash}`;
}

function deepLinkSection(url: string): string {
  return [
    '## Recompute or adjust on ssa.tools',
    '',
    'Open this link to reload these inputs and explore other filing ages:',
    '',
    url,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Embeddable interactive charts (the /embed/* routes added in PR #557)
// ---------------------------------------------------------------------------

const EMBED_BASE = 'https://ssa.tools/embed';

/** Encodes a recipient's earnings history as the `earnings1` URL parameter. */
function earningsParam(recipient: Recipient): string {
  return recipient.earningsRecords
    .map((r) => `${r.year}:${Math.round(r.taxedEarnings.value())}`)
    .join(',');
}

/** A markdown link plus a ready-to-paste iframe snippet for one embed widget. */
function embedEntry(label: string, hash: string, route: string): string[] {
  const url = `${EMBED_BASE}/${route}${hash}`;
  return [
    `### ${label}`,
    '',
    url,
    '',
    '```html',
    `<iframe src="${url}" width="100%" height="480" style="border:0" loading="lazy"></iframe>`,
    '```',
  ];
}

/**
 * The `&name1=...` URL segment for an embed, or '' for the default placeholder
 * names. The embed routes display this name (e.g. on the filing-age chart).
 */
function embedNameParam(name: string): string {
  return name && name !== 'Self' && name !== 'Spouse'
    ? `&name1=${encodeURIComponent(name)}`
    : '';
}

/** Per-recipient embeds: filing-age (PIA based), plus earnings-based charts. */
function recipientEmbeds(recipient: Recipient, prefix = ''): string[] {
  const pia = piaParam(recipient);
  const dob = isoBirthdate(recipient.birthdate);
  const name = embedNameParam(recipient.name);
  const piaHash = `#pia1=${pia}&dob1=${dob}${name}`;
  const entries: string[][] = [
    embedEntry(`${prefix}Filing-age benefit chart`, piaHash, 'filing-age'),
  ];
  // indexed-earnings and bend-points require the full earnings history.
  if (!recipient.isPiaOnly && recipient.earningsRecords.length > 0) {
    const earnHash = `#earnings1=${earningsParam(recipient)}&dob1=${dob}${name}`;
    entries.push(
      embedEntry(`${prefix}Indexed earnings`, earnHash, 'indexed-earnings'),
      embedEntry(`${prefix}Bend points`, earnHash, 'bend-points')
    );
  }
  return entries.flatMap((e) => ['', ...e]);
}

function embedsSection(body: string[]): string {
  return [
    '## Interactive charts (embeddable)',
    '',
    'These ssa.tools widgets render this data interactively and can be embedded',
    'in a web page with the iframe snippet shown (adjust width/height to taste):',
    ...body,
  ].join('\n');
}

/**
 * Builds a self-contained markdown snippet summarizing one calculator
 * recipient's full Social Security derivation (eligibility, AIME, PIA,
 * filing-age rules, and a month-by-month benefit table), intended to be pasted
 * into an AI assistant. See issue #553.
 *
 * The builder reads no clock; the only "as of today" value is the optional,
 * injected `generatedDate`. Benefit and PIA amounts match what the calculator
 * displays (they depend on `constants.CURRENT_YEAR` via the default COLA
 * cutoff, resolved once at module load).
 */
export function buildCalculatorAiExport(
  recipient: Recipient,
  options: CalculatorAiExportOptions = {}
): string {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  const sections: string[] = [
    header(
      '# Social Security benefit summary (from ssa.tools)',
      options.generatedDate
    ),
    [
      '## Inputs',
      '',
      `- Birthdate: ${recipient.birthdate.layBirthdateString()}`,
    ].join('\n'),
    ...recipientSections(recipient),
    embedsSection(recipientEmbeds(recipient)),
    deepLinkSection(recipientDeepLink(recipient, baseUrl)),
  ];

  return `${sections.join('\n\n')}\n`;
}

// ---------------------------------------------------------------------------
// Couple export
// ---------------------------------------------------------------------------

function coupleDeepLink(
  recipient: Recipient,
  spouse: Recipient,
  baseUrl: string
): string {
  const hash = buildStrategyHash({
    isSingle: false,
    pia1: piaParam(recipient),
    dob1: isoBirthdate(recipient.birthdate),
    name1: nameParam(recipient.name, 'Self'),
    gender1: recipient.gender as Gender,
    pia2: piaParam(spouse),
    dob2: isoBirthdate(spouse.birthdate),
    name2: nameParam(spouse.name, 'Spouse'),
    gender2: spouse.gender as Gender,
  });
  return `${baseUrl}${hash}`;
}

function displayName(recipient: Recipient, fallback: string): string {
  return recipient.name && recipient.name !== fallback
    ? recipient.name
    : fallback;
}

/**
 * Spousal top-up by the lower earner's claiming age, isolating the early-filing
 * reduction. The higher earner is assumed to have already filed (otherwise no
 * spousal benefit is payable yet), so the only variable is the lower earner's
 * own claiming age.
 */
function spousalClaimingTable(higher: Recipient, lower: Recipient): string {
  const fraMonths = lower.normalRetirementAge().asMonths();
  const earliest = lower.birthdate.earliestFilingMonth().asMonths();
  const candidates = [earliest, 64 * 12, 66 * 12, fraMonths];
  const ageMonths = [...new Set(candidates)]
    .filter((m) => m >= earliest && m <= fraMonths)
    .sort((a, b) => a - b);

  const rows = ageMonths.map((m) => {
    const age = new MonthDuration(m);
    const filing = lower.birthdate.dateAtSsaAge(age);
    // spouseFilingDate = filing treats the higher earner as already filed by
    // the time the lower earner claims, so the amount reflects only the lower
    // earner's reduction.
    const benefit = spousalBenefitOnDate(lower, higher, filing, filing, filing);
    return [`${age.years()}y ${age.modMonths()}m`, benefit.wholeDollars()];
  });
  return renderTable(
    ['Lower earner files at', 'Spousal top-up / month'],
    rows,
    ['left', 'right']
  );
}

/**
 * Spousal benefits: eligibility, the 50%-of-higher-PIA formula, the early-filing
 * reduction, and a claiming-age table. The lower earner is the one who can
 * receive a spousal top-up.
 */
function spousalSection(higher: Recipient, lower: Recipient): string {
  const higherName = displayName(higher, 'the higher earner');
  const lowerName = displayName(lower, 'the lower earner');
  const higherPia = higher.pia().primaryInsuranceAmount();
  const lowerPia = lower.pia().primaryInsuranceAmount();

  const lines = ['## Spousal benefits', ''];
  if (!eligibleForSpousalBenefit(lower, higher)) {
    lines.push(
      `Neither partner qualifies for a spousal top-up: half of ${higherName}'s`,
      `PIA (${higherPia.times(0.5).wholeDollars()}) does not exceed ${lowerName}'s own PIA`,
      `(${lowerPia.wholeDollars()}). The lower earner simply takes their own benefit.`
    );
    return lines.join('\n');
  }

  lines.push(
    `${lowerName} can receive a spousal top-up on top of their own benefit.`,
    '',
    'How it works:',
    '',
    `- At full retirement age the spousal benefit equals 50% of ${higherName}'s`,
    `  PIA (${higherPia.wholeDollars()}) minus ${lowerName}'s own PIA (${lowerPia.wholeDollars()}):`,
    `  ${higherPia.times(0.5).wholeDollars()} - ${lowerPia.wholeDollars()} = ${higherPia.times(0.5).sub(lowerPia).wholeDollars()} / month.`,
    `- It is based on ${higherName}'s PIA, not their actual (delayed or reduced)`,
    `  benefit, and ${higherName} must have filed before ${lowerName} can collect it.`,
    '- Claiming before FRA reduces the spousal benefit by 25/36 of 1% per month',
    '  for the first 36 months, then 5/12 of 1% per month earlier than that.',
    '- Unlike a retirement benefit, a spousal benefit earns NO delayed retirement',
    '  credits — it is largest at full retirement age and does not grow past it.',
    '',
    spousalClaimingTable(higher, lower)
  );
  return lines.join('\n');
}

/**
 * Survivor benefits: the up-to-100% rule, the widow(er)'s-limit (82.5%) floor,
 * the separate survivor FRA, the 71.5%-at-60 reduction, switching strategies,
 * and an illustrative computed amount.
 */
function survivorSection(higher: Recipient, lower: Recipient): string {
  const higherName = displayName(higher, 'the higher earner');
  const lowerName = displayName(lower, 'the survivor');
  const higherPia = higher.pia().primaryInsuranceAmount();
  const survivorFra = lower.survivorNormalRetirementAge();

  // Illustrative: higher earner files at FRA and dies at 80; survivor claims at
  // or after their survivor FRA (so unreduced).
  const deceasedFiling = higher.normalRetirementDate();
  const deathDate = higher.birthdate.dateAtSsaAge(
    MonthDuration.initFromYearsMonths({ years: 80, months: 0 })
  );
  const claimEarliest = deathDate.addDuration(new MonthDuration(1));
  const survivorFraDate = lower.survivorNormalRetirementDate();
  const survivorFiling =
    survivorFraDate.monthsSinceEpoch() >= claimEarliest.monthsSinceEpoch()
      ? survivorFraDate
      : claimEarliest;
  const illustrative = survivorBenefit(
    lower,
    higher,
    deceasedFiling,
    deathDate,
    survivorFiling
  );

  return [
    '## Survivor benefits',
    '',
    `If ${higherName} dies first, ${lowerName} can claim a survivor benefit, which`,
    'replaces (does not add to) their own retirement benefit. Key rules:',
    '',
    `- The survivor benefit can be as high as 100% of what ${higherName} was`,
    `  actually receiving, INCLUDING any delayed retirement credits ${higherName}`,
    `  earned by waiting past FRA. So delaying the higher earner's own filing also`,
    '  raises the survivor benefit — often the most valuable reason to delay.',
    `- If ${higherName} had already filed at death, the survivor benefit is the`,
    `  larger of ${higherName}'s own benefit or 82.5% of ${higherName}'s PIA (the`,
    `  "widow(er)'s limit", or RIB-LIM). This 82.5% floor only matters when`,
    `  ${higherName} had reduced their benefit by filing early. For ${higherName},`,
    `  82.5% of PIA = ${higherPia.times(0.825).wholeDollars()}.`,
    `- Survivor benefits use a separate survivor full retirement age`,
    `  (${lowerName}'s is ${survivorFra.toFullAgeString()}), which can be earlier than the`,
    '  retirement FRA. Claiming before it reduces the benefit proportionally, down',
    '  to 71.5% at age 60; there are no delayed credits past survivor FRA.',
    `- ${lowerName} can take one benefit first and switch later — e.g. claim the`,
    '  survivor benefit while letting their own retirement benefit grow to age 70,',
    '  then switch (or vice versa). The ssa.tools strategy tool models this.',
    '',
    `Illustrative: ${higherName} files at FRA and dies at 80, ${lowerName} claims at`,
    `or after survivor FRA -> ${illustrative.wholeDollars()} / month (about 100% of`,
    `${higherName}'s benefit).`,
  ].join('\n');
}

/**
 * Builds a couple's combined markdown export: each partner's full derivation
 * followed by the spousal and survivor interactions. See issue #553.
 */
export function buildCoupleCalculatorAiExport(
  recipient: Recipient,
  spouse: Recipient,
  options: CalculatorAiExportOptions = {}
): string {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;

  // Order higher/lower earner by PIA for the spousal/survivor framing.
  const recipientPia = recipient.pia().primaryInsuranceAmount().value();
  const spousePia = spouse.pia().primaryInsuranceAmount().value();
  const [higher, lower] =
    recipientPia >= spousePia ? [recipient, spouse] : [spouse, recipient];

  const personSection = (person: Recipient, fallback: string): string => {
    const name = displayName(person, fallback);
    return [
      `# ${name}`,
      `- Birthdate: ${person.birthdate.layBirthdateString()}`,
      '',
      recipientSections(person).join('\n\n'),
    ].join('\n');
  };

  const sections: string[] = [
    header(
      '# Social Security benefit summary for a couple (from ssa.tools)',
      options.generatedDate
    ),
    personSection(recipient, 'Person 1'),
    personSection(spouse, 'Person 2'),
    spousalSection(higher, lower),
    survivorSection(higher, lower),
    embedsSection(coupleEmbeds(recipient, spouse)),
    deepLinkSection(coupleDeepLink(recipient, spouse, baseUrl)),
  ];

  return `${sections.join('\n\n')}\n`;
}

/** The `&name1=`/`&name2=` segments for a couple embed (placeholders omitted). */
function coupleNameParams(recipient: Recipient, spouse: Recipient): string {
  const n1 = nameParam(recipient.name, 'Self');
  const n2 = nameParam(spouse.name, 'Spouse');
  return (
    (n1 ? `&name1=${encodeURIComponent(n1)}` : '') +
    (n2 ? `&name2=${encodeURIComponent(n2)}` : '')
  );
}

/** Couple embeds: the couple filing-age chart plus each partner's own charts. */
function coupleEmbeds(recipient: Recipient, spouse: Recipient): string[] {
  const coupleHash =
    `#pia1=${piaParam(recipient)}&dob1=${isoBirthdate(recipient.birthdate)}` +
    `&pia2=${piaParam(spouse)}&dob2=${isoBirthdate(spouse.birthdate)}` +
    coupleNameParams(recipient, spouse);
  return [
    '',
    ...embedEntry('Couple filing-age chart', coupleHash, 'filing-age-couple'),
    ...recipientEmbeds(recipient, `${displayName(recipient, 'Person 1')}: `),
    ...recipientEmbeds(spouse, `${displayName(spouse, 'Person 2')}: `),
  ];
}
