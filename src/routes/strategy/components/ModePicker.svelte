<script lang="ts">
  export let onselect: (isSingle: boolean) => void;
</script>

<section class="mode-picker">
  <h2>Who are we calculating for?</h2>
  <p class="hint">Pick one to continue.</p>
  <div class="choices">
    <button type="button" class="choice" on:click={() => onselect(true)}>
      <svg
        class="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
      <span class="title">Just me</span>
      <span class="sub">Single filer</span>
    </button>
    <button type="button" class="choice" on:click={() => onselect(false)}>
      <svg
        class="icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="9" r="3" />
        <circle cx="16" cy="9" r="3" />
        <path d="M2 20a5 5 0 0 1 10 0" />
        <path d="M12 20a5 5 0 0 1 10 0" />
      </svg>
      <span class="title">Married couple</span>
      <span class="sub">Two filers</span>
    </button>
  </div>
</section>

<style>
  .mode-picker {
    max-width: 720px;
    margin: 0 auto;
    padding: 1.5rem;
    text-align: center;
  }
  .mode-picker h2 {
    margin: 0 0 0.25rem;
    font-size: 1.4rem;
  }
  .hint {
    color: #555;
    margin: 0 0 1.25rem;
  }
  .choices {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  .choice {
    flex: 1 1 220px;
    min-height: 160px;
    padding: 1.5rem 1rem 1.25rem;
    background: white;
    border: 2px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    color: #081d88;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.15s ease;
  }
  .choice:hover,
  .choice:focus {
    border-color: #005ea5;
    background: #f0f7fc;
    color: #05126b;
    outline: none;
    transform: translateY(-1px);
  }
  .icon {
    width: 44px;
    height: 44px;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
  }
  .title {
    font-weight: bold;
    font-size: 1.1rem;
    color: #0b0c0c;
  }
  .sub {
    font-size: 0.85rem;
    color: #555;
  }
  @media (max-width: 500px) {
    .choices {
      flex-direction: column;
    }
  }
</style>
