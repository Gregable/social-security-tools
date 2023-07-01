<script lang="ts">
  import "../global.css";
  import { Birthdate } from "../lib/birthday";
  import { context } from "../lib/context";
  import { EarningRecord } from "../lib/earning-record";
  import { Recipient } from "../lib/recipient";

  function ageAtYear(year: number): number {
    return year - context.recipient.birthdate.ssaBirthYear();
  }
  function wholeDollars(n: number) {
    return "$" + Math.round(n).toLocaleString();
  }
  function twoSignificantDigits(n: number) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
</script>

<div>
  <a id="nav-earnings" class="nav" />
  <h2 class="earningsRecordHeader">Earnings Record</h2>

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
      {#each context.recipient.earningsRecords as earningRecord}
        <tr>
          <td class="workyear">{earningRecord.year}</td>
          <td class="age onlydisplay500">
            {ageAtYear(earningRecord.year)}
          </td>
          {#if earningRecord.taxedEarnings < 0}
            <td colspan="5" class="taxedearnings" style="text-align:center">
              Not yet recorded
            </td>
          {:else}
            <td class="taxedearnings">
              {wholeDollars(earningRecord.taxedEarnings)}
            </td>

            <td class="multsymbol"> x </td>
            <td class="multiplier">
              {twoSignificantDigits(earningRecord.indexFactor())}
            </td>
            <td class="eqsymbol"> = </td>
            <td class="indexedearnings">
              {wholeDollars(earningRecord.indexedEarnings())}
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

  <div style="display: inline" class="onlyDisplayScreen">
    <div class="stickycontainer">
      <table class="sliderTable">
        <tr>
          <td>
            <span class="sliderColumn columnA">I plan to work for</span>
            <span class="sliderColumn columnB">
              <!-- See http://angular-slider.github.io/angularjs-slider/ -->
              <rzslider
                rz-slider-model="futureYearsWorkSlider.minValue"
                rz-slider-options="futureYearsWorkSlider.options"
              />
            </span>
            <span class="sliderColumn columnC">more years,</span>
          </td>
        </tr>
        <tr>
          <td>
            <span class="sliderColumn columnA">Earning approximately</span>
            <span class="sliderColumn columnB">
              <rzslider
                rz-slider-model="futureWageWorkSlider.minValue"
                rz-slider-options="futureWageWorkSlider.options"
              />
            </span>
            <span class="sliderColumn columnC">per year.</span>
          </td>
        </tr>
      </table>
    </div>
  </div>
  <div class="sticky-shadow onlyDisplayScreen" />
  <div class="sticky-shadow-cover onlyDisplayScreen" />

  {#if context.recipient.futureEarningsRecords.length > -1}
    <h2 class="onlyDisplayPrint">Expected Future Earnings</h2>
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
        {#each context.recipient.futureEarningsRecords as earningRecord}
          <tr>
            <td class="workyear">{earningRecord.year}</td>
            <td class="age onlydisplay500">
              {ageAtYear(earningRecord.year)}
            </td>
            <td class="taxedearnings">
              {wholeDollars(earningRecord.taxedEarnings)}</td
            >

            <td class="multsymbol"> x </td>
            <td class="multiplier">
              {twoSignificantDigits(earningRecord.indexFactor())}</td
            >
            <td class="eqsymbol"> = </td>
            <td class="indexedearnings">
              {wholeDollars(earningRecord.indexedEarnings())}
            </td>
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
  a.nav {
    position: relative;
    visibility: hidden;
    display: block;
  }

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
  .earnings-table tr:not(:last-child) {
    border-bottom: 2px solid #ccc;
  }
  .earnings-table tbody tr:nth-child(even) {
    background-color: #e9e9ff;
  }

  .earnings-table .workyear {
    text-align: left;
    padding-left: 6px;
    padding-right: 30px;
  }
  .earnings-table .age {
    width: 2em;
    padding-left: 6px;
    padding-right: 30px;
    text-align: left;
  }
  .earnings-table td.age {
    text-align: center;
  }
  .earnings-table .taxedearnings {
    text-align: right;
    min-width: 67px;
  }
  .earnings-table td.taxedearnings {
    padding-right: 8px;
  }
  .earnings-table .multsymbol {
    text-align: center;
    padding-left: 14px;
    padding-right: 0px;
    color: #6b6bbf;
  }
  .earnings-table .multsymbol {
    color: #6b6bbf;
  }
  .multiplier {
    text-align: center;
    min-width: 60px;
  }
  .earnings-table .eqsymbol {
    text-align: center;
    padding-right: 0px;
    color: #6b6bbf;
  }
  .earnings-table .indexedearnings {
    text-align: right;
    min-width: 90px;
  }
  .earnings-table td.indexedearnings {
    padding-right: 50px;
    /**
     * The color for the other columns is 51, 51, 51. By darkening this
     * slightly, we add a little bit of emphasis to the final calculation.
     */
    color: rgb(10, 10, 10);
  }
  .earnings-table .top35indicators {
    white-space: nowrap;
    color: #3b3b7f;
  }
</style>
