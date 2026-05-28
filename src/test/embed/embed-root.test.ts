import { describe, expect, it } from 'vitest';
import { validateRequires } from '$lib/components/embed/embed-root-validate';
import { UrlParams } from '$lib/url-params';

describe('validateRequires', () => {
  it('passes recipient-pia-and-dob when both are present', () => {
    const params = new UrlParams('#pia1=3000&dob1=1965-09-21');
    expect(validateRequires('recipient-pia-and-dob', params)).toBe(true);
  });

  it('fails recipient-pia-and-dob when dob1 is missing', () => {
    const params = new UrlParams('#pia1=3000');
    expect(validateRequires('recipient-pia-and-dob', params)).toBe(false);
  });

  it('passes couple-pia-and-dob when all four are present', () => {
    const params = new UrlParams(
      '#pia1=3000&dob1=1965-09-21&pia2=2500&dob2=1967-04-10'
    );
    expect(validateRequires('couple-pia-and-dob', params)).toBe(true);
  });

  it('fails couple-pia-and-dob when pia2 is missing', () => {
    const params = new UrlParams('#pia1=3000&dob1=1965-09-21&dob2=1967-04-10');
    expect(validateRequires('couple-pia-and-dob', params)).toBe(false);
  });

  it('passes recipient-earnings-and-dob when both are present', () => {
    const params = new UrlParams('#earnings1=2020:50000&dob1=1965-09-21');
    expect(validateRequires('recipient-earnings-and-dob', params)).toBe(true);
  });

  it('fails recipient-earnings-and-dob when earnings1 is missing', () => {
    const params = new UrlParams('#dob1=1965-09-21');
    expect(validateRequires('recipient-earnings-and-dob', params)).toBe(false);
  });
});
