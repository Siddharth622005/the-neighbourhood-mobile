import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../supabase";

/**
 * Shared plumbing for the data access layer.
 *
 * Everything in lib/db returns a plain value or throws a DbError. Screens
 * never see a Supabase response envelope, and never import `supabase`
 * directly — that's the whole point of this layer. If you find yourself
 * reaching for the raw client in a component, add a function here instead.
 */
export class DbError extends Error {
  readonly code: string | undefined;
  readonly details: string | undefined;

  constructor(operation: string, cause: PostgrestError | Error) {
    const pg = cause as PostgrestError;
    super(`${operation}: ${cause.message}`);
    this.name = "DbError";
    this.code = pg?.code;
    this.details = pg?.details;
  }
}

/**
 * Unwraps a Supabase result, throwing a labelled error on failure.
 *
 * `data` is taken as `unknown` and cast to the caller's T. Without
 * generated database types, postgrest-js infers loose shapes (and widens
 * them further through filters like `.not()`), so constraining the
 * parameter to `T | null` fails to compile at every call site. The type
 * safety that matters lives in each DAL function's explicit return type;
 * swapping in `supabase gen types` later makes this genuinely checked.
 */
export function unwrap<T>(
  operation: string,
  result: { data: unknown; error: PostgrestError | null }
): T {
  if (result.error) throw new DbError(operation, result.error);
  if (result.data === null || result.data === undefined) {
    throw new DbError(operation, new Error("no data returned"));
  }
  return result.data as T;
}

/** Same, but null is a legitimate answer (e.g. "no row yet"). */
export function unwrapMaybe<T>(
  operation: string,
  result: { data: unknown; error: PostgrestError | null }
): T | null {
  if (result.error) throw new DbError(operation, result.error);
  return (result.data ?? null) as T | null;
}

export { supabase };
