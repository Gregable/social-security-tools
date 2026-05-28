import { Birthdate } from '$lib/birthday';
import { EarningRecord } from '$lib/earning-record';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import type { EarningsEntry } from '$lib/url-params';

export function parseDob(dob: string | null): Birthdate | null {
  if (!dob) return null;

  const dobRegex = /(\d{4})-(\d{2})-(\d{2})/;
  const match = dob.match(dobRegex);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
    return null;

  return Birthdate.FromYMD(year, month, day);
}

export function earningsEntriesToRecords(
  entries: EarningsEntry[]
): EarningRecord[] {
  const records = entries.map(
    (entry) =>
      new EarningRecord({
        year: entry.year,
        taxedEarnings: Money.from(entry.amount),
        taxedMedicareEarnings: Money.from(entry.amount),
      })
  );

  records.sort((a, b) => a.year - b.year);

  return records;
}

export function parseRecipient(
  pia: number | null,
  dob: string | null,
  name: string | null
): Recipient | null {
  if (pia === null || !dob) return null;

  const birthdate = parseDob(dob);
  if (!birthdate) return null;

  const r = new Recipient();
  r.setPia(Money.from(pia));
  r.birthdate = birthdate;
  r.name = name || 'Self';

  return r;
}

export function parseRecipientFromEarnings(
  earnings: EarningsEntry[] | null,
  dob: string | null,
  name: string | null
): Recipient | null {
  if (!earnings || earnings.length === 0 || !dob) return null;

  const birthdate = parseDob(dob);
  if (!birthdate) return null;

  const r = new Recipient();
  r.earningsRecords = earningsEntriesToRecords(earnings);
  r.birthdate = birthdate;
  r.name = name || 'Self';

  return r;
}
