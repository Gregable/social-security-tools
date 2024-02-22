<script lang="ts">
  import Header from "$lib/components/Header.svelte";
</script>

<Header active="Guides" />
<main>
  <slot />
</main>

<style>
  :global(div.guide-page) {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 1em;
  }
  :global(.guide-page h1) {
    font-size: 2.5em;
    margin-bottom: 0;
  }
  :global(.guide-page br.clear) {
    clear: both;
  }
  :global(.guide-page p, .guide-page ul, .guide-page ol, .guide-page pre) {
    font-size: 1.4em;
    color: #333;
  }
  :global(.guide-page p.postdate) {
    margin: 0.4em 0 1.5em 0;
    font-size: 0.8em;
    color: #666;
  }
  :global(.guide-page figure) {
    margin: 0;
    width: min-content;
  }
  :global(.guide-page figure.float-right) {
    float: right;
    margin: 0 0 3vw 4vw;
  }
  :global(.guide-page img) {
    border: 1px solid #ccc;
    max-width: 80vw;
    height: auto;
    /* Rounded edges */
    border-radius: 10px;
  }
  :global(.guide-page figure.hero-image) {
    float: right;
    margin: 0 0 3vw 4vw;
  }
  :global(.guide-page .hero-image img) {
    height: 24vw;
    width: auto;

    /* Subtle shadow */
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }
  :global(.guide-page figcaption) {
    font-size: 0.8em;
    text-align: center;
  }
  :global(.guide-page figure:not(hero-image)) {
    margin: 1.8em 0 1.8em 0;
  }
  :global(.guide-page div.indent) {
    margin-left: 2em;
  }
</style>
