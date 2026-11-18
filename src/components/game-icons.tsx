/* Original duotone game icons (drawn in code) for the Cheese Chase menus and HUD. */
type Name = "trophy" | "runner" | "missions" | "board" | "shop" | "gift" | "music" | "sound" | "close" | "pause" | "magnet" | "star" | "hover" | "rocket";

export function GameIcon({ n, s = 26 }: { n: Name; s?: number }) {
  const P = { width: s, height: s, viewBox: "0 0 32 32", "aria-hidden": true } as const;
  switch (n) {
    case "trophy": return <svg {...P}><path d="M9 5h14v6a7 7 0 0 1-14 0z" fill="#ffc83d" /><path d="M9 7H5a4 4 0 0 0 5 6M23 7h4a4 4 0 0 1-5 6" fill="none" stroke="#e09a00" strokeWidth="2.2" strokeLinecap="round" /><path d="M14 18h4v5h-4z" fill="#e09a00" /><rect x="10" y="23" width="12" height="4" rx="1.5" fill="#8a5a00" /><path d="M12 8v3" stroke="#fff4c2" strokeWidth="2" strokeLinecap="round" /></svg>;
    case "runner": return <svg {...P}><circle cx="19" cy="6" r="3.2" fill="#f28c3f" /><path d="M10 15l5-4 4 3 4 1M15 11l-3 8-5 3M14 19l5 3 1 6M12 19l-1 0" fill="none" stroke="#3a8dde" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "missions": return <svg {...P}><circle cx="16" cy="16" r="12" fill="#e5383b" /><circle cx="16" cy="16" r="8" fill="#fff" /><circle cx="16" cy="16" r="4" fill="#e5383b" /><path d="M16 16l11-11M23 5h4v4" fill="none" stroke="#14213d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "board": return <svg {...P}><rect x="4" y="16" width="7" height="12" rx="2" fill="#7393cc" /><rect x="12.5" y="8" width="7" height="20" rx="2" fill="#ffc83d" /><rect x="21" y="12" width="7" height="16" rx="2" fill="#f28c3f" /><path d="M16 3l1.2 2.4 2.6.4-1.9 1.8.5 2.6L16 9l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#fff" /></svg>;
    case "shop": return <svg {...P}><path d="M6 11h20l-2 16H8z" fill="#2bb3a3" /><path d="M11 11V9a5 5 0 0 1 10 0v2" fill="none" stroke="#14213d" strokeWidth="2.4" strokeLinecap="round" /><path d="M11 18l3.2-1.6L18 18l3-1.4v4.6H11z" fill="#ffc83d" /></svg>;
    case "gift": return <svg {...P}><rect x="5" y="13" width="22" height="15" rx="2.5" fill="#e5383b" /><rect x="3.5" y="9" width="25" height="6" rx="2" fill="#ff5c5f" /><rect x="14" y="9" width="4" height="19" fill="#ffc83d" /><path d="M16 9c-3 0-6-1.5-5-4s5-.5 5 4c0-4.5 4-6.5 5-4s-2 4-5 4z" fill="#ffc83d" /></svg>;
    case "music": return <svg {...P}><path d="M12 22V7l14-3v15" fill="none" stroke="#ffc83d" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /><ellipse cx="9" cy="22.5" rx="4" ry="3.2" fill="#ffc83d" /><ellipse cx="23" cy="19.5" rx="4" ry="3.2" fill="#f28c3f" /></svg>;
    case "sound": return <svg {...P}><path d="M5 12h5l7-6v20l-7-6H5z" fill="#7ed9bc" /><path d="M21 11a6 6 0 0 1 0 10M24 7a11 11 0 0 1 0 18" fill="none" stroke="#7ed9bc" strokeWidth="2.4" strokeLinecap="round" /></svg>;
    case "close": return <svg {...P}><path d="M9 9l14 14M23 9L9 23" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" /></svg>;
    case "pause": return <svg {...P}><rect x="9" y="7" width="5" height="18" rx="2" fill="#fff" /><rect x="18" y="7" width="5" height="18" rx="2" fill="#fff" /></svg>;
    case "magnet": return <svg {...P}><path d="M7 6v10a9 9 0 0 0 18 0V6h-6v10a3 3 0 0 1-6 0V6z" fill="#e5383b" /><rect x="7" y="5" width="6" height="5" rx="1" fill="#d6dbe8" /><rect x="19" y="5" width="6" height="5" rx="1" fill="#d6dbe8" /></svg>;
    case "star": return <svg {...P}><path d="M16 3l3.9 8 8.7 1.2-6.3 6.1 1.5 8.7L16 22.9 8.2 27l1.5-8.7-6.3-6.1L12.1 11z" fill="#ffc83d" stroke="#e09a00" strokeWidth="1.4" strokeLinejoin="round" /><text x="16" y="20" textAnchor="middle" fontSize="8" fontWeight="900" fill="#8a5a00">2x</text></svg>;
    case "hover": return <svg {...P}><rect x="3" y="12" width="26" height="6" rx="3" fill="#1b2a5c" /><rect x="5" y="13" width="22" height="2" rx="1" fill="#f28c3f" /><path d="M8 20h4M14 20h4M20 20h4" stroke="#38e8ff" strokeWidth="2.4" strokeLinecap="round" /><path d="M9 24h2M15 24h2M21 24h2" stroke="#38e8ff" strokeWidth="2" strokeLinecap="round" opacity=".55" /></svg>;
    case "rocket": return <svg {...P}><path d="M16 3c5 3 7 8 6 15h-12c-1-7 1-12 6-15z" fill="#f4f6ff" /><circle cx="16" cy="11" r="3" fill="#3a8dde" /><path d="M10 15l-4 5 4 1M22 15l4 5-4 1" fill="#e5383b" /><path d="M13 19l3 8 3-8z" fill="#ffc83d" /></svg>;
  }
}
export type GameIconName = Name;
