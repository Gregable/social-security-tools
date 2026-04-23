<script lang="ts">
  export let onselect: (isSingle: boolean) => void;
</script>

<section class="mode-picker">
  <h2>Who are we calculating for?</h2>
  <p class="hint">Pick one to continue.</p>
  <div class="choices">
    <button type="button" class="choice" on:click={() => onselect(true)}>
      <span class="title">Just me</span>
      <span class="sub">Single filer</span>
    </button>
    <button type="button" class="choice" on:click={() => onselect(false)}>
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
    min-height: 120px;
    padding: 1.25rem 1rem;
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
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
  }
  .choice:hover,
  .choice:focus {
    border-color: #005ea5;
    background: #f0f7fc;
    outline: none;
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
