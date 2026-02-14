<script lang="ts">
import posthog from 'posthog-js';
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import { getGuideCTAType } from './guide-cta-config';

let visible = false;
let dismissed = false;
let footerInView = false;
let tracked = false;

$: type = getGuideCTAType($page.url.pathname);
$: guideSlug = $page.url.pathname
  .replace('/guides/', '')
  .replace(/\/$/, '');
$: show = visible && !dismissed && !footerInView;

function handleClick() {
  if (browser) {
    posthog.capture('Guide Sticky CTA: Clicked', {
      type,
      guide_slug: guideSlug,
    });
  }
}

function dismiss() {
  dismissed = true;
  if (browser) {
    sessionStorage.setItem('guide-sticky-cta-dismissed', 'true');
    posthog.capture('Guide Sticky CTA: Dismissed', {
      type,
      guide_slug: guideSlug,
    });
  }
}

onMount(() => {
  if (browser) {
    dismissed =
      sessionStorage.getItem('guide-sticky-cta-dismissed') === 'true';
  }

  function onScroll() {
    const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const scrollPercent = window.scrollY / scrollable;
    const nowVisible = scrollPercent > 0.5;
    if (nowVisible && !visible && !tracked) {
      tracked = true;
      if (browser) {
        posthog.capture('Guide Sticky CTA: Visible', {
          type,
          guide_slug: guideSlug,
        });
      }
    }
    visible = nowVisible;
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Observe the guide footer to auto-hide when it's in view
  const footerEl = document.querySelector('.guide-footer-marker');
  let footerObserver: IntersectionObserver | null = null;
  if (footerEl) {
    footerObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          footerInView = entry.isIntersecting;
        }
      },
      { threshold: 0 }
    );
    footerObserver.observe(footerEl);
  }

  return () => {
    window.removeEventListener('scroll', onScroll);
    if (footerObserver && footerEl) {
      footerObserver.unobserve(footerEl);
    }
  };
});
</script>

{#if show}
  <div class="sticky-bar">
    <div class="sticky-content">
      {#if type === 'calculator'}
        <span class="sticky-text">Calculate your benefits</span>
        <a
          href="/calculator"
          class="sticky-button calculator"
          on:click={handleClick}
        >
          Try it free
        </a>
      {:else}
        <span class="sticky-text">Full retirement planning</span>
        <a
          href="https://projectionlab.com?ref=ssa-tools"
          class="sticky-button projectionlab"
          target="_blank"
          rel="noopener noreferrer"
          on:click={handleClick}
        >
          ProjectionLab
        </a>
        <span class="sticky-sponsor">Sponsor</span>
      {/if}
      <button class="sticky-dismiss" on:click={dismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  </div>
{/if}

<style>
  .sticky-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: #fff;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    padding: 10px 16px;
    display: none;
  }

  @media (max-width: 768px) {
    .sticky-bar {
      display: block;
    }
  }

  .sticky-content {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 600px;
    margin: 0 auto;
  }

  .sticky-text {
    flex: 1;
    font-size: 0.95em;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sticky-button {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9em;
    font-weight: 600;
    text-decoration: none;
    color: #fff;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .sticky-button.calculator {
    background: #5cb85c;
  }

  .sticky-button.projectionlab {
    background: #337ab7;
  }

  .sticky-sponsor {
    font-size: 0.7em;
    color: #999;
    flex-shrink: 0;
  }

  .sticky-dismiss {
    background: none;
    border: none;
    font-size: 1.4em;
    color: #999;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    flex-shrink: 0;
  }

  .sticky-dismiss:hover {
    color: #333;
  }
</style>
