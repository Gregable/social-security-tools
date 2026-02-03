<script lang="ts">
import posthog from 'posthog-js';
import { onMount } from 'svelte';
import { browser } from '$app/environment';

let tracked = false;

function handleClick() {
  if (browser) {
    posthog.capture('Sponsor Compact: Clicked', {
      sponsor_name: 'ProjectionLab',
    });
  }
}

onMount(() => {
  if (browser && !tracked) {
    tracked = true;
    posthog.capture('Sponsor Compact: Visible', {
      sponsor_name: 'ProjectionLab',
    });
  }
});
</script>

<a
  href="https://projectionlab.com?ref=ssa-tools"
  class="compact-sponsor"
  target="_blank"
  rel="noopener noreferrer"
  on:click={handleClick}
>
  <span class="name">ProjectionLab</span>
  <span class="sep">&mdash;</span>
  <span class="tagline">Full retirement planning</span>
  <span class="cta">10% off code SSA-TOOLS</span>
  <span class="badge">AD</span>
</a>

<style>
  .compact-sponsor {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 15px;
    justify-content: center;
    justify-self: center;
    background: #f0f8ff;
    border: 1px solid #d0e3f0;
    border-radius: 5px;
    text-decoration: none;
    color: inherit;
    font-size: 14px;
    white-space: nowrap;
    transition:
      border-color 0.2s ease,
      background 0.2s ease;
  }

  .compact-sponsor:hover {
    border-color: #337ab7;
    background: #e6f3ff;
  }

  .badge {
    color: #999;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-left: 4px;
    display: inline-flex;
    align-items: center;
    height: 100%;
  }

  .name {
    font-weight: 600;
    color: #337ab7;
  }

  .sep {
    color: #aaa;
  }

  .tagline {
    color: #555;
  }

  .cta {
    color: #337ab7;
    font-weight: 600;
    margin-left: 2px;
  }

  .compact-sponsor:hover .cta {
    color: #23527c;
  }

  @media screen and (max-width: 900px) {
    .compact-sponsor {
      display: none;
    }
  }
</style>
