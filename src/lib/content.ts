// Facts and copy sourced from the Squeaks docs (squeaksfun.gitbook.io/squeaks).
// Update here and every page follows.

export const CARDICX = "https://cardicx.com";
// From the Squeaks docs FAQ
export const SOCIALS = [
  { n: "Telegram", h: "https://t.me/squeaks_official", i: "tg" },
  { n: "X", h: "https://x.com/squeaksfun", i: "x" },
  { n: "Instagram", h: "https://instagram.com/squeaksfun", i: "ig" },
  { n: "Zealy", h: "https://zealy.io/cw/squeaksfun", i: "zealy" },
];

/** CDXLIV mint status, per the docs FAQ. Fill in when announced. */
export const MINT = {
  status: "Whitelist open",
  date: "",        // e.g. "March 2027"
  price: "",       // e.g. "0.5 SOL"
  marketplaces: [] as { n: string; h: string }[], // e.g. [{ n: "Magic Eden", h: "https://..." }]
};

/**
 * Arcade cards. Drop artwork at the `img` path (public/games/...) and it appears;
 * until then the card uses `fallback` or a styled placeholder.
 */
export const GAMES = [
  { id: "cheese-chase", name: "Cheese Chase", desc: "Run the neon rails of Cheese City. Dodge, jump, slide and stack Cheese.", img: "/games/cheese-chase.webp", fallback: "/mice/chase.webp", href: "/play/cheese-chase", live: true },
  { id: "hammer", name: "Hammer the Squeaks", desc: "Mice pop up, you bonk them with the golden hammer. Fast hands win the Cheese.", img: "/games/slot-2.webp", fallback: "", href: "/play/hammer", live: true },
  { id: "says", name: "Squeaks Says", desc: "Watch the pattern, repeat it back. How long can your memory keep up?", img: "/games/slot-3.webp", fallback: "", href: "/play/says", live: true },
];

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
