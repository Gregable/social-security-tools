import posthog from 'posthog-js';
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { page } from '$app/stores';
import {
  GUIDE_WIDGET_USED,
  guideWidgetProperties,
} from '$lib/analytics/guide-widget';
import { guideSlugFromPath } from './guide-slug';

/**
 * A callback for a widget's input handlers. The first call reports
 * "Guide Widget: Used" for the named widget on the current guide; later
 * calls do nothing. Each component instance makes its own, so the event
 * fires once per page view.
 */
export function onceWidgetUsed(widget: string): () => void {
  let reported = false;
  return () => {
    if (reported || !browser) return;
    reported = true;
    const slug = guideSlugFromPath(get(page)?.url?.pathname ?? '');
    posthog.capture(GUIDE_WIDGET_USED, guideWidgetProperties(widget, slug));
  };
}
