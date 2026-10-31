/**
 * The one event a guide widget reports: that a reader changed one of its
 * inputs. Sent once per page view per widget, on the first change.
 *
 * Privacy: the properties name the widget and the guide and nothing else.
 * The values a reader types (earnings, benefits, income) must never be sent.
 */

export const GUIDE_WIDGET_USED = 'Guide Widget: Used';

export interface GuideWidgetProperties {
  readonly widget: string;
  readonly guide_slug: string;
}

export function guideWidgetProperties(
  widget: string,
  guideSlug: string
): GuideWidgetProperties {
  return { widget, guide_slug: guideSlug };
}
