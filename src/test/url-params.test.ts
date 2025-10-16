/**
 * Tests for the centralized URL parameter manager.
 */

import { describe, expect, it } from 'vitest';
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

  describe('Earnings Parameters', () => {
    describe('Recipient Earnings', () => {
      it('should parse simple earnings history', () => {
        const params = new UrlParams(
          '#earnings1=2020:50000,2021:55000,2022:60000'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings).not.toBeNull();
        expect(earnings?.length).toBe(3);
        expect(earnings?.[0]).toEqual({ year: 2020, amount: 50000 });
        expect(earnings?.[1]).toEqual({ year: 2021, amount: 55000 });
        expect(earnings?.[2]).toEqual({ year: 2022, amount: 60000 });
      });

      it('should return null for missing earnings1', () => {
        const params = new UrlParams('#dob1=1995-03-15');
        expect(params.getRecipientEarnings()).toBeNull();
      });

      it('should parse single year earnings', () => {
        const params = new UrlParams('#earnings1=2022:60000');
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(1);
        expect(earnings?.[0]).toEqual({ year: 2022, amount: 60000 });
      });

      it('should parse longer earnings history', () => {
        const params = new UrlParams(
          '#earnings1=2000:35000,2001:38000,2002:42000,2003:45000,2004:48000,2005:52000,2006:55000,2007:58000,2008:60000,2009:62000'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(10);
        expect(earnings?.[0]).toEqual({ year: 2000, amount: 35000 });
        expect(earnings?.[9]).toEqual({ year: 2009, amount: 62000 });
      });

      it('should handle zero earnings', () => {
        const params = new UrlParams('#earnings1=2020:0,2021:55000');
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(2);
        expect(earnings?.[0]).toEqual({ year: 2020, amount: 0 });
      });

      it('should skip negative earnings', () => {
        const params = new UrlParams('#earnings1=2020:-5000,2021:55000');
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(1);
        expect(earnings?.[0]).toEqual({ year: 2021, amount: 55000 });
      });

      it('should skip invalid year values', () => {
        const params = new UrlParams(
          '#earnings1=1950:5000,2020:50000,2101:100000'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(1);
        expect(earnings?.[0]).toEqual({ year: 2020, amount: 50000 });
      });

      it('should skip malformed pairs', () => {
        const params = new UrlParams(
          '#earnings1=2020:50000,invalid,2021:55000,2022'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(2);
        expect(earnings?.[0]).toEqual({ year: 2020, amount: 50000 });
        expect(earnings?.[1]).toEqual({ year: 2021, amount: 55000 });
      });

      it('should skip pairs with non-numeric values', () => {
        const params = new UrlParams('#earnings1=2020:abc,2021:55000,xyz:100');
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(1);
        expect(earnings?.[0]).toEqual({ year: 2021, amount: 55000 });
      });

      it('should handle whitespace in earnings', () => {
        const params = new UrlParams(
          '#earnings1=2020:50000, 2021:55000 , 2022:60000'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(3);
        expect(earnings?.[1]).toEqual({ year: 2021, amount: 55000 });
      });

      it('should handle empty earnings parameter', () => {
        const params = new UrlParams('#earnings1=');
        expect(params.getRecipientEarnings()).toBeNull();
      });

      it('should return null for all-invalid earnings', () => {
        const params = new UrlParams('#earnings1=invalid:data,bad:format');
        expect(params.getRecipientEarnings()).toBeNull();
      });

      it('should validate recipient has earnings and DOB', () => {
        const valid = new UrlParams('#earnings1=2020:50000&dob1=1995-03-15');
        expect(valid.hasValidRecipientEarnings()).toBe(true);

        const missingDob = new UrlParams('#earnings1=2020:50000');
        expect(missingDob.hasValidRecipientEarnings()).toBe(false);

        const missingEarnings = new UrlParams('#dob1=1995-03-15');
        expect(missingEarnings.hasValidRecipientEarnings()).toBe(false);

        const empty = new UrlParams('');
        expect(empty.hasValidRecipientEarnings()).toBe(false);
      });
    });

    describe('Spouse Earnings', () => {
      it('should parse spouse earnings history', () => {
        const params = new UrlParams(
          '#earnings2=2020:40000,2021:42000,2022:45000'
        );
        const earnings = params.getSpouseEarnings();
        expect(earnings).not.toBeNull();
        expect(earnings?.length).toBe(3);
        expect(earnings?.[0]).toEqual({ year: 2020, amount: 40000 });
        expect(earnings?.[1]).toEqual({ year: 2021, amount: 42000 });
        expect(earnings?.[2]).toEqual({ year: 2022, amount: 45000 });
      });

      it('should return null for missing earnings2', () => {
        const params = new UrlParams('#dob2=1992-08-20');
        expect(params.getSpouseEarnings()).toBeNull();
      });

      it('should validate spouse has earnings and DOB', () => {
        const valid = new UrlParams('#earnings2=2020:40000&dob2=1992-08-20');
        expect(valid.hasValidSpouseEarnings()).toBe(true);

        const missingDob = new UrlParams('#earnings2=2020:40000');
        expect(missingDob.hasValidSpouseEarnings()).toBe(false);

        const missingEarnings = new UrlParams('#dob2=1992-08-20');
        expect(missingEarnings.hasValidSpouseEarnings()).toBe(false);
      });
    });

    describe('Combined Earnings Scenarios', () => {
      it('should parse both recipient and spouse earnings', () => {
        const params = new UrlParams(
          '#earnings1=2020:80000,2021:85000&dob1=1960-01-15&name1=Alex&earnings2=2020:40000,2021:42000&dob2=1962-03-10&name2=Chris'
        );

        const recipientEarnings = params.getRecipientEarnings();
        expect(recipientEarnings?.length).toBe(2);
        expect(recipientEarnings?.[0]).toEqual({ year: 2020, amount: 80000 });

        const spouseEarnings = params.getSpouseEarnings();
        expect(spouseEarnings?.length).toBe(2);
        expect(spouseEarnings?.[0]).toEqual({ year: 2020, amount: 40000 });

        expect(params.hasValidRecipientEarnings()).toBe(true);
        expect(params.hasValidSpouseEarnings()).toBe(true);
      });

      it('should handle recipient earnings with spouse PIA', () => {
        const params = new UrlParams(
          '#earnings1=2020:80000,2021:85000&dob1=1960-01-15&pia2=0&dob2=1962-03-10'
        );
        expect(params.hasValidRecipientEarnings()).toBe(true);
        expect(params.hasValidSpouseParams()).toBe(true);
      });

      it('should handle recipient PIA with spouse earnings', () => {
        const params = new UrlParams(
          '#pia1=3000&dob1=1960-01-15&earnings2=2020:40000,2021:42000&dob2=1962-03-10'
        );
        expect(params.hasValidRecipientParams()).toBe(true);
        expect(params.hasValidSpouseEarnings()).toBe(true);
      });

      it('should parse earnings with integration parameter', () => {
        const params = new UrlParams(
          '#integration=opensocialsecurity.com&earnings1=2020:50000,2021:55000&dob1=1995-03-15'
        );
        expect(params.getIntegration()).toBe('opensocialsecurity.com');
        expect(params.hasValidRecipientEarnings()).toBe(true);
      });

      it('should handle earnings parameters in any order', () => {
        const params = new UrlParams(
          '#dob1=1995-03-15&name1=Jordan&earnings1=2020:50000,2021:55000,2022:60000'
        );
        expect(params.getRecipientName()).toBe('Jordan');
        expect(params.hasValidRecipientEarnings()).toBe(true);
      });
    });

    describe('Earnings Edge Cases', () => {
      it('should handle very large earnings values', () => {
        const params = new UrlParams('#earnings1=2020:999999,2021:1000000');
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(2);
        expect(earnings?.[1]).toEqual({ year: 2021, amount: 1000000 });
      });

      it('should handle historical years', () => {
        const params = new UrlParams(
          '#earnings1=1951:1000,1980:15000,2000:50000'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(3);
        expect(earnings?.[0]).toEqual({ year: 1951, amount: 1000 });
      });

      it('should handle future years within limit', () => {
        const params = new UrlParams('#earnings1=2025:100000,2030:120000');
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(2);
        expect(earnings?.[1]).toEqual({ year: 2030, amount: 120000 });
      });

      it('should handle duplicate years (keeps all)', () => {
        const params = new UrlParams(
          '#earnings1=2020:50000,2020:60000,2021:55000'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(3);
        // Both 2020 entries should be present
        expect(earnings?.filter((e) => e.year === 2020).length).toBe(2);
      });

      it('should handle earnings with empty pairs', () => {
        const params = new UrlParams('#earnings1=2020:50000,,2021:55000,');
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(2);
      });

      it('should handle long earnings history (35+ years)', () => {
        const yearPairs = Array.from(
          { length: 40 },
          (_, i) => `${1985 + i}:${30000 + i * 1000}`
        ).join(',');
        const params = new UrlParams(`#earnings1=${yearPairs}`);
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(40);
        expect(earnings?.[0]).toEqual({ year: 1985, amount: 30000 });
        expect(earnings?.[39]).toEqual({ year: 2024, amount: 69000 });
      });
    });

    describe('Real-World Earnings Examples', () => {
      it('should parse typical career progression', () => {
        const params = new UrlParams(
          '#earnings1=2010:40000,2011:42000,2012:45000,2013:48000,2014:52000,2015:55000,2016:58000,2017:62000,2018:65000,2019:70000,2020:75000&dob1=1985-06-15&name1=Jordan'
        );
        expect(params.hasValidRecipientEarnings()).toBe(true);
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(11);
        expect(params.getRecipientName()).toBe('Jordan');
      });

      it('should parse career with gaps (zero earnings)', () => {
        const params = new UrlParams(
          '#earnings1=2015:50000,2016:55000,2017:0,2018:0,2019:60000,2020:65000&dob1=1980-03-20'
        );
        const earnings = params.getRecipientEarnings();
        expect(earnings?.length).toBe(6);
        expect(earnings?.filter((e) => e.amount === 0).length).toBe(2);
      });

      it('should parse couple with different earning histories', () => {
        const params = new UrlParams(
          '#earnings1=2015:80000,2016:85000,2017:90000,2018:95000,2019:100000,2020:105000&dob1=1975-11-10&name1=Pat&earnings2=2018:30000,2019:35000,2020:40000&dob2=1978-04-25&name2=Sam'
        );
        expect(params.hasValidRecipientEarnings()).toBe(true);
        expect(params.hasValidSpouseEarnings()).toBe(true);

        const recipientEarnings = params.getRecipientEarnings();
        const spouseEarnings = params.getSpouseEarnings();
        expect(recipientEarnings?.length).toBe(6);
        expect(spouseEarnings?.length).toBe(3);
      });
    });
  });
});
