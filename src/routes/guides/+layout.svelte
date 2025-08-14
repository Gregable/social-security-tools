<script lang="ts">
  import Header from '$lib/components/Header.svelte';
</script>

<Header active="Guides" />
<main>
  <slot></slot>
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
    line-height: 1.6; /* Added for better readability */
  }
  :global(.guide-page p.postdate) {
    margin: 0.4em 0 1.5em 0;
    font-size: 0.8em;
    color: #666;
  }
  :global(.guide-page figure) {
    margin: 0;
  }
  :global(.guide-page figure.float-right) {
    float: right;
    margin: 0 0 3vw 4vw;
    width: 45%; /* Adjusted for better readability on desktop */
  }
  :global(.guide-page img) {
    border: 1px solid #ccc;
    max-width: 100%; /* Changed from 80vw */
    height: auto;
    /* Rounded edges */
    border-radius: 10px;
  }
  :global(.guide-page figure.hero-image) {
    float: right;
    margin: 0 0 3vw 4vw;
    width: 40%; /* Added for desktop visibility */
  }
  :global(.guide-page .hero-image img) {
    height: auto; /* Changed from 24vw */
    width: 100%; /* Ensure it takes full width of its container */

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
  :global(.guide-page pre) {
    max-width: 100%; /* Ensure pre tag respects container width */
    overflow-x: auto; /* Add horizontal scroll for overflowing content */
    white-space: pre; /* Preserve whitespace and prevent awkward wrapping */
    /* Removed word-wrap: break-word; */
  }

  @media (max-width: 768px) {
    :global(div.guide-page) {
      padding: 0 1.5em; /* More padding on smaller screens */
    }
    :global(.guide-page h1) {
      font-size: 2em; /* Smaller heading on mobile */
    }
    :global(.guide-page p, .guide-page ul, :global(.guide-page ol)) {
      font-size: 1.1em; /* Slightly smaller text on mobile */
    }
    :global(.guide-page pre) {
      font-size: 0.9em; /* Even smaller font for pre tags on mobile */
    }
    :global(.guide-page figure.float-right),
    :global(.guide-page figure.hero-image) {
      float: none; /* Remove float on mobile */
      margin: 1em auto; /* Center images and add vertical margin */
      width: 100%; /* Make figures take full width */
      text-align: center; /* Center content within figure */
    }
  }
</style>
