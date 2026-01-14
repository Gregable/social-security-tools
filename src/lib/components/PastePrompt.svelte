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

// Name of the person we're entering data for (used in headings when isSpouse is true)
export let name: string = '';

let pasteContents: string = '';
let pasteError: boolean = false;

// Detect Mac for platform-specific keyboard shortcut
import { browser } from '$app/environment';
$: selectAllShortcut = browser && navigator.platform.toLowerCase().includes('mac')
  ? 'Cmd+A'
  : 'Ctrl+A';

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
  <div class="pasteCard">
    <h3>{name ? `Use ${name}'s SSA.gov Data` : 'Use Your SSA.gov Data'}</h3>
    <p class="subtitle">For personalized benefit estimates</p>
    <ol class="steps">
    <li>
      <strong>Sign in</strong> to
      <a target="_blank" href="https://www.ssa.gov/myaccount/">ssa.gov</a>
      <span class="muted">({name ? `${name} may need to create an account` : 'you may need to create an account'})</span>
    </li>
    <li>
      <strong>Open {name ? `${name}'s` : 'your'} earnings record</strong> &mdash;
      <a
        href="https://secure.ssa.gov/ec2/eligibility-earnings-ui/earnings-record"
        target="_blank">direct link</a
      >
      <Expando
        collapsedText="or find it manually"
        expandedText="Hide"
      >
        <p class="expandoHint">Look for <em>"Review your full earnings record now"</em> under Eligibility and Earnings</p>
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
      <strong>Copy the table</strong> &mdash; Select All ({selectAllShortcut}) works great
      <Expando
        collapsedText="See example"
        expandedText="Hide"
      >
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
      </Expando>
    </li>
    <li>
      <strong>Paste below</strong>
    </li>
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
      <div class="privateDataNotice">
        <span class="lockIcon">&#x1f512;</span>
        <span>100% private — your data never leaves your computer.</span>
        <a href="/guides/privacy" class="learnMore">Learn more</a>
      </div>
      <textarea
        wrap="soft"
        placeholder={'Paste your earnings record here'}
        bind:value={pasteContents}
      ></textarea>
    </div>
  </div>
  </div>

  {#if isSpouse}
    <div class="skipEarnings">
      <p>
        If {name || 'this person'} has no earnings history, or you just want a quick
        estimate for now, you can skip this step and assume no earnings.
      </p>
      <button class="skipButton" on:click={skipEarnings}>
        Skip - Assume No Earnings
      </button>
    </div>
  {/if}

  <Expando
    collapsedText="Alternative data entry options"
    expandedText="Alternative data entry options"
  >
    <div class="expandoContents">
      <h4>Enter Primary Insurance Amount (PIA)</h4>
      <p>
        If you already know {name ? `${name}'s` : 'your'} PIA at Full Retirement Age, enter it here.
        Note: Without the earnings record, the calculator cannot show future earnings effects.
      </p>
      <div class="piaEntry">
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

      <h4>Alternative Paste Formats</h4>
      <p>The paste box also accepts:</p>
      <ul>
        <li>Spreadsheet data (year in first column, earnings in second)</li>
        <li>Social Security Statement (less accurate due to grouped years)</li>
      </ul>
    </div>
  </Expando>
</div>

<style>
  .pastePrompt {
    margin: auto;
    max-width: min(700px, 90%);
  }

  .pasteCard {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5em;
    margin-bottom: 1.5em;
  }

  .pasteCard h3 {
    margin: 0 0 0.25em 0;
    color: #2c5f72;
    text-align: center;
  }

  .subtitle {
    text-align: center;
    color: #666;
    margin: 0 0 1.25em 0;
    font-size: 0.95em;
  }

  .muted {
    color: #888;
    font-size: 0.9em;
  }

  .fit-image {
    width: 100%;
    height: auto;
  }

  .expandoHint {
    margin: 0.5em 0;
    font-size: 0.95em;
    color: #555;
  }

  /* Styled numbered steps */
  ol.steps {
    list-style: none;
    padding: 0;
    counter-reset: step-counter;
  }

  ol.steps li {
    counter-increment: step-counter;
    margin: 1.25em 0;
    padding-left: 2.5em;
    position: relative;
    line-height: 1.5;
  }

  ol.steps li strong {
    color: #2c5f72;
  }

  ol.steps li::before {
    content: counter(step-counter);
    position: absolute;
    left: 0;
    top: 0;
    width: 1.75em;
    height: 1.75em;
    background: #4a90a4;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9em;
    font-weight: 600;
  }

  ol.steps a {
    color: #4a90a4;
    font-weight: 500;
  }

  ol.steps a:hover {
    color: #2c5f72;
  }

  .pasteArea {
    max-width: 480px;
    margin: 1.5em auto 0 auto;
    padding: 0;
    width: 100%;
    font-size: 14px;
  }

  .pasteError {
    max-width: 480px;
    margin: 0 auto 1em auto;
    padding: 0;
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
    width: 100%;
    height: 100px;
    resize: none;
    border: 2px dashed #4a90a4;
    border-radius: 8px;
    margin: 0;
    padding: 12px;
    font-size: 14px;
    background: #fff;
    box-sizing: border-box;
  }

  textarea:focus {
    outline: none;
    border-color: #2c5f72;
    background: #f8fafc;
  }

  textarea::placeholder {
    text-align: center;
    color: #888;
    padding-top: 30px;
  }

  .lockIcon {
    font-size: 16px;
    margin-right: 6px;
  }

  .privateDataNotice {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: #e8f4e8;
    border-radius: 6px;
    font-size: 0.85em;
    color: #2d6a2d;
  }

  .privateDataNotice .learnMore {
    color: #2d6a2d;
    text-decoration: underline;
    margin-left: 4px;
  }

  .privateDataNotice .learnMore:hover {
    color: #1d4a1d;
  }

  video {
    width: 100%;
    aspect-ratio: 576 / 294;
    border-radius: 4px;
  }

  .expandoContents {
    margin: 1em;
  }

  .expandoContents h4 {
    margin: 1.5em 0 0.5em 0;
    color: #2c5f72;
  }

  .expandoContents h4:first-child {
    margin-top: 0;
  }

  .piaEntry {
    margin: 0.5em 0;
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
    margin: 1.5em auto;
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
      font-size: 14px;
    }
    .pasteCard {
      padding: 1em;
    }
    ol.steps li {
      padding-left: 2em;
    }
    ol.steps li::before {
      width: 1.5em;
      height: 1.5em;
      font-size: 0.8em;
    }
  }
</style>
