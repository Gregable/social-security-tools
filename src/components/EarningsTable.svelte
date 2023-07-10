<script lang="ts">
  import "../global.css";
  import { EarningRecord } from "../lib/earning-record";

  export let earningsRecords: Array<EarningRecord> = [];

  function twoSignificantDigits(n: number) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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
          <th class="multsymbol" />
          <th class="multiplier">Multiplier</th>
          <th class="indexedearnings" colspan="2">Indexed Earnings</th>
          <th class="top35indicators" />
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
              <td colspan="5" class="taxedearnings" style="text-align:center">
                Not yet recorded
              </td>
            {:else}
              <td class="taxedearnings">
                {earningRecord.taxedEarnings.wholeDollars()}
              </td>

              <td class="multsymbol"> x </td>
              <td class="multiplier">
                {twoSignificantDigits(earningRecord.indexFactor())}
              </td>
              <td class="eqsymbol"> = </td>
              <td class="indexedearnings">
                {earningRecord.indexedEarnings().wholeDollars()}
              </td>
            {/if}
            <td class="top35indicators">
              {#if earningRecord.isTop35EarningsYear}
                Top 35
                <span class="onlydisplay500"> Value</span>
              {/if}
            </td>
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
  .multsymbol {
    text-align: center;
    padding-left: 14px;
    padding-right: 0px;
    color: #6b6bbf;
  }
  .multiplier {
    text-align: center;
    min-width: 60px;
  }
  .eqsymbol {
    text-align: center;
    padding-right: 0px;
    color: #6b6bbf;
  }
  .indexedearnings {
    text-align: right;
    min-width: 90px;
  }
  td.indexedearnings {
    padding-right: 50px;
    /**
     * The color for the other columns is 51, 51, 51. By darkening this
     * slightly, we add a little bit of emphasis to the final calculation.
     */
    color: rgb(10, 10, 10);
  }
  .top35indicators {
    white-space: nowrap;
    color: #3b3b7f;
  }
</style>
