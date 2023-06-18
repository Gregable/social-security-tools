<script>
</script>

<div class="pastePrompt">
  <p>
    To use the calculator, you must provide some data from your Social Security
    record.
  </p>
  <p>
    If you aren't ready for that yet, select a demo data set at the bottom of
    the page.
  </p>

  <h1>Retrieve <u>your</u> Social Security data:</h1>
  <ol>
    <li>
      Sign in to
      <a target="_blank" href="https://secure.ssa.gov/RIL/SiView.action"
        >ssa.gov</a
      >. You may need to create an account if you haven't already.
    </li>
    <li>
      In the section "Eligibility and Earnings", click the link labelled "Review
      your full earnings record now".
    </li>
    <li>
      Copy the "Earnings Record" table. It should look similar to the example
      below, with different numbers and years.
      <video
        autoplay
        playsinline
        loop
        muted
        disableRemotePlayback
        width="576"
        height="294"
        poster="/static/copy-paste-demo-poster.jpg"
        title="Animation showing a user copying a social security earnings record from ssa.gov."
      >
        <source src="/static/copy-paste-demo.mp4" type="video/mp4" />
      </video>
      You can select the table by dragging your mouse over the entire table to select,
      or you can just use 'Control+A' to select the entire page. Either way will
      work. Copy the text with 'Control+C'.
    </li>
    <li>
      Return to this page, paste the result into the text area below with
      'Control+V'.
    </li>
  </ol>

  <div class="pasteArea">
    <div>
      <textarea wrap="off" placeholder={"\n\nPaste Result Here"} />
      <p>
        &#x1f512; Your data never leaves your own computer: the report is
        generated entirely by JavaScript in your browser.
      </p>
    </div>
  </div>

  <p>
    Alternatively, just paste any text formatted string with year and earnings
    in the same line, for example:
  </p>
  <pre class="pasteableData">2000 $10,000
2001 $15,000</pre>

  <h1>Try out some <u>demo</u> data instead:</h1>
  <p>
    If you aren't ready to take a look at your own Social Security data, you can
    first play with some fictional account data.
  </p>
  <ul class="demos">
    <li>
      Retiree born in 1950, who earned roughly the average US wage.
      <br />
      <button>&#x261b; Try the Demo</button>
    </li>
    <li>
      Retiree born in 1950 who earned the maximum Social Security wages over
      five years, but nothing otherwise.
      <br />
      <button>&#x261b; Try the Demo</button>
    </li>
    <li>
      Early career, born in 1985, $40k/year starting salary in 2005 with 4%
      annual raises.
      <br />
      <button>&#x261b; Try the Demo</button>
    </li>
  </ul>
</div>

<style>
  .pastePrompt {
    margin: auto;
  }
  h1 {
    font-weight: 500;
    line-height: 1.1;
  }
  .pasteArea {
    max-width: 480px;
    margin: 0 auto 0 auto;
    width: 100%;
    font-size: 14px;
  }
  textarea {
    width: 100%;
    height: 100px;
    resize: none;
    border: 1px solid #ccc;
    margin: 0;
  }
  textarea::-webkit-input-placeholder {
    /**
     * Horizontally enter the placeholder text "Place Result Here".
     */
    text-align: center;
    vertical-align: bottom;
  }
  .pasteableData {
    margin: auto;
    width: 140px;
  }
  button {
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 18px;
    padding: 4px 16px;
    margin: 0 10px;
    cursor: pointer;
    background: #4ac15a;
  }

  /** Desktop **/
  @media screen and (min-width: 1025px) {
    .pastePrompt {
      max-width: 660px;
      font-size: 18px;
    }
    h1 {
      font-size: 28px;
    }
    .pastePrompt li {
      margin: 20px;
    }
    .pasteArea {
      padding: 0px 40px 0px 40px;
    }
  }

  /** Ipad **/
  @media screen and (min-width: 421px) and (max-width: 1024px) {
    .pastePrompt {
      max-width: 660px;
      font-size: 16px;
    }
    h1 {
      font-size: 28px;
    }

    .pastePrompt li {
      margin: 20px;
    }
    .pasteArea {
      padding: 0px 40px 0px 40px;
    }
  }

  /** iPhone */
  @media screen and (max-width: 420px) {
    .pastePrompt {
      max-width: 100%;
      font-size: 12px;
    }
    h1 {
      font-size: 20px;
    }
    .pastePrompt li {
      margin: 10px;
    }
    .pasteArea {
      padding: 0px 20px 0px 20px;
    }
    ol {
      padding-inline-start: 20px;
    }
  }
</style>
