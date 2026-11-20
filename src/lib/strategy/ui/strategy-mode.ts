/**
 * Who the strategy page is optimizing for.
 *
 * - `single`: one person and their own retirement benefit.
 * - `couple`: two living spouses, with spousal and survivor benefits.
 * - `widowed`: one living person whose spouse has died, choosing when to
 *   start the survivor benefit and their own retirement benefit.
 */
export type StrategyMode = 'single' | 'couple' | 'widowed';

/** The modes in the order the page offers them. */
export const STRATEGY_MODES: readonly StrategyMode[] = [
  'single',
  'couple',
  'widowed',
];

/** How a mode is named wherever the page offers it as a choice. */
export interface StrategyModeLabel {
  /** The choice itself, such as "Just me". */
  readonly title: string;
  /** A short gloss shown under the title, such as "Single filer". */
  readonly subtitle: string;
}

export const STRATEGY_MODE_LABELS: Readonly<
  Record<StrategyMode, StrategyModeLabel>
> = {
  single: { title: 'Just me', subtitle: 'Single filer' },
  couple: { title: 'Married couple', subtitle: 'Two filers' },
  widowed: { title: 'Widowed', subtitle: 'Surviving spouse' },
};
