<!--
  @component
  @name PastePrompt
  @description
    A component that prompts the user to paste their earnings record.

  @example
    <PastePrompt on:paste={handlePaste} />

  @events
    paste: Fired when the user pastes their earnings record. The event detail
      contains { recipient: Recipient } with the parsed earnings record.
-->

<script lang="ts">
import Expando from '$lib/components/Expando.svelte';
import EarningsRecordLinkImage from '$lib/images/earnings-record-link.png';
import { Money } from '$lib/money';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';
import CopyPasteDemoMp4 from '$lib/videos/copy-paste-demo.mp4';
import CopyPasteDemoPoster from '$lib/videos/copy-paste-demo-poster.jpg';

// Callback prop for paste event
export let onpaste: ((detail: { recipient: Recipient }) => void) | undefined =
  undefined;

// Whether we're entering data for a spouse (shows skip option)
export let isSpouse: boolean = false;

let pasteContents: string = '';
let pasteError: boolean = false;

function parsePasteContents(contents: string) {
  if (contents === '') {
    pasteError = false;
    return;
  }
  const records = parsePaste(contents);
  if (records.length > 0) {
    let recipient: Recipient = new Recipient();
    recipient.earningsRecords = records;

    onpaste?.({
      recipient: recipient,
    });
  } else {
    pasteError = true;
  }
}
$: parsePasteContents(pasteContents);

let piaInput: number | null = null;
let piaDisabled: boolean = true;
function piaEntry() {
  if (piaInput === null) return;

  let recipient: Recipient = new Recipient();
  recipient.setPia(Money.from(piaInput));

  onpaste?.({
    recipient: recipient,
  });
}
$: piaDisabled = (() => {
  if (piaInput === null) return true;
  return piaInput < 0;
})();

function skipEarnings() {
  let recipient: Recipient = new Recipient();
  recipient.setPia(Money.from(0));
  onpaste?.({ recipient: recipient });
}
</script>

<div class="pastePrompt">
  <h3>Retrieve Social Security data</h3>
  <div class="subheading">Preferred Option</div>
  <ol>
    <li>
      Sign in to
      <a target="_blank" href="https://www.ssa.gov/myaccount/">ssa.gov here</a>.
      You may need to create an account.
    </li>
    <li>
      In the section <span class="referenceText"
        >"Eligibility and Earnings"</span
      >, click the link
      <span class="referenceText">"Review your full earnings record now"</span>.
      If you cannot find it, click
      <a
        href="https://secure.ssa.gov/ec2/eligibility-earnings-ui/earnings-record"
        target="_blank">this link</a
      >
      after signing in.
      <Expando
        collapsedText="Show me what the link looks like"
        expandedText="Hide"
      >
        <img
          src={EarningsRecordLinkImage}
          alt="Screenshot of the link to the earnings record on ssa.gov."
          width="991"
          height="568"
          class="fit-image"
        />
      </Expando>
    </li>
    <li>
      Copy the Earnings Record table.
      <video
        autoplay
        playsinline
        loop
        muted
        disableRemotePlayback
        poster={CopyPasteDemoPoster}
        title="Animation showing a user copying a social security earnings record from ssa.gov."
      >
        <source src={CopyPasteDemoMp4} type="video/mp4" />
      </video>
      Select the table by clicking and dragging or just select the entire page. Either
      way will work.
    </li>
    <li>Return here, paste the result into the text area below:</li>
  </ol>
  {#if pasteError}
    <div class="pasteError">
      <span class="warningIcon">&#x26A0;</span>
      <p>
        The data you have pasted could not be parsed. Please clear the box and
        try again. <a href="/guides/earnings-record-paste" target="_blank"
          >Additional Help</a
        >
      </p>
    </div>
  {/if}
  <div class="pasteArea">
    <div>
      <textarea
        wrap="soft"
        placeholder={'\n\nPaste Result Here'}
        bind:value={pasteContents}
      ></textarea>
      <div class="privateDataNotice">
        <span class="lockIcon">&#x1f512;</span>
        <p>
          Your data never leaves your computer: the report is generated entirely
          by JavaScript in your browser.
        </p>
      </div>
    </div>
  </div>

  {#if isSpouse}
    <div class="skipEarnings">
      <p>
        If your spouse has no earnings history, or you just want to get a quick
        estimate for now, you can skip this step and assume no earnings. You can
        always come back later to enter more accurate data.
      </p>
      <button class="skipButton" on:click={skipEarnings}>
        Skip - Assume No Earnings
      </button>
    </div>
  {/if}

  <div class="subheading">Alternative Options</div>
  <Expando
    collapsedText="Enter Primary Insurance Amount (PIA)"
    expandedText="Enter Primary Insurance Amount (PIA)"
  >
    <div class="expandoContents">
      <p>
        If you already know the Primary Insurance Amount (PIA) at Normal
        Retirement Age (aka "Full Retirement Age"), you can enter it here.
      </p>
      <p>
        <u>Not Preferred</u>: Without your earnings record, the calculator
        cannot help you understand the effect of earnings in the future.
      </p>
      <div>
        <label for="piaInput">Primary Insurance Amount: </label>
        <div>
          $<input
            id="piaInput"
            class="piaInput"
            type="number"
            min="0"
            bind:value={piaInput}
          />
        </div>
        <button on:click={piaEntry} disabled={piaDisabled}>
          <ico>&#10003;</ico> Submit
        </button>
      </div>
    </div>
  </Expando>
  <Expando
    collapsedText="Enter earnings data in alternative formats"
    expandedText="Enter earnings data in alternative formats"
  >
    <div class="expandoContents">
      <p>The box above also accepts earnings in alternative formats.</p>
      <ul>
        <li>
          <p>Copy / paste from a spreadsheet or text file.</p>
          <p>
            The records must be one row per year, with the year in the first
            column and the earnings in the second column. For example:
          </p>
          <pre class="spreadsheetPasteExample">
            2015 $5,000
            2014 $4,000
            2013 $3,000
            2012 $2,000
            2011 $1,000
          </pre>
        </li>
        <li>
          <p>
            Copy / paste from your Social Security Statement (not preferred).
          </p>
          <p>
            Your Social Security Statement groups older work years together in
            ranges rather than listing each year individually, e.g. "2001-2005".
            This calculator will assume you earned the average of the range for
            each year. This is only approximate and may result in small errors.
          </p>
        </li>
      </ul>
    </div>
  </Expando>
</div>

<style>
  .pastePrompt {
    margin: auto;
    max-width: min(660px, 80%);
  }
  .referenceText {
    font-family: 'Times New Roman', serif;
  }
  .fit-image {
    width: 100%;
    height: auto;
  }
  h3 {
    margin-bottom: 0px;
  }
  .subheading {
    font-size: 14px;
    font-weight: bold;
    margin-top: 6px;
    color: rgb(80, 80, 80);
  }
  ol {
    padding-inline-start: 5%;
  }
  li {
    margin: 10px;
  }
  .pasteArea {
    max-width: 480px;
    margin: 0 auto 40px auto;
    padding: 0 20px 0 20px;
    width: 100%;
    font-size: 14px;
  }
  .pasteError {
    max-width: 480px;
    margin: 0 auto;
    padding: 0 20px 0 20px;
    width: 100%;
    font-size: 16px;
    display: grid;
    grid-template-columns: min-content auto;
  }
  .warningIcon {
    font-size: 32px;
    color: #ff0000;
    padding: 0 10px 0 0;
  }
  textarea {
    /* Leave room for the padding in the pasteArea div. */
    width: 100%;
    height: 100px;
    resize: none;
    border: 1px solid #ccc;
    margin: 0;
  }
  .lockIcon {
    font-size: 26px;
    color: #0000ff;
    padding: 0 10px 0 0;
  }
  .privateDataNotice {
    display: grid;
    grid-template-columns: min-content auto;
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
  .expandoContents {
    margin: 1em;
  }
  .spreadsheetPasteExample {
    margin-left: 1.5em;
    white-space: pre-line;
  }

  .piaInput {
    margin-left: 4px;
    font-size: 18px;
    max-width: 5em;
  }

  /* Hide the arrows from number inputs. */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  button {
    background: #4ac15a;
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 14px;
    padding: 2px 0px;
    margin: 5px 0px;
    min-width: 90px;
    cursor: pointer;
  }
  button:disabled,
  button:disabled:hover {
    background: #ccc;
    cursor: not-allowed;
  }
  button:hover {
    background: #2aa13a;
  }

  button ico {
    font-weight: bold;
    font-size: 22px;
    vertical-align: middle;
  }

  .skipEarnings {
    max-width: 480px;
    margin: 0 auto 30px auto;
    padding: 15px 20px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: center;
  }
  .skipEarnings p {
    margin: 0 0 12px 0;
    color: #555;
    font-size: 14px;
  }
  .skipButton {
    background: #6b8e9f;
    padding: 8px 20px;
  }
  .skipButton:hover {
    background: #4a6d7e;
  }

  /** Desktop **/
  @media screen and (min-width: 1025px) {
    .pastePrompt {
      font-size: 18px;
    }
  }

  /** Ipad **/
  @media screen and (min-width: 411px) and (max-width: 1024px) {
    .pastePrompt {
      font-size: 16px;
    }
  }

  /** iPhone */
  @media screen and (max-width: 410px) {
    .pastePrompt {
      font-size: 12px;
    }
  }
</style>
