<!--
  @component
  @name SpouseQuestion
  @description
    A component that prompts the user to respond as to whether or not they
    have data to enter for a spouse.

  @example
    <SpouseQuestion on:response={handleSpouseQuestion} />

  @events
    response: Fired when the user selects whether or not they have a spouse.
              event.detail:
               - `spouse` will be true iff the user has a spouse.
               - `name` will be the name of the first recipient.
               - `spousename` will be the name of the spouse, if any
-->

<script lang="ts">
// Callback prop for response event
export let onresponse:
  | ((detail: { spouse: boolean; name: string; spousename?: string }) => void)
  | undefined = undefined;

let initial: boolean = true;
export let selfname: string = 'Self';
export let spousename: string = 'Spouse';

function nospouse() {
  onresponse?.({
    spouse: false,
    name: selfname,
  });
}
function spouse() {
  initial = false;
}
function confirmSpouse() {
  onresponse?.({
    spouse: true,
    name: selfname,
    spousename: spousename,
  });
}
</script>

<div class="spouseQuestion">
  <div class="text">
    <h3>Optional: Enter data for spouse</h3>
    {#if initial}
      <div>
        <p>This site can calculate the Social Security spousal benefit.</p>
        <p>Would you like to also enter data for a spouse?</p>

        <button on:click={nospouse}>
          <ico>🧑</ico> No, Continue
        </button>
        <button on:click={spouse}>
          <ico>🧑‍🤝‍🧑</ico> Yes, Enter Spouse's Data
        </button>
      </div>
    {:else}
      <div>
        <p>
          To help keep organized, you can change the default names in the
          report:
        </p>
        <p>
          <span class="self">{selfname}</span> is the name of the person whose data
          you've already entered.
        </p>
        <p>
          <span class="spouse">{spousename}</span> is the name of the person whose
          data you'll enter next.
        </p>
        <div class="container">
          <div class="label">Name 1:</div>
          <div class="name">
            <input type="text" bind:value={selfname} />
          </div>
          <div class="label">Name 2:</div>
          <div class="name">
            <input type="text" bind:value={spousename} />
          </div>
        </div>

        <button on:click={confirmSpouse}>
          <ico>&#10003;</ico> Use these names
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .text {
    text-align: center;
    font-size: 18px;
    max-width: 600px;
    margin: 1em auto;
  }
  button {
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 18px;
    padding: 8px 26px;
    margin: 0 10px;
    min-width: 110px;
    cursor: pointer;
    background: #4ac15a;
  }
  button:hover {
    background: #2aa13a;
  }
  button > ico {
    font-weight: bold;
    font-size: 22px;
  }
  .container {
    display: grid;
    grid-template-columns: max-content max-content;
    font-size: 22px;
    width: max-content;
    margin: 1em auto;
  }
  input[type="text"] {
    font-size: 20px;
  }
  .label {
    text-align: right;
    padding-right: 0.5em;
    margin-bottom: 0.5em;
  }
  .name {
    text-align: left;
  }
  .self {
    font-weight: 900;
    color: #dd6600;
  }
  .spouse {
    font-weight: 900;
    color: #558855;
  }
</style>
