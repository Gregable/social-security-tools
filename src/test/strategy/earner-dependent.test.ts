import { describe, expect, it } from 'vitest';
import { Birthdate } from '$lib/birthday';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import { classifyEarnerDependent } from '$lib/strategy/calculations/earner-dependent';

function makeRecipient(piaDollars: number): Recipient {
  const r = new Recipient();
  r.birthdate = Birthdate.FromYMD(1960, 3, 15);
  r.setPia(Money.from(piaDollars));
  return r;
}

describe('classifyEarnerDependent', () => {
  it('recipient 0 is earner when they have higher PIA', () => {
    const r0 = makeRecipient(2000);
    const r1 = makeRecipient(800);
    const result = classifyEarnerDependent([r0, r1]);
    expect(result.earner).toBe(r0);
    expect(result.dependent).toBe(r1);
    expect(result.earnerIndex).toBe(0);
    expect(result.dependentIndex).toBe(1);
  });

  it('recipient 1 is earner when they have higher PIA', () => {
    const r0 = makeRecipient(500);
    const r1 = makeRecipient(1500);
    const result = classifyEarnerDependent([r0, r1]);
    expect(result.earner).toBe(r1);
    expect(result.dependent).toBe(r0);
    expect(result.earnerIndex).toBe(1);
    expect(result.dependentIndex).toBe(0);
  });

  it('equal PIA assigns recipient 1 as earner', () => {
    const r0 = makeRecipient(1000);
    const r1 = makeRecipient(1000);
    const result = classifyEarnerDependent([r0, r1]);
    expect(result.earnerIndex).toBe(1);
    expect(result.dependentIndex).toBe(0);
  });
});
