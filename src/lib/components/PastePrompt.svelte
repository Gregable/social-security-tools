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
  import "$lib/global.css";
  import { createEventDispatcher } from "svelte";
  import { parsePaste } from "$lib/ssa-parse";
  import { Recipient } from "$lib/recipient";
  import Expando from "$lib/components/Expando.svelte";
  import CopyPasteDemoMp4 from "$lib/videos/copy-paste-demo.mp4";
  import CopyPasteDemoPoster from "$lib/videos/copy-paste-demo-poster.jpg";
  import EarningsRecordLinkImage from "$lib/images/earnings-record-link.png";

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
  <h3>Step 1 of 2: Retrieve Social Security data</h3>
  <ol>
    <li>
      Sign in to
      <a target="_blank" href="https://secure.ssa.gov/RIL/SiView.action"
        >ssa.gov</a
      >. You may need to create an account.
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
      <Expando collapsedText="Show me what it looks like" expandedText="Hide">
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
</div>

<style>
  .pastePrompt {
    margin: auto;
    max-width: min(660px, 80%);
  }
  .referenceText {
    font-family: "Times New Roman", serif;
  }
  .fit-image {
    width: 100%;
    height: auto;
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
