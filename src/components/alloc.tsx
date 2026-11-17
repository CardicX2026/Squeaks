"use client";
import { useState } from "react";
import { ALLOC, TOKEN } from "@/lib/content";
import { fmt } from "@/components/ui";

/** Part-to-whole bar for the $SQKS supply, with a legend that doubles as the data table. */
export function Allocation({ notes = false }: { notes?: boolean }) {
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div>
      <div className={`alloc-bar${hov !== null ? " hov" : ""}`} role="img" aria-label="Allocation of the $SQKS supply">
        {ALLOC.map((a, i) => (
          <i key={a.name} className={hov === i ? "on" : ""} style={{ width: `${a.pct}%`, background: a.color }}
            title={`${a.name}: ${a.pct}%`} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} />
        ))}
      </div>
      <div className="alloc-list">
        {ALLOC.map((a, i) => (
          <div key={a.name} className={`alloc-row${hov === i ? " on" : ""}`} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}>
            <span className="sw" style={{ background: a.color }} />
            <span>
              <span className="nm">{a.name}</span>
              {notes && <span className="muted small" style={{ display: "block" }}>{a.note}</span>}
            </span>
            <b>{a.pct}%</b>
            <span className="amt">{fmt((TOKEN.supply * a.pct) / 100)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
