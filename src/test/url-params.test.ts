/**
 * Tests for the centralized URL parameter manager.
 */

import { describe, it, expect } from 'vitest';
import { UrlParams } from '$lib/url-params';

describe('UrlParams', () => {
  describe('Constructor', () => {
    it('should parse hash with leading #', () => {
      const params = new UrlParams('#pia1=3000&dob1=1965-09-21');
      expect(params.getRecipientPia()).toBe(3000);
      expect(params.getRecipientDob()).toBe('1965-09-21');
    });

    it('should parse hash without leading #', () => {
      const params = new UrlParams('pia1=3000&dob1=1965-09-21');
      expect(params.getRecipientPia()).toBe(3000);
      expect(params.getRecipientDob()).toBe('1965-09-21');
    });

    it('should handle empty hash', () => {
      const params = new UrlParams('');
      expect(params.hasAnyParams()).toBe(false);
    });

    it('should handle hash with only #', () => {
      const params = new UrlParams('#');
      expect(params.hasAnyParams()).toBe(false);
    });
  });

  describe('Integration Parameters', () => {
    it('should get integration parameter', () => {
      const params = new UrlParams('#integration=opensocialsecurity.com');
      expect(params.getIntegration()).toBe('opensocialsecurity.com');
    });

    it('should return null for missing integration', () => {
      const params = new UrlParams('#pia1=3000');
      expect(params.getIntegration()).toBeNull();
    });

    it('should get integration from combined params', () => {
      const params = new UrlParams(
        '#integration=linopt.com&pia1=3000&dob1=1965-09-21'
      );
      expect(params.getIntegration()).toBe('linopt.com');
    });
  });

  describe('Recipient Parameters', () => {
    it('should get recipient PIA', () => {
      const params = new UrlParams('#pia1=3000');
      expect(params.getRecipientPia()).toBe(3000);
    });

    it('should return null for missing recipient PIA', () => {
      const params = new UrlParams('#dob1=1965-09-21');
      expect(params.getRecipientPia()).toBeNull();
    });

    it('should return null for invalid recipient PIA', () => {
      const params = new UrlParams('#pia1=notanumber');
      expect(params.getRecipientPia()).toBeNull();
    });

    it('should get recipient DOB', () => {
      const params = new UrlParams('#dob1=1965-09-21');
      expect(params.getRecipientDob()).toBe('1965-09-21');
    });

    it('should return null for missing recipient DOB', () => {
      const params = new UrlParams('#pia1=3000');
      expect(params.getRecipientDob()).toBeNull();
    });

    it('should get recipient name', () => {
      const params = new UrlParams('#name1=Alex');
      expect(params.getRecipientName()).toBe('Alex');
    });

    it('should return null for missing recipient name', () => {
      const params = new UrlParams('#pia1=3000');
      expect(params.getRecipientName()).toBeNull();
    });

    it('should handle URL-encoded recipient name', () => {
      const params = new UrlParams('#name1=Alex%20Smith');
      expect(params.getRecipientName()).toBe('Alex Smith');
    });

    it('should get all recipient params', () => {
      const params = new UrlParams('#pia1=3000&dob1=1965-09-21&name1=Alex');
      const recipient = params.getRecipientParams();
      expect(recipient.pia).toBe(3000);
      expect(recipient.dob).toBe('1965-09-21');
      expect(recipient.name).toBe('Alex');
    });

    it('should validate complete recipient params', () => {
      const valid = new UrlParams('#pia1=3000&dob1=1965-09-21');
      expect(valid.hasValidRecipientParams()).toBe(true);

      const missingPia = new UrlParams('#dob1=1965-09-21');
      expect(missingPia.hasValidRecipientParams()).toBe(false);

      const missingDob = new UrlParams('#pia1=3000');
      expect(missingDob.hasValidRecipientParams()).toBe(false);

      const empty = new UrlParams('');
      expect(empty.hasValidRecipientParams()).toBe(false);
    });
  });

  describe('Spouse Parameters', () => {
    it('should get spouse PIA', () => {
      const params = new UrlParams('#pia2=2500');
      expect(params.getSpousePia()).toBe(2500);
    });

    it('should return null for missing spouse PIA', () => {
      const params = new UrlParams('#dob2=1962-03-10');
      expect(params.getSpousePia()).toBeNull();
    });

    it('should return null for invalid spouse PIA', () => {
      const params = new UrlParams('#pia2=invalid');
      expect(params.getSpousePia()).toBeNull();
    });

    it('should get spouse DOB', () => {
      const params = new UrlParams('#dob2=1962-03-10');
      expect(params.getSpouseDob()).toBe('1962-03-10');
    });

    it('should return null for missing spouse DOB', () => {
      const params = new UrlParams('#pia2=2500');
      expect(params.getSpouseDob()).toBeNull();
    });

    it('should get spouse name', () => {
      const params = new UrlParams('#name2=Chris');
      expect(params.getSpouseName()).toBe('Chris');
    });

    it('should return null for missing spouse name', () => {
      const params = new UrlParams('#pia2=2500');
      expect(params.getSpouseName()).toBeNull();
    });

    it('should get all spouse params', () => {
      const params = new UrlParams('#pia2=2500&dob2=1962-03-10&name2=Chris');
      const spouse = params.getSpouseParams();
      expect(spouse.pia).toBe(2500);
      expect(spouse.dob).toBe('1962-03-10');
      expect(spouse.name).toBe('Chris');
    });

    it('should validate complete spouse params', () => {
      const valid = new UrlParams('#pia2=2500&dob2=1962-03-10');
      expect(valid.hasValidSpouseParams()).toBe(true);

      const missingPia = new UrlParams('#dob2=1962-03-10');
      expect(missingPia.hasValidSpouseParams()).toBe(false);

      const missingDob = new UrlParams('#pia2=2500');
      expect(missingDob.hasValidSpouseParams()).toBe(false);

      const empty = new UrlParams('');
      expect(empty.hasValidSpouseParams()).toBe(false);
    });
  });

  describe('Combined Scenarios', () => {
    it('should parse recipient and spouse together', () => {
      const params = new UrlParams(
        '#pia1=3000&dob1=1965-09-21&name1=Alex&pia2=2500&dob2=1962-03-10&name2=Chris'
      );
      expect(params.getRecipientPia()).toBe(3000);
      expect(params.getRecipientDob()).toBe('1965-09-21');
      expect(params.getRecipientName()).toBe('Alex');
      expect(params.getSpousePia()).toBe(2500);
      expect(params.getSpouseDob()).toBe('1962-03-10');
      expect(params.getSpouseName()).toBe('Chris');
    });

    it('should parse integration with recipient data', () => {
      const params = new UrlParams(
        '#integration=opensocialsecurity.com&pia1=3000&dob1=1965-09-21'
      );
      expect(params.getIntegration()).toBe('opensocialsecurity.com');
      expect(params.getRecipientPia()).toBe(3000);
      expect(params.getRecipientDob()).toBe('1965-09-21');
    });

    it('should parse integration with recipient and spouse data', () => {
      const params = new UrlParams(
        '#integration=linopt.com&pia1=3000&dob1=1965-09-21&pia2=2500&dob2=1962-03-10'
      );
      expect(params.getIntegration()).toBe('linopt.com');
      expect(params.hasValidRecipientParams()).toBe(true);
      expect(params.hasValidSpouseParams()).toBe(true);
    });

    it('should handle parameters in any order', () => {
      const params = new UrlParams(
        '#dob1=1965-09-21&integration=firecalc.com&name1=Alex&pia1=3000'
      );
      expect(params.getIntegration()).toBe('firecalc.com');
      expect(params.getRecipientPia()).toBe(3000);
      expect(params.getRecipientDob()).toBe('1965-09-21');
      expect(params.getRecipientName()).toBe('Alex');
    });

    it('should handle minimal recipient data', () => {
      const params = new UrlParams('#pia1=3000&dob1=1965-09-21');
      expect(params.hasValidRecipientParams()).toBe(true);
      expect(params.getRecipientName()).toBeNull();
    });

    it('should handle minimal spouse data', () => {
      const params = new UrlParams('#pia2=2500&dob2=1962-03-10');
      expect(params.hasValidSpouseParams()).toBe(true);
      expect(params.getSpouseName()).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero PIA values', () => {
      const params = new UrlParams('#pia1=0&dob1=1965-09-21');
      expect(params.getRecipientPia()).toBe(0);
      expect(params.hasValidRecipientParams()).toBe(true);
    });

    it('should handle negative PIA values', () => {
      const params = new UrlParams('#pia1=-100&dob1=1965-09-21');
      expect(params.getRecipientPia()).toBe(-100);
    });

    it('should handle large PIA values', () => {
      const params = new UrlParams('#pia1=999999&dob1=1965-09-21');
      expect(params.getRecipientPia()).toBe(999999);
    });

    it('should handle decimal PIA values as integers', () => {
      const params = new UrlParams('#pia1=3000.50&dob1=1965-09-21');
      expect(params.getRecipientPia()).toBe(3000);
    });

    it('should handle empty parameter values', () => {
      const params = new UrlParams('#pia1=&dob1=');
      expect(params.getRecipientPia()).toBeNull();
      expect(params.getRecipientDob()).toBe('');
    });

    it('should handle duplicate parameters (first wins)', () => {
      const params = new UrlParams('#pia1=2000&pia1=3000');
      expect(params.getRecipientPia()).toBe(2000);
    });

    it('should handle special characters in names', () => {
      const params = new UrlParams('#name1=O%27Brien&name2=M%C3%BCller');
      expect(params.getRecipientName()).toBe("O'Brien");
      expect(params.getSpouseName()).toBe('Müller');
    });
  });

  describe('Utility Methods', () => {
    it('should detect presence of any parameters', () => {
      const withParams = new UrlParams('#pia1=3000');
      expect(withParams.hasAnyParams()).toBe(true);

      const empty = new UrlParams('');
      expect(empty.hasAnyParams()).toBe(false);
    });

    it('should provide raw URLSearchParams access', () => {
      const params = new UrlParams('#pia1=3000&custom=value');
      const raw = params.getRaw();
      expect(raw.get('pia1')).toBe('3000');
      expect(raw.get('custom')).toBe('value');
    });
  });

  describe('Real-World URL Examples', () => {
    it('should parse URL from url-parameters guide example 1', () => {
      const params = new UrlParams('#pia1=3000&dob1=1965-09-21&name1=Alex');
      expect(params.getRecipientPia()).toBe(3000);
      expect(params.getRecipientDob()).toBe('1965-09-21');
      expect(params.getRecipientName()).toBe('Alex');
    });

    it('should parse URL from url-parameters guide example 2', () => {
      const params = new UrlParams(
        '#pia1=1000&dob1=1965-09-21&name1=Alex&pia2=0&dob2=1965-09-28&name2=Chris'
      );
      expect(params.hasValidRecipientParams()).toBe(true);
      expect(params.hasValidSpouseParams()).toBe(true);
      expect(params.getSpousePia()).toBe(0);
    });

    it('should parse URL from url-parameters guide example 3', () => {
      const params = new UrlParams(
        '#pia1=2500&dob1=1960-06-15&name1=Pat&pia2=0&dob2=1962-03-10&name2=Sam'
      );
      expect(params.getRecipientPia()).toBe(2500);
      expect(params.getSpousePia()).toBe(0);
      expect(params.hasValidRecipientParams()).toBe(true);
      expect(params.hasValidSpouseParams()).toBe(true);
    });

    it('should parse integration URL from INTEGRATIONS.md example', () => {
      const params = new UrlParams('#integration=opensocialsecurity.com');
      expect(params.getIntegration()).toBe('opensocialsecurity.com');
    });

    it('should parse combined integration and data URL', () => {
      const params = new UrlParams(
        '#integration=opensocialsecurity.com&pia1=3000&dob1=1965-09-21&name1=Alex'
      );
      expect(params.getIntegration()).toBe('opensocialsecurity.com');
      expect(params.hasValidRecipientParams()).toBe(true);
      expect(params.getRecipientName()).toBe('Alex');
    });
  });
});
