<!--
  @component
  @name NoFilingDecisionPanel
  @description
    Shown in place of the death-age chart when nobody in the scenario has a
    filing age left to choose. Past 70 there is no lifespan trade-off left to
    draw: delayed retirement credits have stopped, so the chart would be a
    single repeated value.
-->

<script lang="ts">
export let bothPastSeventy: boolean = false;
</script>

<div class="no-decision-note">
  <h2>There is no filing age left to choose</h2>
  {#if bothPastSeventy}
    <p>
      These charts normally show how the best filing ages shift with how long
      each of you lives. You are both past 70, so that trade-off is settled:
      delayed retirement credits stop accruing at 70, so waiting longer no
      longer raises either monthly amount — it only skips payments you could
      already be collecting.
    </p>
  {:else}
    <p>
      This chart normally shows how the best filing age shifts with how long
      you live. Past 70 that trade-off is settled: delayed retirement credits
      stop accruing at 70, so waiting longer no longer raises the monthly
      amount — it only skips payments you could already be collecting.
    </p>
  {/if}
  <p>
    File as soon as you can, and ask SSA to backdate the claim. Once past full
    retirement age they can pay up to six months of benefits retroactively.
  </p>
</div>

<style>
  .no-decision-note {
    max-width: 720px;
    margin: 1rem auto 2rem;
    padding: 1.5rem 1.75rem;
    background: #f7f8fd;
    border-radius: 14px;
    color: #333;
  }

  .no-decision-note h2 {
    margin: 0 0 0.75rem;
    font-size: 1.25rem;
    color: #060606;
  }

  .no-decision-note p {
    margin: 0 0 0.75rem;
    line-height: 1.6;
  }

  .no-decision-note p:last-child {
    margin-bottom: 0;
  }
</style>
