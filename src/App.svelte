<script lang="ts">
  import "./global.css";

  import Header from "./components/Header.svelte";
  import PasteFlow from "./components/PasteFlow.svelte";
</script>

<main>
  <Header />
  <PasteFlow />
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
  }
</style>
