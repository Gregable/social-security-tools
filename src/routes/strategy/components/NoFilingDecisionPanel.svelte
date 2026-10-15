<!--
  @component
  @name NoFilingDecisionPanel
  @description
    Shown in place of the death-age chart when nobody in the scenario has a
    filing age left to choose: they are past 70 (delayed retirement credits
    have stopped, so the chart would be a single repeated value), they have
    already filed (the date is a fact), they have no benefit of their own
    and have reached full retirement age (spousal benefits have stopped
    growing), or, for a widow(er), each benefit has started, stopped
    growing, would never pay more than the other, or does not exist.
-->

<script lang="ts">
import type { NoChoiceVariant } from "$lib/strategy/ui/no-choice";

/**
 * Why nobody in the scenario has a filing age left to choose. Each
 * variant gets copy that names the actual reason.
 */
export let variant: NoChoiceVariant = "past-seventy";
</script>

<div class="no-decision-note">
  <h2>
    {variant === "widowed"
      ? "There is no start date left to choose"
      : "There is no filing age left to choose"}
  </h2>
  {#if variant === "widowed"}
    <p>
      This chart normally shows how the best start dates for your survivor
      benefit and your own retirement benefit shift with how long you live.
      Here there is nothing left to choose: each benefit has started already,
      has stopped growing, would never pay more than the other, or, with no
      retirement benefit on your own record, does not exist. Survivor benefits
      stop growing at survivor full retirement age, or sooner when your spouse
      claimed early, and retirement benefits at 70.
    </p>
    <p>
      Where the recommendation above says to file, file now: that benefit has
      stopped growing, so waiting would only skip payments. If the month it
      names has already passed, ask SSA to backdate the claim. Once a benefit
      has stopped growing, SSA can pay up to six months of it retroactively.
    </p>
  {:else if variant === "both-filed"}
    <p>
      These charts normally show how the best filing ages shift with how long
      each of you lives. You are both already receiving benefits, so those
      dates are settled and there is nothing left to optimize here.
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
  {:else if variant === "filed-and-spousal-only"}
    <p>
      These charts normally show how the best filing ages shift with how long
      each of you lives. One of you already receives benefits. The other has
      no retirement benefit of their own and has reached full retirement age,
      where spousal benefits stop growing, so waiting longer would only skip
      spousal payments that could already be collected.
    </p>
    <p>
      File for the spousal benefit now and ask SSA to backdate the claim to the
      month named above. SSA pays up to six months of spousal benefits
      retroactively, but not for months before the other's benefits started
      or before full retirement age.
    </p>
  {:else if variant === "past-seventy-and-spousal-only"}
    <p>
      These charts normally show how the best filing ages shift with how long
      each of you lives. One of you is past 70, where delayed retirement
      credits stop accruing. The other has no retirement benefit of their own
      and has reached full retirement age, where spousal benefits stop
      growing. Waiting longer no longer raises either monthly amount. It only
      skips payments you could already be collecting.
    </p>
    <p>
      File both claims as soon as you can and ask SSA to backdate them to the
      months named above. Past full retirement age SSA can pay up to six
      months retroactively, though a spousal benefit never starts before the
      other's retirement benefit.
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
