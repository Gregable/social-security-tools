<!--
  @component
  @name PastePrompt
  @description
    A component that prompts the user to paste their earnings record.

  @example
    <PastePrompt on:paste={handlePaste} />

  @events
    paste: Fired when the user ../static/pastes their earnings record. The event detail
      contains { recipient: Recipient } with the parsed earnings record.
-->

<script lang="ts">
  import "$lib/global.css";
  import { createEventDispatcher } from "svelte";
  import { parsePaste } from "$lib/ssa-parse";
  import { Recipient } from "$lib/recipient";

  const dispatch = createEventDispatcher();

  let pasteContents: string = "";

  function parsePasteContents(contents: string) {
    if (contents == "") return;
    const records = parsePaste(contents);
    if (records.length > 0) {
      let recipient: Recipient = new Recipient();
      recipient.earningsRecords = records;

      dispatch("paste", {
        recipient: recipient,
      });
    }
  }
  $: parsePasteContents(pasteContents);
</script>

<div class="pastePrompt">
  <h3>Step 1 of 3: Retrieve Social Security data</h3>
  <ol>
    <li>
      Sign in to
      <a target="_blank" href="https://secure.ssa.gov/RIL/SiView.action"
        >ssa.gov</a
      >. You may need to create an account if you haven't already.
    </li>
    <li>
      In the section "Eligibility and Earnings", click the link labelled "Review
      your full earnings record now". If you cannot find the link, click <a
        href="https://secure.ssa.gov/ec2/eligibility-earnings-ui/earnings-record"
        >this link</a
      >
      after signing in.
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
        poster="/copy-paste-demo-poster.jpg"
        title="Animation showing a user copying a social security earnings record from ssa.gov."
      >
        <source src="/copy-paste-demo.mp4" type="video/mp4" />
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
      <textarea
        wrap="off"
        placeholder={"\n\nPaste Result Here"}
        bind:value={pasteContents}
      />
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
</div>

<style>
  .pastePrompt {
    margin: auto;
    max-width: min(660px, 80%);
  }
  ol {
    padding-inline-start: 5%;
  }
  li {
    margin: 10px;
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
