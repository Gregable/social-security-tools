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
  import "../global.css";
  import { createEventDispatcher } from "svelte";
  import { parsePaste } from "../lib/ssa-parse";
  import { Recipient } from "../lib/recipient";
  import { Birthdate } from "../lib/birthday";

  import demo0 from "../../static/pastes/averagepaste.txt?raw";
  import demo0_spouse from "../../static/pastes/averagepaste-spouse.txt?raw";
  import demo1 from "../../static/pastes/millionpaste.txt?raw";
  import demo2 from "../../static/pastes/youngpaste.txt?raw";
  import demo2_spouse from "../../static/pastes/youngpaste-spouse.txt?raw";

  const dispatch = createEventDispatcher();

  function loadDemoData(demoId: number) {
    return () => {
      let recipient: Recipient = null;
      let spouse: Recipient = null;
      if (demoId == 0) {
        recipient = new Recipient();
        recipient.earningsRecords = parsePaste(demo0);
        recipient.birthdate = new Birthdate(new Date("1950-07-01"));
        recipient.name = "Alex";

        spouse = new Recipient();
        spouse.earningsRecords = parsePaste(demo0_spouse);
        spouse.birthdate = new Birthdate(new Date("1949-03-01"));
        spouse.name = "Chris";
      } else if (demoId == 1) {
        recipient = new Recipient();
        recipient.earningsRecords = parsePaste(demo1);
        recipient.birthdate = new Birthdate(new Date("1950-08-02"));
      } else if (demoId == 2) {
        recipient = new Recipient();
        recipient.earningsRecords = parsePaste(demo2);
        recipient.birthdate = new Birthdate(new Date("1985-09-03"));
        recipient.name = "Avery";

        spouse = new Recipient();
        spouse.earningsRecords = parsePaste(demo2_spouse);
        spouse.birthdate = new Birthdate(new Date("1949-03-01"));
        spouse.name = "Riley";
      } else {
        throw new Error("Unknown demo ID: " + demoId);
      }
      dispatch("demo", {
        recipient: recipient,
        spouse: spouse,
      });
    };
  }
</script>

<div class="demoPrompt">
  <h3>Try out some <u>demo</u> data instead:</h3>
  <ul class="demos">
    <li>
      Born in 1950; earned the average US wage until 2014.
      <br />
      <button on:click={loadDemoData(0)}>&#x261b; Try the Demo</button>
    </li>
    <li>
      Born in 1950; earned maximum Social Security wages for only 5 years.
      <br />
      <button on:click={loadDemoData(1)}>&#x261b; Try the Demo</button>
    </li>
    <li>
      Born in 1990; $40k / year starting salary with 4% annual raises.
      <br />
      <button on:click={loadDemoData(2)}>&#x261b; Try the Demo</button>
    </li>
  </ul>
</div>

<style>
  .demoPrompt {
    margin: auto;
    max-width: min(660px, 80%);
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
  li {
    margin-bottom: 1em;
  }

  /** Desktop **/
  @media screen and (min-width: 1025px) {
    .demoPrompt {
      font-size: 18px;
    }
    button {
      font-size: 18px;
    }
  }

  /** Ipad **/
  @media screen and (min-width: 411px) and (max-width: 1024px) {
    .demoPrompt {
      font-size: 16px;
    }
    button {
      font-size: 14px;
    }
  }

  /** iPhone */
  @media screen and (max-width: 410px) {
    .demoPrompt {
      font-size: 12px;
    }
    button {
      font-size: 12px;
    }
  }
</style>
