<!--
  @component
  @name ZeroEarningsConfirm
  @description
    A component that prompts the user to confirm whether $0 earnings for
    a recent year are accurate or not yet recorded by SSA.

  @example
    <ZeroEarningsConfirm
      year={2025}
      onconfirm={(incomplete) => handleConfirm(incomplete)}
    />

  @events
    confirm: Fired when user confirms their selection. Passes boolean indicating
             if the earnings are incomplete (not yet recorded).
-->

<script lang="ts">
// The year with $0 earnings that needs confirmation
export let year: number;

// Callback prop for confirm event - passes true if "not yet recorded", false if accurate
export let onconfirm: ((incomplete: boolean) => void) | undefined = undefined;

// Name of the person whose earnings are being confirmed
export let name: string = '';

function confirmAccurate() {
  onconfirm?.(false);
}

function confirmIncomplete() {
  onconfirm?.(true);
}
</script>

<div class="container">
  <div class="confirmation">
    <h3>Confirm {year} Earnings</h3>
    <p>
      {name ? `${name}'s` : 'Your'} earnings record shows <strong>$0</strong> for {year}.
    </p>
    <p>
      At the start of each year, SSA may not have recorded the previous year's
      earnings yet. Is this $0 accurate, or has SSA not yet recorded {name ? `${name}'s` : 'your'} {year} earnings?
    </p>

    <div class="buttons">
      <button on:click={confirmAccurate} class="accurate">
        $0 is accurate
      </button>
      <button on:click={confirmIncomplete} class="incomplete">
        Not yet recorded
      </button>
    </div>
  </div>
</div>

<style>
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  .confirmation {
    text-align: center;
    font-size: 18px;
  }

  .confirmation h3 {
    margin-bottom: 20px;
  }

  .confirmation p {
    margin-bottom: 15px;
    line-height: 1.5;
  }

  .buttons {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 25px;
    flex-wrap: wrap;
  }

  button {
    border: 0 none;
    border-radius: 36px;
    color: #fff;
    font-size: 18px;
    padding: 12px 30px;
    cursor: pointer;
    min-width: 180px;
  }

  button.accurate {
    background: #6c757d;
  }

  button.incomplete {
    background: #007bff;
  }

  button.accurate:hover {
    background: #5a6268;
  }

  button.incomplete:hover {
    background: #0056b3;
  }
</style>
