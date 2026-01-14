<!--
  @component
  @name DemoData
  @description
    A component that allows the user to load demo data in lieu of pasting their
    own earnings record.

  @example
    <DemoData on:demo={handleDemo} />

  @events
    demo: Fired when the user selects a demo record. The event detail contains
      { recipient: Recipient, spouse: ?Recipient } with parsed earning records
      and birthdates.

-->

<script lang="ts">
import { Birthdate } from '$lib/birthday';
import demoPaste from '$lib/pastes/averagepaste.txt?raw';
import demoSpousePaste from '$lib/pastes/averagepaste-spouse.txt?raw';
import { Recipient } from '$lib/recipient';
import { parsePaste } from '$lib/ssa-parse';

export let ondemo:
  | ((detail: { recipient: Recipient; spouse: Recipient | null; demoType?: string }) => void)
  | undefined = undefined;

function loadDemoData() {
  // All of the demo birthdays are on the 2nd of the month. This is to
  // make their filing date math as simple as possible. If you are born on
  // the 2nd, then you attain an age on the 1st and are that age through
  // the entire same month that you are born.
  const recipient = new Recipient();
  recipient.earningsRecords = parsePaste(demoPaste);
  recipient.birthdate = Birthdate.FromYMD(1965, 6, 2);
  recipient.name = 'Alex';

  const spouse = new Recipient();
  spouse.earningsRecords = parsePaste(demoSpousePaste);
  spouse.birthdate = Birthdate.FromYMD(1966, 3, 2);
  spouse.name = 'Chris';

  ondemo?.({
    recipient,
    spouse,
    demoType: 'average_earner_couple',
  });
}
</script>

<div class="demoCard">
  <div class="demoContent">
    <h3>Just exploring?</h3>
    <p class="demoDescription">
      Try the calculator with sample data to see how it works.
    </p>
    <button on:click={loadDemoData}>Try the Demo</button>
  </div>
</div>

<style>
  .demoCard {
    margin: 1.5em auto 2em auto;
    max-width: min(480px, 90%);
    background: #f0f7fa;
    border: 2px solid #4a90a4;
    border-radius: 12px;
    padding: 1.5em;
  }

  .demoContent {
    text-align: center;
  }

  .demoContent h3 {
    margin: 0 0 0.5em 0;
    color: #2c5f72;
    font-size: 1.25em;
  }

  .demoDescription {
    margin: 0 0 1em 0;
    color: #444;
    line-height: 1.4;
  }

  button {
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    padding: 12px 32px;
    cursor: pointer;
    background: #4a90a4;
    font-size: 18px;
    font-weight: 500;
    transition: background 0.2s;
  }

  button:hover {
    background: #3a7a8e;
  }

  /** Desktop **/
  @media screen and (min-width: 1025px) {
    .demoCard {
      font-size: 18px;
    }
  }

  /** Ipad **/
  @media screen and (min-width: 411px) and (max-width: 1024px) {
    .demoCard {
      font-size: 16px;
    }
  }

  /** iPhone */
  @media screen and (max-width: 410px) {
    .demoCard {
      font-size: 14px;
      padding: 1em;
    }
    button {
      padding: 10px 24px;
      font-size: 16px;
    }
  }
</style>
