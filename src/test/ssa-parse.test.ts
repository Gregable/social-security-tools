import * as constants from '../lib/constants';
import {dollarStringToNumber, parsePaste} from '../lib/ssa-parse';


describe('dollarStringToNumber', () => {
  it('Parses Number', () => {
    expect(dollarStringToNumber('123')).toBe(123);
  });
  it('Parses Dollars', () => {
    expect(dollarStringToNumber('$123')).toBe(123);
  });
  it('Parses Dollars with thousands', () => {
    expect(dollarStringToNumber('$1,234')).toBe(1234);
  });
});

// All of the parsePaste tests below have the same data, just in different
// formats. We use one f'n to test the expected output of all of them.
function parsePasteExpect(parsed) {
  expect(parsed.length).toBe(3);
  expect(parsed[0].year).toBe(2016);
  expect(parsed[0].taxedEarnings).toBe(80000);
  expect(parsed[1].year).toBe(2017);
  expect(parsed[1].taxedEarnings).toBe(90000);
  expect(parsed[2].year).toBe(2018);
  expect(parsed[2].taxedEarnings).toBe(100000);
}

describe('parsePaste', () => {
  it('Parses Simple Space Delimited Data', () => {
    let pasteData = '2018 $100,000\n2017 $90,000\n2016 $80,000';
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.tools own formatted table', () => {
    let pasteData =
        ('Year\tAge\tTaxed Earnings\t\tMultiplier\tIndexed Earnings\t\t\n' +
         '2016\t21\t$80,000\tx\t1.01\t=\t$80,900\tTop 35 Value\n' +
         '2017\t22\t$90,000\tx\t1.00\t=\t$90,000\t\n' +
         '2018\t23\t$100,000\tx\t1.00\t=\t$100,000\t\n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Chrome, Linux, Full Page)', () => {
    let pasteData =
        ('KSkip to Content\n' +
         'my Social Security\n' +
         'Uncle Sam Sign Out\n' +
         'My Home  Message Center  Security Settings\n' +
         'Earnings Record\n' +
         'Overview\n' +
         'Estimated Benefits\n' +
         'Earnings Record\n' +
         'Replacement Documents\n' +
         'Social Security Statement\n' +
         'Your benefits are based on your earnings. If our records are wrong' +
         'you may not receive all the benefits to which you\'re entitled.\n' +
         '\n' +
         'Review your earnings record carefully...\n' +
         'Limits on taxable earnings for Social Security...\n' +
         'Contact us about errors...\n' +
         'Work Year\n' +
         'Taxed Social Security Earnings\n' +
         'Taxed Medicare Earnings\n' +
         '2018\t$100,000\t$100,000\n' +
         '2017\t$90,000\t$90,000\n' +
         '2016\t$80,000\t$80,000\n' +
         'Estimated Total Taxes Paid\n' +
         'For Social Security\n' +
         'Paid by you:\n' +
         '$10,000\n' +
         'Paid by your employers:\n' +
         '$10,000\n' +
         'For Medicare\n' +
         'Paid by you:\n' +
         '$10,000\n' +
         'Paid by your employers:\n' +
         '$10,000\n' +
         'Print / Save Your Full Statement\n' +
         'Get a copy of your Statement information in a convenient, ' +
         'print-friendly format.\n\n' +
         'Disclaimer\n' +
         'Download Your Statement Data\n' +
         'Save your Statement information as an XML file.\n\n' +
         'How to use this file.\n' +
         'Privacy PolicyAccessibility Help\n\n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Chrome, Linux, Full Table)', () => {
    let pasteData =
        ('Work Year\n' +
         'Taxed Social Security Earnings\n' +
         'Taxed Medicare Earnings\n' +
         '2018\t$100,000\t$100,000\n' +
         '2017\t$90,000\t$90,000\n' +
         '2016\t$80,000\t$80,000\n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Chrome, Linux, Table Rows)', () => {
    let pasteData =
        ('2018\t$100,000\t$100,000\n' +
         '2017\t$90,000\t$90,000\n' +
         '2016\t$80,000\t$80,000\n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Firefox, Linux, Full Page)', () => {
    let pasteData =
        ('\n' +
         'K\n' +
         'Skip to Content\n' +
         'my Social Security\n\n' +
         '    Gregory A. Grothaus Sign Out \n\n' +
         '    My Home Message Center Security Settings \n\n' +
         'Earnings Record\n' +
         'Overview\n' +
         'Estimated Benefits\n' +
         'Earnings Record\n' +
         'Replacement Documents\n' +
         'Social Security Statement\n\n' +
         'Your benefits are based on your earnings. If our records are wrong ' +
         'you may not receive all the benefits to which you\'re entitled.\n' +
         'Review your earnings record carefully...\n' +
         'Limits on taxable earnings for Social Security...\n' +
         'Contact us about errors...\n' +
         'Work Year\n\t\n' +
         'Taxed Social Security Earnings\n\t\n' +
         'Taxed Medicare Earnings\n' +
         '2018 \t$100,000 \t$100,000\n' +
         '2017 \t$90,000 \t$90,000\n' +
         '2016 \t$80,000 \t$80,000\n' +
         'Estimated Total Taxes Paid\n' +
         'For Social Security\n' +
         'Paid by you:\n' +
         '$100,082\n' +
         'Paid by your employers:\n' +
         '$104,593\n' +
         'For Medicare\n' +
         'Paid by you:\n' +
         '$104,437\n' +
         'Paid by your employers:\n' +
         '$104,437\n' +
         'Print / Save Your Full Statement\n\n' +
         'Get a copy of your Statement information in a convenient, ' +
         'print-friendly format.\n' +
         'Disclaimer\n' +
         'Download Your Statement Data\n\n' +
         'Save your Statement information as an XML file.\n' +
         'How to use this file.\n\n' +
         '    Privacy PolicyAccessibility Help\n\n\n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Firefox, Linux, Full Table)', () => {
    let pasteData =
        ('Work Year\n\t\n' +
         'Taxed Social Security Earnings\n\t\n' +
         'Taxed Medicare Earnings\n' +
         '2018 \t$100,000 \t$100,000\n' +
         '2017 \t$90,000 \t$90,000\n' +
         '2016 \t$80,000 \t$80,000\n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Firefox, Linux, Table Rows)', () => {
    let pasteData =
        ('2018 \t$100,000 \t$100,000\n' +
         '2017 \t$90,000 \t$90,000\n' +
         '2016 \t$80,000 \t$80,000\n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format with trailing whitespace', () => {
    // User report here indicates that trailing whitespace breaks parsing:
    // http://www.early-retirement.org/forums/f28/fire-effect-on-ss-benefits-96343-3.html#post2196019
    let pasteData =
        ('Work Year \n' +
         'Taxed Social Security Earnings \n' +
         'Taxed Medicare Earnings \n' +
         '2018\t$100,000\t$100,000 \n' +
         '2017\t$90,000\t$90,000 \n' +
         '2016\t$80,000\t$80,000 \n');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Edge, Windows, Full Page)', () => {
    let pasteData =
        ('K\n' +
         'Skip to Content\n' +
         'my Social Security\n' +
         'Uncle Sam Sign Out \n' +
         'My Home Message Center Security Settings \n' +
         'Earnings Record\n' +
         'Overview\n' +
         'Estimated Benefits\n' +
         'Earnings Record\n' +
         'Replacement Documents\n' +
         '\n' +
         'Social Security Statement\n' +
         'Your benefits are based on your earnings. If our records are wrong ' +
         'you may not receive all the benefits to which you\'re entitled. \n' +
         'Review your earnings record carefully... \n' +
         'Limits on taxable earnings for Social Security... \n' +
         'Contact us about errors... \n' +
         'Work Year \n' +
         'Taxed Social Security Earnings \n' +
         'Taxed Medicare Earnings \n' +
         '2018 \n' +
         '$100,000 \n' +
         '$100,000 \n' +
         '2017 \n' +
         '$90,000 \n' +
         '$90,000 \n' +
         '2016 \n' +
         '$80,000 \n' +
         '$80,000 \n' +
         'Estimated Total Taxes Paid\n' +
         'For Social Security \n' +
         'Paid by you: \n' +
         '$000,000 \n' +
         'Paid by your employers: \n' +
         '$000,000 \n' +
         'For Medicare \n' +
         'Paid by you: \n' +
         '$000,000 \n' +
         'Paid by your employers: \n' +
         '$000,000 \n' +
         'Print / Save Your Full Statement \n' +
         'Get a copy of your Statement information in a convenient, ' +
         'print-friendly format. \n' +
         'Disclaimer \n' +
         'Download Your Statement Data \n' +
         'Save your Statement information as an XML file. \n' +
         'How to use this file. \n' +
         'Privacy PolicyAccessibility Help');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Edge, Windows, Full Table)', () => {
    let pasteData =
        ('Work Year \n' +
         'Taxed Social Security Earnings \n' +
         'Taxed Medicare Earnings \n' +
         '2018 \n' +
         '$100,000 \n' +
         '$100,000 \n' +
         '2017 \n' +
         '$90,000 \n' +
         '$90,000 \n' +
         '2016 \n' +
         '$80,000 \n' +
         '$80,000');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format (Edge, Windows, Table Rows)', () => {
    let pasteData =
        ('2018 \n' +
         '$100,000 \n' +
         '$100,000 \n' +
         '2017 \n' +
         '$90,000 \n' +
         '$90,000 \n' +
         '2016 \n' +
         '$80,000 \n' +
         '$80,000');
    parsePasteExpect(parsePaste(pasteData));
  });

  it('Parses ssa.gov format before medicare', () => {
    let pasteData =
        ('1966\t$2,966\t$2,966\n' +
         '1965\t$2,965\tMedicare Began in 1966\n' +
         '1964\t$2,964\n' +
         '1963\t$2,963');
    const parsed = parsePaste(pasteData);
    expect(parsed.length).toBe(4);
    expect(parsed[0].year).toBe(1963);
    expect(parsed[0].taxedEarnings).toBe(2963);
    expect(parsed[1].year).toBe(1964);
    expect(parsed[1].taxedEarnings).toBe(2964);
    expect(parsed[2].year).toBe(1965);
    expect(parsed[2].taxedEarnings).toBe(2965);
    expect(parsed[3].year).toBe(1966);
    expect(parsed[3].taxedEarnings).toBe(2966);
  });
});
