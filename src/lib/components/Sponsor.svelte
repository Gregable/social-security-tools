<script lang="ts">
import posthog from 'posthog-js';
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import ProjectionLabAd from './ProjectionLabAd.svelte';
import { Recipient } from '$lib/recipient';

export let recipient: Recipient = new Recipient();

let sponsorElement: HTMLElement;
let isVisible = false;

function handleSponsorClick() {
  if (browser) {
    posthog.capture('Sponsor: Clicked', {
      sponsor_name: 'ProjectionLab',
    });
  }
}

onMount(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible = true;
          // Track sponsor visibility
          if (browser) {
            posthog.capture('Sponsor: Visible', {
              sponsor_name: 'ProjectionLab',
            });
          }
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2, // Trigger when 20% of the element is visible
      rootMargin: '50px', // Start animation slightly before element is fully in view
    }
  );

  if (sponsorElement) {
    observer.observe(sponsorElement);
  }

  return () => {
    if (sponsorElement) {
      observer.unobserve(sponsorElement);
    }
  };
});
</script>

<a
  href="https://projectionlab.com?ref=ssa-tools"
  class="spon-anchor"
  target="_blank"
  rel="noopener noreferrer"
  on:click={handleSponsorClick}
>
  <div class="transition-section">
    <h2>Beyond Social Security: Complete Retirement Planning</h2>
    <div class="text">
      <p>
        You've calculated your Social Security benefit of <b
          >{$recipient.pia().primaryInsuranceAmount().string()}/month</b
        >. Now see how this fits into your complete retirement picture.
        Professional retirement planning goes beyond Social Security to model
        your entire financial future with advanced tools and projections.
      </p>
    </div>
  </div>

  <div bind:this={sponsorElement}>
    <ProjectionLabAd animated {isVisible} />
  </div>
</a>

<style>
  .transition-section {
    margin: 0;
    padding: 0;
  }

  .transition-section h2 {
    /* Match PiaReport h2 styling */
    margin: 0.83em 0;
    font-size: 1.5em;
    font-weight: bold;
    color: inherit;
  }

  .transition-section .text {
    /* Match PiaReport .text styling exactly */
    margin: 0 0.5em;
  }

  .spon-anchor {
    display: block;
    text-decoration: none;
    color: inherit;
    margin: 30px 4px;
    border-radius: 8px;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .spon-anchor:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
</style>
