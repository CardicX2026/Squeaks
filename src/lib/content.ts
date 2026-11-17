// Facts and copy sourced from the Squeaks docs (squeaksfun.gitbook.io/squeaks).
// Update here and every page follows.

export const CARDICX = "https://cardicx.com";
export const SOCIALS = [
  { n: "Telegram", h: "https://t.me/" },
  { n: "X", h: "https://x.com/" },
  { n: "Discord", h: "https://discord.com/" },
]; // TODO: real community links

export const DOCS = "https://squeaksfun.gitbook.io/squeaks";
export const DOCS_NFT = `${DOCS}/about-squeaks/ecosystem/cdxliv-nfts-and-membership`;
export const DOCS_TOKENOMICS = `${DOCS}/squeakonomics-1`;

export const TOKEN = {
  ticker: "$SQKS",
  chain: "Solana",
  supply: 1_000_000_000,
  launch: "Pump.fun",
  contract: "", // set the contract address here once it is public
};

/**
 * Allocation of the 1B fixed supply.
 * NOTE: the docs list the staking reserve as 100M (10%) in one place and 75M (7.5%) in the summary
 * table. 10% is shown until the team confirms; public launch is the remainder.
 * Colours validated for colour-blind separation on the dark surface (dataviz validator).
 */
export const ALLOC = [
  { name: "Public launch (circulating)", pct: 77.5, color: "#b88600", note: "Released through the Pump.fun launch; price set by the market." },
  { name: "Staking rewards reserve", pct: 10, color: "#4a86e0", note: "Locked; distributed through staking pools over time." },
  { name: "OG community (CDXLIV holders)", pct: 5, color: "#d9661a", note: "For holders of the 444 CDXLIV NFTs." },
  { name: "Development reserve", pct: 3.5, color: "#1f9e6c", note: "Multisig treasury; releases tied to milestones." },
  { name: "Community airdrop", pct: 2.5, color: "#d0479f", note: "Rewards for early and active community members." },
  { name: "Marketing & growth", pct: 1.5, color: "#8a74d8", note: "Released on a monthly vesting schedule." },
];

export const NFTS = [
  "Tulip Degen", "Opening Night", "Bronze Drip", "Morning Brew", "Tea House", "Night Shift",
  "Sweet Tooth", "Rep Count", "Cocoa Break", "Orbit DJ", "Street Classic", "Boombox",
  "Courtside", "Wall Writer", "Leather Rider", "Showstopper", "Crimson Fedora", "Pickup Game",
  "First Snow", "Trench Reporter", "Neon City", "Sage Vinyl", "Private Jet", "Degen Mono",
].map((name, i) => ({ name, src: `/nft/n${String(i + 1).padStart(2, "0")}.webp` }));
