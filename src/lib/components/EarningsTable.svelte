<script lang="ts">
  import "$lib/global.css";
  import type { EarningRecord } from "$lib/earning-record";

  export let earningsRecords: Array<EarningRecord> = [];
</script>

<div>
  {#if earningsRecords.length > 0}
    <table class="earnings-table">
      <thead>
        <tr>
          <th class="workyear">Year</th>
          <th class="age onlyDisplayLarge">Age</th>
          <th class="taxedearnings">Taxed Earnings</th>
        </tr>
      </thead>
      <tbody>
        {#each earningsRecords as earningRecord}
          <tr>
            <td class="workyear">{earningRecord.year}</td>
            <td class="age onlyDisplayLarge">
              {earningRecord.age}
            </td>
            {#if earningRecord.incomplete}
              <td class="taxedearnings">Not yet recorded </td>
            {:else}
              <td class="taxedearnings">
                {earningRecord.taxedEarnings.wholeDollars()}
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
    width: calc(min(100% - 1em, 220px));
    margin: 10px auto 10px auto;
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
    padding-right: 10px;
  }
  .age {
    width: 2em;
    padding-left: 6px;
    padding-right: 10px;
    text-align: center;
  }
  .taxedearnings {
    text-align: right;
    min-width: 67px;
    white-space: nowrap;
  }
  td.taxedearnings {
    padding-right: 8px;
  }
</style>
