import { higherEarningsThan } from '$lib/benefit-calculator';
import type { Recipient } from '$lib/recipient';

export interface EarnerDependentClassification {
  readonly earner: Recipient;
  readonly dependent: Recipient;
  readonly earnerIndex: number;
  readonly dependentIndex: number;
}

export function classifyEarnerDependent(
  recipients: [Recipient, Recipient]
): EarnerDependentClassification {
  if (higherEarningsThan(recipients[0], recipients[1])) {
    return {
      earner: recipients[0],
      dependent: recipients[1],
      earnerIndex: 0,
      dependentIndex: 1,
    };
  }
  return {
    earner: recipients[1],
    dependent: recipients[0],
    earnerIndex: 1,
    dependentIndex: 0,
  };
}
