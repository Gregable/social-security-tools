<script lang="ts">
  import "../global.css";
  import { EarningRecord } from "../lib/earning-record";

  export let earningsRecords: Array<EarningRecord> = [];

  function wholeDollars(n: number) {
    return "$" + Math.round(n).toLocaleString();
  }
</script>

<div>
  {#if earningsRecords.length > 0}
    <table class="earnings-table">
      <thead>
        <tr>
          <th class="workyear">Year</th>
          <th class="age onlydisplay500">Age</th>
          <th class="taxedearnings">Taxed Earnings</th>
          <th class="epc">Earnings Per Credit</th>
          <th class="credits">Credits</th>
        </tr>
      </thead>
      <tbody>
        {#each earningsRecords as earningRecord}
          <tr>
            <td class="workyear">{earningRecord.year}</td>
            <td class="age onlydisplay500">
              {earningRecord.age}
            </td>
            {#if earningRecord.incomplete}
              <td colspan="3" class="taxedearnings" style="text-align:center">
                Not yet recorded
              </td>
            {:else}
              <td class="taxedearnings">
                {wholeDollars(earningRecord.taxedEarnings)}
              </td>
              <td class="epc">
                {wholeDollars(earningRecord.earningsRequiredPerCredit())}
              </td>
              <td class="credits">
                {earningRecord.credits()}
                {#if earningRecord.credits() == 4}
                  <span class="maxlabel">(max)</span>
                {/if}
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  /** The earnings calc table displays similar information as from SSA.gov, but
   * in a nicer form and with some computed fields. We also reuse this fancy
   * table format for the age-based benefit table.
   */
  .earnings-table {
    /* page-break-inside makes printed pages less likely to break the table */
    page-break-inside: avoid;
    border-collapse: collapse;
    width: calc(min(100%, 600px));
    margin: 10px auto 10px 5%;
    font-size: 14px;
  }
  tr:not(:last-child) {
    border-bottom: 2px solid #ccc;
  }
  tbody tr:nth-child(odd) {
    background-color: #e9e9ff;
  }
  .workyear {
    text-align: left;
    padding-left: 6px;
    padding-right: 30px;
  }
  .age {
    width: 2em;
    padding-left: 6px;
    padding-right: 30px;
    text-align: left;
  }
  td.age {
    text-align: center;
  }
  .taxedearnings {
    text-align: right;
    min-width: 67px;
  }
  td.taxedearnings {
    padding-right: 8px;
  }
  .epc {
    text-align: right;
  }
  .credits {
    text-align: center;
  }
  .maxlabel {
    font-size: 10px;
    color: #666;
  }
</style>
