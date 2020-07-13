// To update the goldens, run:
// $ update=true npm test

import puppeteer from 'puppeteer';
import Differencify from 'differencify';
import GlobalOptions from 'differencify';
import express from 'express';


async function snapshotDemo(diff, demoId) {
    await diff
      .init({testName: 'demo' + demoId})
      .launch()
      .newPage()
      .setViewport({width: 1600, height: 1700})
      .goto('http://localhost:8000/calculator.html')
      .click('button#button-demo-' + demoId)
      .screenshot({fullPage: true})
      .toMatchSnapshot()
      .result((result) => {
        expect(result).toBeTrue();
      })
      .close()
      .end();
}

describe("Visual Test", function () {
  let differencify = new Differencify({ debug: true });
  let servingConfig = express();
  servingConfig.use(express.static('./'));
  let server;

  beforeEach(function () {
    server = servingConfig.listen(8000);
  });

  afterEach(function () {
    server.close();
  });

  it('root page', async () => {
    await differencify
      .init({ testName: 'root' })
      .launch()
      .newPage()
      // Note that a '/' path won't work - express doesn't implicitly map it.
      .goto('http://localhost:8000/index.html')
      .screenshot({ fullPage: true })
      .toMatchSnapshot()
      .result((result) => {
        expect(result).toBeTrue();
      })
      .close()
      .end();
  });

  it('calculator page', async () => {
    await differencify
      .init({ testName: 'calculator' })
      .launch()
      .newPage()
      .setViewport({ width: 1600, height: 1200 })
      .goto('http://localhost:8000/calculator.html')
      .screenshot({ fullPage: true })
      .toMatchSnapshot()
      .result((result) => {
        expect(result).toBeTrue();
      })
      .close()
      .end();
  });


  it('demo0 page', async () => {
    await snapshotDemo(differencify, 0);
  });

  it('demo1 page', async () => {
    await snapshotDemo(differencify, 1);
  });

  it('demo2 page', async () => {
    await snapshotDemo(differencify, 2);
  });

  it('paste page', async () => {
    await differencify.launchBrowser();
    const target = differencify.init({ testName: 'paste', chain: false });
    await target.launch();
    const page = await target.newPage();
    await page.setViewport({ width: 1600, height: 1200 });
    await page.goto('http://localhost:8000/calculator.html');
    await page.evaluate(function () {
      document.querySelector('textarea#pastearea').value = "1980 $25,900 $25,900\n1981 $29,700 $29,700\n1982 $32,400 $32,400\n1983 $35,700 $35,700\n1984 $37,800 $37,80";
    });
    await page.focus('textarea#pastearea');
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      "document.querySelector('h3#pasteStep2') && document.querySelector('h3#pasteStep2').clientHeight != 0");
    const image = await page.screenshot({ fullPage: true });
    const result = await target.toMatchSnapshot(image);
    expect(result).toBeTrue();
    await page.close();
    await differencify.cleanup();
  });
});
