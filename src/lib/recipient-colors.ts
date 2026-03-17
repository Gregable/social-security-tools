export interface RecipientColors {
  dark: string;
  medium: string;
  light: string;
}

/**
 * Returns a dark, medium, and light color for the recipient.
 * First and only recipients are orange, while second recipients are green.
 */
export function recipientColors(recipient: {
  first: boolean;
}): RecipientColors {
  if (recipient.first) {
    return { dark: '#8d6100', medium: '#e69f00', light: '#f6dfad' };
  } else {
    return { dark: '#004400', medium: '#558855', light: '#d9ebd9' };
  }
}
