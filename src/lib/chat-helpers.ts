"use client";
export { item, toast, useGame } from "@/lib/store";
export const NFTS_FALLBACK = Array.from({ length: 24 }, (_, i) => `/nft/n${String(i + 1).padStart(2, "0")}.webp`);
