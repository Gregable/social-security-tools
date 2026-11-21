import { beforeEach, describe, expect, it } from 'vitest';
import { allBenefitsOnDate } from '$lib/benefit-calculator';
import { Birthdate } from '$lib/birthday';
import { IntegrationContext } from '$lib/components/integrations/integration-context';
import {
  buildTpawIncomeEntries,
  formatTpawAge,
  type TpawIncomeEntry,
  type TpawYouChoice,
  tpawAge,
  tpawBirthMonth,
  tpawEndText,
  tpawLabel,
  tpawPeople,
  tpawStartText,
} from '$lib/integrations/tpaw';
import { Money } from '$lib/money';
import { MonthDate, MonthDuration } from '$lib/month-time';
import { Recipient } from '$lib/recipient';

const NOW = MonthDate.initFromYearsMonths({ years: 2026, months: 10 });

function month(years: number, months: number): MonthDate {
  return MonthDate.initFromYearsMonths({ years, months });
}

function age(years: number, months: number): MonthDuration {
  return MonthDuration.initFromYearsMonths({ years, months });
}

function person(name: string, pia: number, birthdate: Birthdate): Recipient {
  const r = new Recipient();
  r.name = name;
  r.setPia(Money.from(pia));
  r.birthdate = birthdate;
  return r;
}

/** [kind, recipient name, TPAW person, monthly dollars] for each entry. */
function summarize(entries: readonly TpawIncomeEntry[]) {
  return entries.map((e) => [
    e.kind,
    e.recipient.name,
    e.person,
    e.monthlyAmount.value(),
  ]);
}

describe('tpawAge', () => {
  it('counts months from the calendar birth month', () => {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1960, 0, 15); // Jan 15, 1960
    expect(tpawAge(r, month(2027, 0)).asMonths()).toBe(67 * 12);
    expect(tpawAge(r, month(2027, 3)).asMonths()).toBe(67 * 12 + 3);
  });

  it('ignores the SSA day-before-birthday rule for people born on the 1st', () => {
    // SSA treats someone born June 1 as attaining each age in May, so their
    // SSA age 67 month is May 2027. TPAW only knows the birth month (June),
    // so the same month is 66 years 11 months there.
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1960, 5, 1); // Jun 1, 1960
    const ssaAge67 = r.birthdate.dateAtSsaAge(age(67, 0));
    expect(ssaAge67.year()).toBe(2027);
    expect(ssaAge67.monthIndex()).toBe(4); // May
    expect(tpawAge(r, ssaAge67).asMonths()).toBe(66 * 12 + 11);
  });
});

describe('tpawBirthMonth', () => {
  it('is the calendar month of birth, even for people born on the 1st', () => {
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1960, 5, 1); // Jun 1, 1960
    expect(tpawBirthMonth(r)).toEqual(month(1960, 5));
    expect(tpawBirthMonth(r).toFullString()).toBe('June 1960');
  });

  it('keeps the calendar year for someone born on January 1', () => {
    // SSA's birth month for January 1, 1960 is December 1959.
    const r = new Recipient();
    r.birthdate = Birthdate.FromYMD(1960, 0, 1);
    expect(tpawBirthMonth(r).toFullString()).toBe('January 1960');
  });
});

describe('formatTpawAge', () => {
  it('matches TPAW, which always shows the months', () => {
    expect(formatTpawAge(age(67, 0))).toBe('67 years, 0 months');
    expect(formatTpawAge(age(66, 1))).toBe('66 years, 1 month');
    expect(formatTpawAge(age(62, 11))).toBe('62 years, 11 months');
  });
});

describe('tpawPeople', () => {
  const alex = person('Alex', 3000, Birthdate.FromYMD(1960, 0, 15));
  const chris = person('Chris', 1000, Birthdate.FromYMD(1962, 5, 20));

  it('maps the choice to "you" and the partner', () => {
    const context = new IntegrationContext(alex, chris);
    expect(tpawPeople(context, 'recipient')).toEqual({
      you: alex,
      partner: chris,
    });
    expect(tpawPeople(context, 'spouse')).toEqual({
      you: chris,
      partner: alex,
    });
  });

  it('is always the recipient without a spouse', () => {
    const context = new IntegrationContext(alex, null);
    expect(tpawPeople(context, 'spouse')).toEqual({
      you: alex,
      partner: null,
    });
  });
});

describe('buildTpawIncomeEntries', () => {
  let alex: Recipient;
  let chris: Recipient;

  beforeEach(() => {
    alex = person('Alex', 3000, Birthdate.FromYMD(1960, 0, 15)); // Jan 15, 1960
    chris = person('Chris', 1000, Birthdate.FromYMD(1962, 5, 20)); // Jun 20, 1962
  });

  describe('single person', () => {
    function single(filing: MonthDate | null, r: Recipient = alex) {
      return buildTpawIncomeEntries({
        context: new IntegrationContext(r, null),
        recipientFilingDate: filing,
        spouseFilingDate: null,
        you: 'recipient',
        now: NOW,
      });
    }

    it('returns one personal entry for "you" starting at the filing age', () => {
      const filing = month(2027, 0); // full retirement age (67)
      const entries = single(filing);

      expect(summarize(entries)).toEqual([['personal', 'Alex', 'you', 3000]]);
      expect(entries[0].start).toEqual({
        age: age(67, 0),
        month: filing,
        alreadyStarted: false,
      });
      expect(tpawStartText(entries[0])).toBe('When you are 67 years, 0 months');
      expect(tpawEndText(entries[0])).toBe('At your max age');
    });

    it('gives TPAW ages, not SSA ages, for someone born on the 1st', () => {
      const june1 = person('Sam', 3000, Birthdate.FromYMD(1960, 5, 1));
      const ssaAge67 = june1.birthdate.dateAtSsaAge(age(67, 0)); // May 2027
      const [entry] = single(ssaAge67, june1);
      expect(tpawStartText(entry)).toBe('When you are 66 years, 11 months');
    });

    it('starts a benefit that already began at the current age', () => {
      // Alex filed in January 2025. TPAW has no "now" start, so the entry
      // starts this month (November 2026), at 66 years 10 months.
      const [past] = single(month(2025, 0));
      expect(past.start).toEqual({
        age: age(66, 10),
        month: NOW,
        alreadyStarted: true,
      });

      const [thisMonth] = single(NOW);
      expect(thisMonth.start.month).toEqual(NOW);
      expect(thisMonth.start.alreadyStarted).toBe(false);
    });

    it('returns no entries when no filing date is chosen', () => {
      expect(single(null)).toEqual([]);
    });
  });

  describe('couple', () => {
    function couple(
      recipient: Recipient,
      spouse: Recipient,
      dates: { recipient: MonthDate; spouse: MonthDate },
      you: TpawYouChoice = 'recipient'
    ) {
      return buildTpawIncomeEntries({
        context: new IntegrationContext(recipient, spouse),
        recipientFilingDate: dates.recipient,
        spouseFilingDate: dates.spouse,
        you,
        now: NOW,
      });
    }

    // Both at 67, their full retirement age.
    const atFra = { recipient: month(2027, 0), spouse: month(2029, 5) };

    it('lists both personal benefits, then the spousal benefit', () => {
      const entries = couple(alex, chris, atFra);

      expect(summarize(entries)).toEqual([
        ['personal', 'Alex', 'you', 3000],
        ['personal', 'Chris', 'partner', 1000],
        ['spousal', 'Chris', 'partner', 500],
      ]);
      expect(entries.map(tpawStartText)).toEqual([
        'When you are 67 years, 0 months',
        'When your partner is 67 years, 0 months',
        'When your partner is 67 years, 0 months',
      ]);
      expect(entries.map(tpawEndText)).toEqual([
        'At your max age',
        "At your partner's max age",
        "At your partner's max age",
      ]);
    });

    it('starts the spousal benefit when both have filed', () => {
      const entries = couple(alex, chris, {
        recipient: month(2030, 0), // Alex at 70
        spouse: month(2029, 5), // Chris at 67
      });
      const spousal = entries.find((e) => e.kind === 'spousal');
      if (!spousal) throw new Error('expected a spousal entry');

      // Chris (born June 1962) is 67 years 7 months in January 2030.
      expect(spousal.start).toEqual({
        age: age(67, 7),
        month: month(2030, 0),
        alreadyStarted: false,
      });
    });

    it('lists "you" first and maps people by the chosen TPAW person', () => {
      expect(summarize(couple(alex, chris, atFra, 'spouse'))).toEqual([
        ['personal', 'Chris', 'you', 1000],
        ['personal', 'Alex', 'partner', 3000],
        ['spousal', 'Chris', 'you', 500],
      ]);
    });

    it('works when the spouse is the higher earner', () => {
      const entries = couple(chris, alex, {
        recipient: month(2029, 5), // Chris at 67
        spouse: month(2027, 0), // Alex at 67
      });
      expect(summarize(entries)).toEqual([
        ['personal', 'Chris', 'you', 1000],
        ['personal', 'Alex', 'partner', 3000],
        ['spousal', 'Chris', 'you', 500],
      ]);
    });

    it('pairs a late own filing with the spousal amount that continues', () => {
      // Chris files at 68 in June 2030. Delayed credits for January-May 2030
      // apply only in January 2031, so the spousal benefit is $453 until then
      // and $420 after. The entries carry $1,080 + $420 = $1,500 for life.
      const entries = couple(alex, chris, {
        recipient: atFra.recipient,
        spouse: month(2030, 5),
      });
      expect(summarize(entries)).toEqual([
        ['personal', 'Alex', 'you', 3000],
        ['personal', 'Chris', 'partner', 1080],
        ['spousal', 'Chris', 'partner', 420],
      ]);
    });

    it('drops a spousal benefit that ends once all delayed credits apply', () => {
      // With a $1,300 PIA, Chris's own benefit filed at 69 years 5 months
      // (November 2031) passes half of Alex's PIA once January's credits
      // apply, so only the first two months would pay a spousal amount.
      chris.setPia(Money.from(1300));
      const entries = couple(alex, chris, {
        recipient: atFra.recipient,
        spouse: month(2031, 10),
      });
      expect(entries.map((e) => e.kind)).toEqual(['personal', 'personal']);
    });

    it('starts each entry at its own time when one has already started', () => {
      // Chris filed at 62 years 1 month (July 2024); Alex files at 70.
      const entries = couple(alex, chris, {
        recipient: month(2030, 0),
        spouse: month(2024, 6),
      });
      const [alexOwn, chrisOwn, chrisSpousal] = entries;
      expect(alexOwn.start.alreadyStarted).toBe(false);
      expect(chrisOwn.start).toEqual({
        age: age(64, 5),
        month: NOW,
        alreadyStarted: true,
      });
      // The spousal benefit starts with Alex's filing, at Chris's age then.
      expect(chrisSpousal.kind).toBe('spousal');
      expect(chrisSpousal.start).toEqual({
        age: age(67, 7),
        month: month(2030, 0),
        alreadyStarted: false,
      });
    });

    it('starts the spousal benefit now when both have already filed', () => {
      const entries = couple(alex, chris, {
        recipient: month(2025, 0),
        spouse: month(2025, 6),
      });
      const spousal = entries.find((e) => e.kind === 'spousal');
      expect(spousal?.start.month).toEqual(NOW);
      expect(spousal?.start.alreadyStarted).toBe(true);
    });

    it('omits a $0 personal benefit but keeps the spousal benefit', () => {
      chris.setPia(Money.zero());
      expect(summarize(couple(alex, chris, atFra))).toEqual([
        ['personal', 'Alex', 'you', 3000],
        ['spousal', 'Chris', 'partner', 1500],
      ]);
    });

    it('omits the spousal benefit when the lower earner would not get one', () => {
      chris.setPia(Money.from(2000));
      expect(couple(alex, chris, atFra).map((e) => e.kind)).toEqual([
        'personal',
        'personal',
      ]);
    });

    it("sums the lower earner's entries to the lasting combined benefit", () => {
      // Across filing ages, the lower earner's personal and spousal entries
      // must add up to what SSA pays once all delayed credits apply.
      const higher = person('Alex', 3123.45, Birthdate.FromYMD(1965, 0, 15));
      const lower = person('Chris', 1011.11, Birthdate.FromYMD(1966, 5, 20));
      const context = new IntegrationContext(higher, lower);
      const mismatches: string[] = [];
      for (let h = 62 * 12; h <= 70 * 12; h += 3) {
        for (let l = 62 * 12 + 1; l <= 70 * 12; l += 1) {
          const higherFiling = higher.birthdate.dateAtSsaAge(
            new MonthDuration(h)
          );
          const lowerFiling = lower.birthdate.dateAtSsaAge(
            new MonthDuration(l)
          );
          const entries = buildTpawIncomeEntries({
            context,
            recipientFilingDate: higherFiling,
            spouseFilingDate: lowerFiling,
            you: 'recipient',
            now: NOW,
          });
          const lowerTotal = entries
            .filter((e) => e.recipient === lower)
            .reduce((sum, e) => sum + e.monthlyAmount.value(), 0);
          const later = higherFiling.greaterThan(lowerFiling)
            ? higherFiling
            : lowerFiling;
          const lasting = allBenefitsOnDate(
            lower,
            higher,
            higherFiling,
            lowerFiling,
            later.addDuration(new MonthDuration(24))
          ).value();
          if (lowerTotal !== lasting) {
            mismatches.push(
              `higher ${h}m, lower ${l}m: ${lowerTotal} vs ${lasting}`
            );
          }
        }
      }
      expect(mismatches).toEqual([]);
    });
  });
});

describe('tpawLabel', () => {
  it('uses a plain label for a single person', () => {
    const r = new Recipient();
    r.name = 'Alex';
    expect(tpawLabel({ kind: 'personal', recipient: r }, false)).toBe(
      'Social Security'
    );
  });

  it('names the person for a couple', () => {
    const r = new Recipient();
    r.name = 'Chris';
    expect(tpawLabel({ kind: 'personal', recipient: r }, true)).toBe(
      'Social Security (Chris)'
    );
    expect(tpawLabel({ kind: 'spousal', recipient: r }, true)).toBe(
      'Spousal benefit (Chris)'
    );
  });
});
