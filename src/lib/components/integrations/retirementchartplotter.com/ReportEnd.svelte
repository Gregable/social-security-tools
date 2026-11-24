<script lang="ts">
import { trackOutboundClick } from '$lib/analytics/outbound';
import RecipientName from '$lib/components/RecipientName.svelte';
import { recipientFilingDate, spouseFilingDate } from '$lib/context';
import {
  buildRcpHousehold,
  type RcpHousehold,
  type RcpPerson,
  RETIREMENT_CHARTPLOTTER_URL,
  rcpGuidedFields,
  rcpReceivingFields,
} from '$lib/integrations/retirement-chartplotter';
import { MonthDate } from '$lib/month-time';
import type { Recipient } from '$lib/recipient';
import { IntegrationContext } from '../integration-context';
import FieldRow from './FieldRow.svelte';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

const now = MonthDate.initFromNow();

$: context = new IntegrationContext($recipient, spouse ? $spouse : null);
$: household = buildRcpHousehold({
  context,
  recipientFilingDate: $recipientFilingDate,
  spouseFilingDate: context.spouse === null ? null : $spouseFilingDate,
  now,
});
$: people = householdPeople(household);
$: receivers = people.filter((p) => p.currentBenefit !== null);
$: isCouple = household !== null && household.spouse !== null;
// With every PIA at $0 there is nothing to enter, at any filing date.
$: hasNoBenefit =
  hasZeroPia(context.recipient) &&
  (context.spouse === null || hasZeroPia(context.spouse));

function householdPeople(h: RcpHousehold | null): RcpPerson[] {
  if (h === null) return [];
  return h.spouse === null ? [h.primary] : [h.primary, h.spouse];
}

function hasZeroPia(r: Recipient): boolean {
  return r.pia().primaryInsuranceAmount().cents() <= 0;
}

/** Names the person on copy buttons in couples, where labels repeat. */
function owner(p: RcpPerson): string | null {
  return isCouple ? p.recipient.name : null;
}

/** Guided Setup's heading for a person's Social Security fields. */
function guidedLegend(p: RcpPerson, couple: boolean): string {
  if (!couple) return 'Social Security';
  return p.role === 'primary' ? 'Primary Social Security' : 'Spouse Social Security';
}

/** The Social Security panel's heading for a person's fields. */
function panelLegend(p: RcpPerson): string {
  return p.role === 'primary' ? 'Social Security' : 'Spouse';
}
</script>

<div class="pageBreakAvoid">
  <h2>Retirement Chartplotter</h2>
  <div class="text">
    {#if hasNoBenefit}
      <p>
        With a $0 Primary Insurance Amount, there is no Social Security
        retirement benefit to add to Retirement Chartplotter.
      </p>
    {:else if household === null}
      <p>Choose a filing date in the charts above to see your entries.</p>
    {:else}
      <p>
        Retirement Chartplotter works out the benefit at each claim age{isCouple
          ? ', and spousal and survivor benefits,'
          : ''} from each person's benefit at full retirement age. To add yours:
      </p>
      <ol class="howto">
        <li>
          In
          <a
            href={RETIREMENT_CHARTPLOTTER_URL}
            target="_blank"
            rel="noopener"
            on:click={() =>
              trackOutboundClick(
                'retirementchartplotter',
                'integration-report-end'
              )}>Retirement Chartplotter</a
          >, select <span class="rcp-button">Set Up My Plan</span>, then the
          <span class="rcp-step"><span class="num">2</span> Income</span> step.
        </li>
        <li>
          Enter these values in its Social Security section{isCouple
            ? 's'
            : ''}:
          <div class="panels" class:pair={isCouple}>
            {#each people as p (p.role)}
              <fieldset class="rcp-fieldset guided">
                <legend>
                  {guidedLegend(p, isCouple)}
                  {#if isCouple}
                    <span class="who">
                      (<RecipientName r={p.recipient} alwaysShowName />)
                    </span>
                  {/if}
                </legend>
                {#each rcpGuidedFields(p) as field (field.label)}
                  <FieldRow {field} owner={owner(p)} />
                {/each}
                {#if p.claim.moved}
                  <p class="note">
                    Retirement Chartplotter takes claim months from age 62 to
                    70, so the filing date above is entered as
                    {p.claim.month.toFullString()}.
                  </p>
                {/if}
              </fieldset>
            {/each}
          </div>
          {#if isCouple}
            <p class="note">
              <RecipientName r={household.primary.recipient} alwaysShowName />,
              the higher earner, is the primary person. If there is no Spouse
              Social Security section, set <strong>Plan For</strong> to Married
              Couple.
            </p>
          {/if}
        </li>
        <li>
          Select <span class="rcp-step"><span class="num">6</span> Review</span>,
          then <span class="rcp-button">Create My Plan</span>.
          Your other plan settings stay as they are.
        </li>
        {#if receivers.length > 0}
          <li>
            <span class="receiving-heading">Already receiving benefits:</span>
            in <strong>Planner Inputs</strong>, open
            <strong>Social Security</strong> and enter:
            <div class="panels" class:pair={receivers.length > 1}>
              {#each receivers as p (p.role)}
                <fieldset class="rcp-fieldset receiving">
                  <legend>
                    {panelLegend(p)}
                    {#if isCouple}
                      <span class="who">
                        (<RecipientName r={p.recipient} alwaysShowName />)
                      </span>
                    {/if}
                  </legend>
                  {#each rcpReceivingFields(p, household) as field (field.label)}
                    <FieldRow {field} owner={owner(p)} />
                  {/each}
                </fieldset>
              {/each}
            </div>
          </li>
        {/if}
      </ol>
    {/if}
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }

  .text p {
    margin: 1em 0;
  }

  .howto {
    padding-left: 1.5em;
  }

  .howto > li {
    margin: 0.75em 0;
  }

  .howto a {
    color: #1976d2;
  }

  /* Replicas of Chartplotter's Guided Setup button and step tabs, so the
     instructions point at controls that look the same. */
  .rcp-button {
    display: inline-block;
    padding: 1px 8px;
    border: 1px solid #1d4ed8;
    border-radius: 8px;
    background: #2563eb;
    color: #fff;
    font-weight: 650;
    white-space: nowrap;
  }

  .rcp-step {
    display: inline-block;
    padding: 1px 8px;
    border-radius: 8px;
    background: #e8f1fb;
    color: #185a91;
    font-size: 0.9em;
    font-weight: 600;
    white-space: nowrap;
  }

  .rcp-step .num {
    margin-right: 0.15em;
  }

  .receiving-heading {
    font-weight: 600;
  }

  /* Laid out like Retirement Chartplotter's own Social Security fields. */
  .panels {
    display: grid;
    grid-template-columns: minmax(0, 28em);
    gap: 12px;
    margin: 0.75em 0;
  }

  .panels.pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rcp-fieldset {
    margin: 0;
    min-width: 0;
    border: 1px solid #d7e1ea;
    border-radius: 10px;
    padding: 12px 14px;
    background: #fff;
  }

  .rcp-fieldset legend {
    padding: 0 6px;
    color: #173a5e;
    font-weight: 700;
  }

  .who {
    font-weight: 400;
  }

  .text .note {
    color: #64748b;
    font-size: 0.9em;
    margin: 0.5em 0;
  }

  @media (max-width: 700px) {
    .panels.pair {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
