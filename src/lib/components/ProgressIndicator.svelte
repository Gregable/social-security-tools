<!--
  @component
  @name ProgressIndicator
  @description
    A horizontal step indicator showing progress through the paste flow.
    Shows current step highlighted and completed steps with checkmarks.

    In two-row mode (when entering spouse data), shows both people's progress:
    - First row: recipient name with all steps completed
    - Second row: spouse name with current progress

  @example
    <ProgressIndicator currentStep={2} />
    <ProgressIndicator currentStep={1} recipientName="Alex" spouseName="Chris" showSpouseRow={true} />
-->

<script lang="ts">
// Current step (1-4)
export let currentStep: number = 1;

// For two-row mode (spouse entry)
export let recipientName: string = '';
export let spouseName: string = '';
export let showSpouseRow: boolean = false;

const steps = [
  { num: 1, label: 'Enter Data' },
  { num: 2, label: 'Verify' },
  { num: 3, label: 'Birthdate' },
  { num: 4, label: 'Results' },
];
</script>

{#if showSpouseRow}
  <!-- Two-row mode for spouse entry - same style as single row -->
  <div class="progress-container">
    <!-- Recipient row (completed, labels hidden but present for spacing) -->
    <div class="person-label recipient">{recipientName}</div>
    <div class="progress-steps completed-row">
      {#each steps as step}
        <div class="step completed">
          <div class="step-indicator">
            <span class="checkmark">&#10003;</span>
          </div>
          <span class="step-label hidden">{step.label}</span>
        </div>
        {#if step.num < steps.length}
          <div class="connector completed"></div>
        {/if}
      {/each}
    </div>
    <!-- Spouse row (in progress) -->
    <div class="person-label spouse">{spouseName}</div>
    <div class="progress-steps">
      {#each steps as step}
        <div
          class="step"
          class:completed={currentStep > step.num}
          class:active={currentStep === step.num}
        >
          <div class="step-indicator">
            {#if currentStep > step.num}
              <span class="checkmark">&#10003;</span>
            {:else}
              <span class="step-number">{step.num}</span>
            {/if}
          </div>
          <span class="step-label">{step.label}</span>
        </div>
        {#if step.num < steps.length}
          <div
            class="connector"
            class:completed={currentStep > step.num}
          ></div>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <!-- Single-row mode (default) -->
  <div class="progress-container">
    <div class="progress-steps">
      {#each steps as step}
        <div
          class="step"
          class:completed={currentStep > step.num}
          class:active={currentStep === step.num}
        >
          <div class="step-indicator">
            {#if currentStep > step.num}
              <span class="checkmark">&#10003;</span>
            {:else}
              <span class="step-number">{step.num}</span>
            {/if}
          </div>
          <span class="step-label">{step.label}</span>
        </div>
        {#if step.num < steps.length}
          <div
            class="connector"
            class:completed={currentStep > step.num}
          ></div>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  .progress-container {
    margin: 0 auto 1.5em auto;
    max-width: min(600px, 95%);
    padding: 0 10px;
  }

  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .step-indicator {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ddd;
    color: #666;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
  }

  .step.active .step-indicator {
    background: #4a90a4;
    color: #fff;
  }

  .step.completed .step-indicator {
    background: #4ac15a;
    color: #fff;
  }

  .checkmark {
    font-size: 16px;
    font-weight: bold;
  }

  .step-label {
    margin-top: 6px;
    font-size: 12px;
    color: #888;
    white-space: nowrap;
  }

  .step.active .step-label {
    color: #4a90a4;
    font-weight: 500;
  }

  .step.completed .step-label {
    color: #4ac15a;
  }

  .connector {
    width: 40px;
    height: 2px;
    background: #ddd;
    margin: 0 8px;
    margin-bottom: 22px;
    transition: background 0.2s;
  }

  .connector.completed {
    background: #4ac15a;
  }

  /* Two-row mode styles */
  .person-label {
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    margin-top: 12px;
    margin-bottom: 4px;
  }

  .person-label:first-child {
    margin-top: 0;
  }

  .person-label.recipient {
    color: #dd6600;
  }

  .person-label.spouse {
    color: #558855;
  }

  .completed-row {
    opacity: 0.7;
  }

  .completed-row .connector {
    margin-bottom: 0;
  }

  .step-label.hidden {
    visibility: hidden;
    height: 0;
    margin: 0;
  }

  /** Smaller screens */
  @media screen and (max-width: 410px) {
    .step-indicator {
      width: 24px;
      height: 24px;
      font-size: 12px;
    }
    .step-label {
      font-size: 10px;
    }
    .connector {
      width: 24px;
      margin: 0 4px;
      margin-bottom: 18px;
    }
    /* Two-row responsive */
    .person-label {
      font-size: 12px;
    }
  }
</style>
