/// <reference types="astro/client" />

import type { UsStateCode } from './data/usStates';

declare namespace App {
  interface Locals {
    /** Resolved US state code for the request, or null if unknown/non-US. */
    usState: UsStateCode | null;
    /** Raw 2-letter country code from Vercel geo headers, or null. */
    usCountry: string | null;
  }
}

interface ImportMetaEnv {
  /** Dev-only override to simulate a US state when no Vercel geo header exists. */
  readonly PUBLIC_DEV_GEO_STATE?: string;
}
