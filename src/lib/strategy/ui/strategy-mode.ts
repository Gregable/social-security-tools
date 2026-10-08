/**
 * Who the strategy page is optimizing for.
 *
 * - `single`: one person and their own retirement benefit.
 * - `couple`: two living spouses, with spousal and survivor benefits.
 * - `widowed`: one living person whose spouse has died, choosing when to
 *   start the survivor benefit and their own retirement benefit.
 */
export type StrategyMode = 'single' | 'couple' | 'widowed';
