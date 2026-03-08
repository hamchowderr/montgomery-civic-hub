/* eslint-disable */
/**
 * Generated API stub for Convex.
 * This is a placeholder for build purposes.
 * Run `npx convex dev` to generate real types.
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

import type * as queries from "../queries";
import type * as mutations from "../mutations";
import type * as actions from "../actions";

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  queries: typeof queries;
  mutations: typeof mutations;
  actions: typeof actions;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
