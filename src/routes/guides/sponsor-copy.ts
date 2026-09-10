import { DEFAULT_SPONSOR_COPY, type SponsorCopy } from '$lib/sponsor';

/**
 * Guide-specific pitches for the inline sponsor placement, keyed by guide
 * slug. Every guide mapped to the `sponsor` CTA in guide-cta-config.ts
 * should appear here so its ad picks up where the surrounding prose left
 * off rather than restarting with a generic "still weighing when to file".
 *
 * SponsorAd renders `intro`, the sponsor name, and `outro` as a single
 * sentence, so `intro` has to lead into the name (it normally ends in
 * "at") and `outro` carries the closing period. Bullets are hidden on
 * mobile, so the sentence must stand on its own.
 *
 * The pitch should name something the guide just established that a person
 * can help with, and should not promise anything the sponsor cannot do.
 */
export const GUIDE_SPONSOR_COPY: Record<string, SponsorCopy> = {
  '1st-and-2nd-of-month': {
    intro:
      'Rules that turn on a single day are easy to get wrong. You can check yours with a Social Security specialist at',
    outro: 'before you settle on a filing month.',
    bullets: [
      'They confirm the dates that actually apply to your birthday, rather than the ones a form assumes.',
      "They also cover what this guide doesn't, like taxes, pensions, and health.",
      'The first call is free, and you pick the time.',
    ],
  },
  'agency-changes': {
    intro:
      'Longer waits and in-person identity checks make small mistakes expensive to fix. You can get help from a Social Security specialist at',
    outro: 'before you take this on yourself.',
    bullets: [
      'They deal with SSA regularly and know which requests still need a field office visit and which do not.',
      'Getting an application right the first time matters more when corrections take months.',
      'The first call is free, and you pick the time.',
    ],
  },
  'covid-awi-drop': {
    intro:
      "If you were born around 1960, you're close enough to filing that your actual record matters more than any forecast. You can go through it with a Social Security specialist at",
    outro: 'to see where your benefit really lands.',
    bullets: [
      'They work from your indexed earnings as they stand, not from a projection of where the wage index might go.',
      "They also cover what this guide doesn't, like taxes, pensions, and health.",
      'The first call is free, and you pick the time.',
    ],
  },
  'divorced-spouse': {
    intro:
      'Claims like this one turn on dates and documents from a marriage that ended years ago. You can walk through yours with a Social Security specialist at',
    outro: 'before you file.',
    bullets: [
      "They check whether your own record or your ex's produces more, and at what age each one peaks.",
      'They know what SSA asks for when the marriage ended decades ago and the paperwork is long gone.',
      'The first call is free, and you pick the time.',
    ],
  },
  'federal-taxes': {
    intro:
      'Provisional income is something you can steer, and your filing date is one of the levers. You can work through it with a Social Security specialist at',
    outro: 'to find the years this tax actually bites.',
    bullets: [
      'They look at how filing age, IRA withdrawals, and Roth conversions move you across the break points above.',
      'State tax and the new senior deduction stack on top of this, and the arithmetic differs by household.',
      'The first call is free, and you pick the time.',
    ],
  },
  'government-shutdown': {
    intro:
      'Payments continue, but anything that needs SSA staff slows down. You can get help navigating that from a Social Security specialist at',
    outro: 'instead of waiting on hold.',
    bullets: [
      'They work with SSA regularly and know which requests still move during a funding gap.',
      'If you were about to file, they can tell you whether to submit now or wait it out.',
      'The first call is free, and you pick the time.',
    ],
  },
  integrations: {
    intro:
      'These tools can carry your numbers around, but none of them will tell you which plan is right. For that you can talk to a Social Security specialist at',
    outro: 'once your numbers are in place.',
    bullets: [
      "A real person looks at your situation, including things these tools don't model like taxes, pensions, and health.",
      'They can also handle the filing itself if you want the help.',
      'The first call is free, and you pick the time.',
    ],
  },
  'international-agreements': {
    intro:
      "A career split across countries is exactly the case this calculator can't finish. You can hand the details to a Social Security specialist at",
    outro: 'and get an estimate that counts your overseas work.',
    bullets: [
      'A totalization claim runs through two systems and needs records from both, and mistakes are slow to unwind.',
      "They also cover what this guide doesn't, like taxes, pensions, and health.",
      'The first call is free, and you pick the time.',
    ],
  },
  mortality: {
    intro:
      "A life table describes a cohort, not you. If you'd rather not plan on the average, you can talk it through with a Social Security specialist at",
    outro: 'and weigh your own health and family history.',
    bullets: [
      'They can show how much your filing decision actually changes if you outlive the table, or if you do not.',
      "For couples, the survivor benefit usually matters more than either person's own life expectancy.",
      'The first call is free, and you pick the time.',
    ],
  },
  privacy: {
    intro:
      "This calculator never learns who you are, which also means it can't weigh anything outside your earnings record. When you want that judgment, you can talk to a Social Security specialist at",
    outro: 'and decide for yourself what to share.',
    bullets: [
      "A real person looks at the whole picture, including things this calculator doesn't cover like taxes, pensions, and health.",
      'Nothing you enter here is sent to them. Any conversation starts because you started it.',
      'The first call is free, and you pick the time.',
    ],
  },
  'senior-tax-deduction': {
    intro:
      'This deduction phases out over a range you have some control over. You can map that out with a Social Security specialist at',
    outro: 'while there are still years left to plan.',
    bullets: [
      'They look at how your filing date, IRA withdrawals, and Roth conversions move your MAGI across the phase-out.',
      'The deduction runs only through 2028, so which year you do what matters.',
      'The first call is free, and you pick the time.',
    ],
  },
  'spousal-benefits': {
    intro:
      'Spousal benefits mean two filing dates that have to work together. You can schedule a free call with a Social Security specialist at',
    outro:
      "to talk through how your claiming age and your spouse's fit together.",
    bullets: [
      "They look at both records side by side, including the survivor benefit that depends on the higher earner's choice.",
      "They cover what this guide can't, like taxes, pensions, and health.",
      'The first call is free, and you pick the time.',
    ],
  },
  'state-taxes': {
    intro:
      'Keeping your income under a state threshold takes planning several years ahead. You can map that out with a Social Security specialist at',
    outro: 'before your next round of withdrawals.',
    bullets: [
      "They look at how withdrawal timing and Roth conversions interact with your state's exemption cutoff.",
      'Federal taxation of your benefit follows its own rules, and the two have to be planned together.',
      'The first call is free, and you pick the time.',
    ],
  },
  'survivor-benefits': {
    intro:
      'A survivor benefit and your own retirement benefit can be claimed in either order, and the order changes the total. You can sort that out with a Social Security specialist at',
    outro: 'before you file for either one.',
    bullets: [
      'They can tell you which benefit to take now and which to leave growing, working from both records.',
      "If you're recently widowed, they also know what SSA needs and how quickly it has to be filed.",
      'The first call is free, and you pick the time.',
    ],
  },
  wep: {
    intro:
      'If WEP once cut your benefit, your corrected amount and any back pay are worth a second look. You can review them with a Social Security specialist at',
    outro: 'to confirm the repeal was applied to your record.',
    bullets: [
      'They can tell whether your payment reflects the repeal, and what to do if it does not.',
      "A pension alongside Social Security also reshapes your tax picture, which this guide doesn't cover.",
      'The first call is free, and you pick the time.',
    ],
  },
  'will-social-security-run-out': {
    intro:
      'Nobody can tell you what Congress will do, but you can plan around the range. You can do that with a Social Security specialist at',
    outro: 'rather than planning around headlines.',
    bullets: [
      'They can show what a reduction like this would do to your own benefit, and what it would leave untouched.',
      "Claiming early to get yours first usually costs more than the shortfall it's meant to avoid.",
      'The first call is free, and you pick the time.',
    ],
  },
};

/**
 * The pitch for a guide's inline sponsor placement. Guides without their
 * own entry fall back to the generic pitch.
 */
export function getGuideSponsorCopy(slug: string): SponsorCopy {
  return GUIDE_SPONSOR_COPY[slug] ?? DEFAULT_SPONSOR_COPY;
}
