/**
 * Marks a branch the types say cannot run, such as the default case of a
 * switch over every member of a union. A missing case then fails to type
 * check, because the value reaching here is not `never`; reaching it at run
 * time throws.
 */
export function assertNever(value: never): never {
  throw new Error(`unexpected value: ${String(value)}`);
}
