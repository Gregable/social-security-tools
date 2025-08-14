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
  import { parsePaste } from '$lib/ssa-parse';
  import { Recipient } from '$lib/recipient';
  import { Birthdate } from '$lib/birthday';

  import demo0 from '$lib/pastes/averagepaste.txt?raw';
  import demo0_spouse from '$lib/pastes/averagepaste-spouse.txt?raw';
  import demo1 from '$lib/pastes/millionpaste.txt?raw';
  import demo2 from '$lib/pastes/youngpaste.txt?raw';
  import demo2_spouse from '$lib/pastes/youngpaste-spouse.txt?raw';

  // Callback prop for demo event
  export let ondemo:
    | ((detail: { recipient: Recipient; spouse: Recipient | null }) => void)
    | undefined = undefined;

  function loadDemoData(demoId: number) {
    return () => {
      let recipient: Recipient | null = null;
      let spouse: Recipient | null = null;
      // All of the demo birthdays are on the 2nd of the month. This is to
      // make their filing date math as simple as possible. If you are born on
      // the 2nd, then you attain an age on the 1st and are that age through
      // the entire same month that you are born.
      if (demoId == 0) {
        recipient = new Recipient();
        recipient.earningsRecords = parsePaste(demo0);
        recipient.birthdate = Birthdate.FromYMD(1950, 6, 2);
        recipient.name = 'Alex';

        spouse = new Recipient();
        spouse.earningsRecords = parsePaste(demo0_spouse);
        spouse.birthdate = Birthdate.FromYMD(1949, 3, 2);
        spouse.name = 'Chris';
      } else if (demoId == 1) {
        recipient = new Recipient();
        recipient.earningsRecords = parsePaste(demo1);
        recipient.birthdate = Birthdate.FromYMD(1950, 8, 2);
      } else if (demoId == 2) {
        recipient = new Recipient();
        recipient.earningsRecords = parsePaste(demo2);
        recipient.birthdate = Birthdate.FromYMD(1985, 9, 2);
        recipient.name = 'Avery';

        spouse = new Recipient();
        spouse.earningsRecords = parsePaste(demo2_spouse);
        spouse.birthdate = Birthdate.FromYMD(1986, 3, 2);
        spouse.name = 'Riley';
      } else {
        throw new Error('Unknown demo ID: ' + demoId);
      }
      ondemo?.({
        recipient: recipient,
        spouse: spouse,
      });
    };
  }
</script>

<div class="demoPrompt">
  <p>
    To use the social security calculator, you must provide data from your
    Social Security record. If you aren't ready for that yet, try the demo using
    sample data:

    <button on:click={loadDemoData(0)}>&#x261b; Try the Demo</button>
  </p>

  <!--
    Undecided if we want to keep the multiple demo option, so commenting out
    for now.
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
  -->
</div>

<style>
  .demoPrompt {
    margin: 0 auto 2em auto;
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
