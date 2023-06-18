<script>
  import "../global.css";
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
    max-width: min(660px, 80%);
  }
  ol,
  ul {
    padding-inline-start: 5%;
  }
  li {
    margin: 10px;
  }
  h1 {
    font-weight: 500;
    line-height: 1.1;
  }
  .pasteArea {
    max-width: 480px;
    margin: 0 auto 0 auto;
    padding: 0 20px 0 20px;
    width: 100%;
    font-size: 14px;
  }
  textarea {
    /* Leave room for the padding in the pasteArea div. */
    width: 100%;
    height: 100px;
    resize: none;
    border: 1px solid #ccc;
    margin: 0;
  }
  video {
    width: 100%;
    aspect-ratio: 576 / 294;
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
    padding: 4px 16px;
    margin: 2px 2px 0 0;
    cursor: pointer;
    background: #4ac15a;
  }

  /** Desktop **/
  @media screen and (min-width: 1025px) {
    .pastePrompt {
      font-size: 18px;
    }
    h1 {
      font-size: 28px;
    }
    button {
      font-size: 18px;
    }
  }

  /** Ipad **/
  @media screen and (min-width: 411px) and (max-width: 1024px) {
    .pastePrompt {
      font-size: 16px;
    }
    h1 {
      font-size: 28px;
    }
    button {
      font-size: 14px;
    }
  }

  /** iPhone */
  @media screen and (max-width: 410px) {
    .pastePrompt {
      font-size: 12px;
    }
    h1 {
      font-size: 20px;
    }
    button {
      font-size: 12px;
    }
  }
</style>
