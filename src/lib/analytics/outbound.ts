import posthog from 'posthog-js';
import { browser } from '$app/environment';

export type OutboundDestination = 'projectionlab' | 'kofi';

export function trackOutboundClick(
  destination: OutboundDestination,
  placement: string,
  extras?: Record<string, string | number | boolean>
): void {
  if (!browser) return;
  posthog.capture('Outbound: Clicked', { destination, placement, ...extras });
}

export function trackOutboundImpression(
  destination: OutboundDestination,
  placement: string,
  extras?: Record<string, string | number | boolean>
): void {
  if (!browser) return;
  posthog.capture('Outbound: Visible', { destination, placement, ...extras });
}

interface ImpressionParams {
  destination: OutboundDestination;
  placement: string;
  extras?: Record<string, string | number | boolean>;
}

export function outboundImpression(
  node: HTMLElement,
  params: ImpressionParams
) {
  if (!browser || typeof IntersectionObserver === 'undefined') return {};
  let current = params;
  let fired = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          posthog.capture('Outbound: Visible', {
            destination: current.destination,
            placement: current.placement,
            ...current.extras,
          });
          observer.unobserve(node);
        }
      }
    },
    { threshold: 0.2, rootMargin: '50px' }
  );
  observer.observe(node);
  return {
    update(next: ImpressionParams) {
      current = next;
    },
    destroy() {
      observer.disconnect();
    },
  };
}
