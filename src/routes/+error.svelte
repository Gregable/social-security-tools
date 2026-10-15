<script lang="ts">
import { page } from '$app/state';
import Header from '$lib/components/Header.svelte';

const destinations = [
  { href: '/', label: 'Home' },
  { href: '/calculator', label: 'Calculator' },
  { href: '/strategy', label: 'Strategy' },
  { href: '/guides', label: 'Guides' },
];

// SvelteKit renders this for every error: unknown URLs (in production,
// Cloudflare Pages serves the 404.html fallback from svelte.config.js and the
// client router lands here with status 404) and errors thrown while loading
// or rendering any page.
const notFound = $derived(page.status === 404);
const heading = $derived(notFound ? 'Page not found' : 'Something went wrong');
</script>

<svelte:head>
  <title>{heading} | SSA.tools</title>
  {#if notFound}
    <!-- Only for missing pages: a real page that errors once while a crawler
         renders it should not be dropped from search results. -->
    <meta name="robots" content="noindex" />
  {/if}
</svelte:head>

<Header />
<main>
  <div>
    <h1>{heading}</h1>
    {#if notFound}
      <p>
        There is no page at this address. The link may be mistyped, or the page
        may have moved.
      </p>
    {:else}
      <p>Error {page.status}: {page.error?.message}</p>
      <p>Reloading the page often fixes this.</p>
    {/if}
    <p>Try one of these instead:</p>
    <ul>
      {#each destinations as destination}
        <li><a href={destination.href}>{destination.label}</a></li>
      {/each}
    </ul>
  </div>
</main>

<style>
  main {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 1em;
  }

  main > div {
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2.5em;
    color: #2c3e50;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  p,
  ul {
    font-size: 1.4em;
    color: #333;
    line-height: 1.6;
  }

  li {
    margin: 0.5rem 0;
  }

  a {
    color: #3498db;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
