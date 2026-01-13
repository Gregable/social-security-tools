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
  export let selfname: string = "Self";
  export let spousename: string = "Spouse";

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
    <h3>Optional: Enter data for your spouse</h3>
    {#if initial}
      <div>
        <div class="info-card">
          <p class="intro">
            This site can calculate Social Security spousal benefits.
          </p>
          <ul class="benefits-list">
            <li>
              <span>
                Even if your spouse has little or no work history, they may
                still be eligible for spousal benefits based on your earnings
                record.
              </span>
            </li>
            <li>
              <span>
                You can get partial information in this report even without your
                spouse's ssa.gov login.
              </span>
            </li>
          </ul>
        </div>

        <p class="question">
          Would you like to also enter data for your spouse?
        </p>

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
  .info-card {
    background: linear-gradient(135deg, #f0f7ff 0%, #e8f4f8 100%);
    border: 1px solid #cde4f0;
    border-radius: 12px;
    padding: 1.25em 1.5em;
    margin: 1em 0 1.5em 0;
    text-align: left;
  }
  .info-card .intro {
    font-size: 1.1em;
    color: #2c5282;
    margin: 0 0 0.75em 0;
    font-weight: 500;
    text-align: center;
  }
  .benefits-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .benefits-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.75em;
    margin-bottom: 0.6em;
    line-height: 1.4;
    color: #4a5568;
  }
  .benefits-list li:last-child {
    margin-bottom: 0;
  }
  .benefits-list .icon {
    flex-shrink: 0;
    font-size: 1.1em;
  }
  .question {
    font-weight: 500;
    color: #2d3748;
    margin: 1.25em 0;
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
