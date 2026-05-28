import type { UrlParams } from '$lib/url-params';

export type EmbedRequires =
  | 'recipient-pia-and-dob'
  | 'couple-pia-and-dob'
  | 'recipient-earnings-and-dob';

export function validateRequires(
  requires: EmbedRequires,
  params: UrlParams
): boolean {
  switch (requires) {
    case 'recipient-pia-and-dob':
      return params.hasValidRecipientParams();
    case 'couple-pia-and-dob':
      return params.hasValidRecipientParams() && params.hasValidSpouseParams();
    case 'recipient-earnings-and-dob':
      return params.hasValidRecipientEarnings();
  }
}

export function describeRequires(requires: EmbedRequires): string {
  switch (requires) {
    case 'recipient-pia-and-dob':
      return 'pia1 and dob1';
    case 'couple-pia-and-dob':
      return 'pia1, dob1, pia2, and dob2';
    case 'recipient-earnings-and-dob':
      return 'earnings1 and dob1';
  }
}
