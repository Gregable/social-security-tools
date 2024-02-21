<script lang="ts">
  import { Recipient } from "$lib/recipient";

  export let recipient: Recipient = new Recipient();

  function countAllRecords(recipient: Recipient): number {
    return (
      recipient.earningsRecords.length + recipient.futureEarningsRecords.length
    );
  }
  let totalRecords: number = 0;
  $: totalRecords = countAllRecords($recipient);

  // If there is an incomplete record in the earnigns record, we should show it
  // only if there isn't a matching year in the future earnings records.
  function decideShowIncompleteRecords(recipient: Recipient): boolean {
    let incompleteYear: number | undefined = undefined;
    for (const record of recipient.earningsRecords) {
      if (record.incomplete) {
        incompleteYear = record.year;
        break;
      }
    }
    if (incompleteYear === undefined) {
      // If there is no incomplete year, it doesn't matter what the response is.
      return false;
    }
    for (const record of recipient.futureEarningsRecords) {
      if (record.year === incompleteYear) {
        return false;
      }
    }
    return true;
  }
  let showIncompleteRecords: boolean = true;
  $: showIncompleteRecords = decideShowIncompleteRecords($recipient);

  function twoSignificantDigits(n: number) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
</script>

<div>
  {#if totalRecords > 0}
    <table class="earnings-table">
      <thead>
        <tr>
          <th class="workyear">Year</th>
          <th class="age onlyDisplayLarge">Age</th>
          <th class="taxedearnings">Taxed Earnings</th>
          <th class="multsymbol" />
          <th class="multiplier"
            ><span class="onlyDisplayLarge">Multiplier</span></th
          >
          <th class="eqymbol" />
          <th class="indexedearnings">Indexed Earnings</th>
          <th class="top35indicators" />
        </tr>
      </thead>
      <tbody>
        {#each $recipient.earningsRecords as earningRecord}
          {#if !earningRecord.incomplete || showIncompleteRecords}
            <tr>
              <td class="workyear">{earningRecord.year}</td>
              <td class="age onlyDisplayLarge">
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
                  <span class="onlyDisplayLarge"> Value</span>
                {/if}
              </td>
            </tr>
          {/if}
        {/each}
        {#if $recipient.futureEarningsRecords.length > 0}
          <tr>
            <td colspan="8" class="futureBannerRow">
              Future Earnings Projections:
            </td>
          </tr>
        {/if}
        {#each $recipient.futureEarningsRecords as earningRecord}
          <tr>
            <td class="workyear">{earningRecord.year}</td>
            <td class="age onlyDisplayLarge">
              {earningRecord.age}
            </td>

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
            <td class="top35indicators">
              {#if earningRecord.isTop35EarningsYear}
                Top 35
                <span class="onlyDisplayLarge"> Value</span>
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
    border-collapse: collapse;
    width: calc(min(100% - 1em, 600px));
    margin: 10px auto 10px 5%;
    font-size: 14px;
  }
  tr:not(:last-child) {
    border-bottom: 2px solid #ccc;
  }
  tbody tr:nth-child(odd) {
    background-color: #e9e9ff;
  }
  .futureBannerRow {
    background-color: #fff;
    text-align: center;
    font-size: 18px;
    color: #443378;
    font-weight: bold;
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
    padding-right: 35px;
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
  @media (max-width: 500px) {
    /* Hide age column and some text */
    .onlyDisplayLarge {
      display: none;
    }
    /* 5% left margin gets pretty big as the screen narrows */
    .earnings-table {
      margin-left: 0.4em;
    }
    /* Gain some space by shrinking paddings */
    .workyear,
    .taxedearnings {
      padding-left: 2px;
      padding-right: 8px;
    }
    .multsymbol {
      padding-left: 0px;
      padding-right: 0px;
    }
    .eqsymbol {
      padding-right: 8px;
    }
    td.indexedearnings {
      padding-right: 8px;
    }
    /**
     * Headings start to wrap if they have multiple words. This looks bad
     *  if they are left/right aligned, so center them instead.
     */
    .taxedearnings,
    .indexedearnings {
      text-align: center;
    }
  }
</style>
