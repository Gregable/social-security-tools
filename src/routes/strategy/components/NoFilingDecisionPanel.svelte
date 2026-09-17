<!--
  @component
  @name NoFilingDecisionPanel
  @description
    Shown in place of the death-age chart when nobody in the scenario has a
    filing age left to choose, either because they are past 70 (delayed
    retirement credits have stopped, so the chart would be a single repeated
    value) or because they have already filed (the date is a fact).
-->

<script lang="ts">
/**
 * Why nobody in the scenario has a filing age left to choose. Each
 * variant gets copy that names the actual reason.
 */
export let variant:
  | "past-seventy"
  | "both-past-seventy"
  | "both-filed"
  | "filed-and-past-seventy" = "past-seventy";
</script>

<div class="no-decision-note">
  <h2>There is no filing age left to choose</h2>
  {#if variant === "both-filed"}
    <p>
      These charts normally show how the best filing ages shift with how long
      each of you lives. You are both already receiving benefits, so those
      dates are settled and there is nothing left to optimize here. The
      expected lifetime benefit above is the value of what is still to come.
    </p>
  {:else if variant === "filed-and-past-seventy"}
    <p>
      These charts normally show how the best filing ages shift with how long
      each of you lives. One of you already receives benefits, and the other
      is past 70, where delayed retirement credits stop accruing. Waiting
      longer no longer raises that monthly amount. It only skips payments that
      could already be collected.
    </p>
    <p>
      Whoever has not yet filed should file as soon as possible and ask SSA
      to backdate the claim. Once past full retirement age, SSA can pay up to
      six months of benefits retroactively.
    </p>
  {:else if variant === "both-past-seventy"}
    <p>
      These charts normally show how the best filing ages shift with how long
      each of you lives. You are both past 70, so that trade-off is settled:
      delayed retirement credits stop accruing at 70, so waiting longer no
      longer raises either monthly amount. It only skips payments you could
      already be collecting.
    </p>
    <p>
      File as soon as you can, and ask SSA to backdate the claim. Once past
      full retirement age they can pay up to six months of benefits
      retroactively.
    </p>
  {:else}
    <p>
      This chart normally shows how the best filing age shifts with how long
      you live. Past 70 that trade-off is settled: delayed retirement credits
      stop accruing at 70, so waiting longer no longer raises the monthly
      amount. It only skips payments you could already be collecting.
    </p>
    <p>
      File as soon as you can, and ask SSA to backdate the claim. Once past
      full retirement age they can pay up to six months of benefits
      retroactively.
    </p>
  {/if}
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
