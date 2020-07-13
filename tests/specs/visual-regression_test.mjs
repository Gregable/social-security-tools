// To update the goldens, run:
// $ update=true npm test

import puppeteer from 'puppeteer';
import Differencify from 'differencify';
import GlobalOptions from 'differencify';
import express from 'express';

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


  it('gregable', async () => {
    await differencify
      .init({testName: 'root'})
      .launch()
      .newPage()
      // Note that a '/' path won't work - express doesn't implicitly map it.
      .goto('http://localhost:8000/index.html')
      .screenshot()
      .toMatchSnapshot()
      .result((result) => {
        expect(result).toBeTrue();
      })
      .close()
      .end();
  });
});
