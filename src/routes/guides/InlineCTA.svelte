<script lang="ts">
import posthog from 'posthog-js';
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import ProjectionLabAd from '$lib/components/ProjectionLabAd.svelte';
import type { GuideCTAType } from './guide-cta-config';

export let type: GuideCTAType;

let ctaElement: HTMLElement;

$: guideSlug = ($page?.url?.pathname ?? '')
  .replace('/guides/', '')
  .replace(/\/$/, '');

function handleClick() {
  if (browser) {
    posthog.capture('Guide Inline CTA: Clicked', {
      type,
      guide_slug: guideSlug,
    });
  }
}

onMount(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (browser) {
            posthog.capture('Guide Inline CTA: Visible', {
              type,
              guide_slug: guideSlug,
            });
          }
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.2 }
  );

  if (ctaElement) {
    observer.observe(ctaElement);
  }

  return () => {
    if (ctaElement) {
      observer.unobserve(ctaElement);
    }
  };
});
</script>

{#if type === 'calculator'}
  <a
    href="/calculator"
    class="inline-cta calculator"
    bind:this={ctaElement}
    on:click={handleClick}
  >
    <div class="calc-card">
      <div class="calc-left-top">
        <h2 class="calc-title">SSA.tools</h2>
        <h4 class="calc-badge">Free Calculator</h4>
      </div>
      <div class="calc-left-bottom">
        <img
          src="/laptop-piggybank.jpg"
          width="800"
          height="534"
          class="calc-image"
          alt="Laptop with piggybank representing Social Security retirement planning"
        />
      </div>
      <div class="calc-right">
        <div class="calc-text">
          <h3 class="calc-mobile-title">
            SSA.tools <span class="calc-mobile-badge">Free Calculator</span>
          </h3>
          <p>
            See how this applies to your benefits. Use the free <span
              class="calc-inline-link">SSA.tools calculator</span
            > with your actual earnings record for personalized results.
          </p>
          <ul>
            <li>
              <strong>Copy &amp; paste:</strong> Import your earnings record directly
              from SSA.gov in seconds.
            </li>
            <li>
              <strong>What-if scenarios:</strong> Explore how different filing ages
              and future earnings affect your benefit.
            </li>
            <li>
              <strong>100% private:</strong> Your data never leaves your browser
              &mdash; nothing is stored or transmitted.
            </li>
          </ul>
          <div class="calc-cta-section">
            <div class="calc-cta-button">Calculate My Benefits &rarr;</div>
          </div>
        </div>
      </div>
    </div>
  </a>
{:else}
  <a
    href="https://projectionlab.com?ref=ssa-tools"
    class="inline-cta projectionlab"
    target="_blank"
    rel="noopener noreferrer"
    bind:this={ctaElement}
    on:click={handleClick}
  >
    <ProjectionLabAd />
  </a>
{/if}

<style>
  /* Shared base */
  .inline-cta {
    display: block;
    text-decoration: none;
    color: inherit;
    border-radius: 8px;
    margin: 2.5em auto;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .inline-cta:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  /* Calculator variant */
  .inline-cta.calculator {
    max-width: 700px;
    /* Reset inherited guide-page styles */
    font-size: 16px;
    line-height: normal;
  }

  .calc-card {
    background: linear-gradient(135deg, #f0faf0 0%, #e2f5e2 100%);
    border: 2px solid #5cb85c;
    border-radius: 8px;
    padding-left: 20px;
    cursor: pointer;
    position: relative;
    display: grid;
    grid-template-columns: 30% 70%;
    grid-template-rows: auto auto;
    gap: 10px;
    padding-top: 10px;
    padding-right: 4px;
    padding-bottom: 4px;
    transition:
      border-color 0.3s ease,
      background 0.3s ease,
      box-shadow 0.3s ease;
  }

  .calc-card::before {
    content: '🔗';
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 1.2em;
    opacity: 0.7;
    transition: all 0.3s ease;
  }

  .inline-cta.calculator:hover .calc-card::before {
    opacity: 1;
    transform: scale(1.1) rotate(15deg);
  }

  .inline-cta.calculator:hover .calc-card {
    border-color: #449d44;
    background: linear-gradient(135deg, #e2f5e2 0%, #d4ebd4 100%);
    box-shadow: 0 6px 20px rgba(92, 184, 92, 0.15);
  }

  .calc-card p,
  .calc-card ul,
  .calc-card li {
    font-size: inherit;
    line-height: normal;
  }

  .calc-left-top {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }

  .calc-left-bottom {
    display: flex;
    justify-content: center;
    align-items: center;
    grid-column: 1 / 2;
    grid-row: 2 / 3;
  }

  .calc-right {
    display: flex;
    align-items: center;
    grid-column: 2 / 3;
    grid-row: 1 / 3;
  }

  .calc-title {
    color: #449d44;
    text-decoration: underline;
    text-decoration-color: rgba(68, 157, 68, 0.5);
    text-underline-offset: 3px;
    margin: 0.5em 0;
    font-size: 1.5em;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .inline-cta.calculator:hover .calc-title {
    color: #3a8a3a;
    text-decoration-color: rgba(58, 138, 58, 0.8);
    transform: translateX(2px);
  }

  .calc-badge {
    background: #5cb85c;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    display: inline-block;
    margin: 0.5em 0;
  }

  .calc-image {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    transition:
      transform 0.3s ease,
      filter 0.3s ease;
  }

  .inline-cta.calculator:hover .calc-image {
    transform: scale(1.02);
    filter: brightness(1.05) saturate(1.1);
  }

  .calc-text {
    margin: 0 0.5em;
    font-size: 1.2em;
  }

  .calc-text p {
    color: #333;
  }

  .calc-text li {
    margin-bottom: 14px;
  }

  .calc-inline-link {
    color: #449d44;
    text-decoration: underline;
    text-decoration-color: rgba(68, 157, 68, 0.5);
    text-underline-offset: 2px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .inline-cta.calculator:hover .calc-inline-link {
    color: #3a8a3a;
    text-decoration-color: rgba(58, 138, 58, 0.8);
  }

  .calc-cta-section {
    margin-top: 20px;
    text-align: center;
  }

  .calc-cta-button {
    background: linear-gradient(135deg, #5cb85c 0%, #449d44 100%);
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 1.1em;
    display: inline-block;
    margin-bottom: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .calc-cta-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  .inline-cta.calculator:hover .calc-cta-button {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, #449d44 0%, #3a8a3a 100%);
  }

  .inline-cta.calculator:hover .calc-cta-button::before {
    left: 100%;
  }

  .calc-mobile-title {
    display: none;
    color: #449d44;
    font-size: 1.4em;
    font-weight: bold;
    text-decoration: underline;
    text-decoration-color: rgba(68, 157, 68, 0.5);
    text-underline-offset: 2px;
  }

  .calc-mobile-badge {
    background: #5cb85c;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7em;
    font-weight: normal;
    margin-left: 8px;
  }

  /* ProjectionLab variant - just a wrapper, ProjectionLabAd handles visuals */
  .inline-cta.projectionlab {
    max-width: 700px;
  }

  @media (max-width: 600px) {
    .calc-left-bottom,
    .calc-left-top,
    .calc-text li {
      display: none;
    }
    .calc-text {
      margin: 0;
    }
    .calc-card {
      grid-template-columns: 1fr;
      gap: 0;
    }
    .calc-right {
      grid-row: auto;
    }
    .calc-mobile-title {
      display: block;
      margin: 0 0 10px 0;
    }
    .calc-card::before {
      display: none;
    }
    .calc-cta-section {
      margin-top: 15px;
    }
    .calc-cta-button {
      padding: 10px 20px;
      font-size: 1em;
    }

    .inline-cta.calculator {
      margin: 2em 0;
    }

    .inline-cta.projectionlab {
      margin: 2em 0;
    }
  }
</style>
