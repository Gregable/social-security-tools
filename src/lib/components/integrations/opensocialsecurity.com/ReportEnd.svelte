<script lang="ts">
import RecipientName from '$lib/components/RecipientName.svelte';
import type { Recipient } from '$lib/recipient';

export let recipient: Recipient;
export let spouse: Recipient | null = null;

let openSocialSecurityUrl = '';

// Keep integration data reactive to future earnings changes by subscribing to
// the recipient stores.
$: openSocialSecurityUrl = buildOpenSocialSecurityUrl(
  $recipient,
  $spouse ?? null
);

// Build the Open Social Security URL with pre-populated data
function buildOpenSocialSecurityUrl(
  recipientValue: Recipient,
  spouseValue: Recipient | null
): string {
  const baseUrl = 'https://opensocialsecurity.com/';
  const params = new URLSearchParams();

  if (spouseValue) {
    // Married couple
    params.set('marital', 'married');

    // Person A (recipient)
    params.set('aDOBm', String(recipientValue.birthdate.layBirthMonth() + 1));
    params.set('aDOBd', String(recipientValue.birthdate.layBirthDayOfMonth()));
    params.set('aDOBy', String(recipientValue.birthdate.layBirthYear()));
    params.set(
      'aPIA',
      String(
        recipientValue.pia().primaryInsuranceAmount().roundToDollar().value()
      )
    );

    // Person B (spouse)
    params.set('bDOBm', String(spouseValue.birthdate.layBirthMonth() + 1));
    params.set('bDOBd', String(spouseValue.birthdate.layBirthDayOfMonth()));
    params.set('bDOBy', String(spouseValue.birthdate.layBirthYear()));
    params.set(
      'bPIA',
      String(spouseValue.pia().primaryInsuranceAmount().roundToDollar().value())
    );
  } else {
    // Single person - use marital=single with placeholder for person B
    params.set('marital', 'single');

    // Person A (recipient)
    params.set('aDOBm', String(recipientValue.birthdate.layBirthMonth() + 1));
    params.set('aDOBd', String(recipientValue.birthdate.layBirthDayOfMonth()));
    params.set('aDOBy', String(recipientValue.birthdate.layBirthYear()));
    params.set(
      'aPIA',
      String(
        recipientValue.pia().primaryInsuranceAmount().roundToDollar().value()
      )
    );

    // Person B (placeholder - required by Open Social Security)
    params.set('bDOBm', '4');
    params.set('bDOBd', '15');
    params.set('bDOBy', '1960');
    params.set('bPIA', '1000');
  }

  return `${baseUrl}?${params.toString()}`;
}

// Format PIA for display
function formatPia(person: Recipient | null): string {
  if (!person) return '';
  return person.pia().primaryInsuranceAmount().roundToDollar().wholeDollars();
}
</script>

<div class="pageBreakAvoid">
  <h2>Open Social Security</h2>

  <div class="text">
    <p>
      Now that you have a better understanding of your Social Security benefits,
      you can return to Open Social Security to calculate a filing strategy
      based on maximizing your total actuarial lifetime benefits.
    </p>
    <p>
      {#if $spouse}
        Your Primary Insurance Amounts (PIAs) are
        <strong>{formatPia($recipient)}</strong> for
        <RecipientName r={$recipient} /> and
        <strong>{formatPia($spouse)}</strong> for
        <RecipientName r={$spouse} />. These values will be pre-populated in
        Open Social Security.
      {:else}
        Your Primary Insurance Amount (PIA) is <strong
          >{formatPia($recipient)}</strong
        >. This value will be pre-populated in Open Social Security.
      {/if}
    </p>
    <p>
      The following link will take you back to Open Social Security with this
      information:
    </p>
    <p>
      <a href={openSocialSecurityUrl} target="_blank" rel="noopener">
        Return to Open Social Security (with my information)
        <svg
          class="external-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </p>
  </div>
</div>

<style>
  .text {
    margin: 0 0.5em;
  }

  .text p {
    margin: 1em 0;
  }

  .text a {
    color: #1976d2;
    text-decoration: none;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
  }

  .text a:hover {
    text-decoration: underline;
  }

  .external-icon {
    width: 1em;
    height: 1em;
    vertical-align: middle;
  }
</style>
