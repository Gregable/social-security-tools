// To update the goldens, run:
// $ update=true npm test

import puppeteer from 'puppeteer';
import Differencify from 'differencify';
import GlobalOptions from 'differencify';
import express from 'express';

//const servingConfig = express();
//const differencify = new Differencify({ debug: true });

//servingConfig.use(express.static('/'));
//let server = servingConfig.listen(8000);

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
      // Note that / won't work - express doesn't explicitly map it.
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
