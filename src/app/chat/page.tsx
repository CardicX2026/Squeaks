"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { GameNav, PageHead, Shell } from "@/components/ui";
import { useAccount } from "@/components/auth";
import { item, NFTS_FALLBACK, toast, useGame } from "@/lib/chat-helpers";

type Msg = { id: number; user_id: string; handle: string; skin: string | null; body: string; created_at: string; mine?: boolean; pending?: boolean };

// Instant updates come from CardicX's realtime feed when its public URL and anon key are set; otherwise we poll.
const RT_URL = process.env.NEXT_PUBLIC_CX_SUPABASE_URL || "";
const RT_KEY = process.env.NEXT_PUBLIC_CX_SUPABASE_ANON_KEY || "";
const RT_TABLE = process.env.NEXT_PUBLIC_CX_CHAT_TABLE || "squeaks_chat_messages";

const avatar = (m: Msg) => {
  const it = m.skin ? item(m.skin) : undefined;
  if (it?.img) return `/mice/${it.img}.webp`;
  let h = 0; for (const ch of m.user_id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return NFTS_FALLBACK[h % NFTS_FALLBACK.length];
};
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function Chat() {
  const acct = useAccount();
  const g = useGame();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"loading" | "live" | "polling" | "offline">("loading");
  const [me, setMe] = useState<string | null>(null);
  const last = useRef(0);
  const list = useRef<HTMLDivElement>(null);

  const merge = useCallback((incoming: Msg[]) => {
    if (!incoming.length) return;
    setMsgs((cur) => {
      const byId = new Map(cur.filter((m) => !m.pending).map((m) => [m.id, m]));
      for (const m of incoming) byId.set(m.id, m);
      last.current = Math.max(last.current, ...incoming.map((m) => m.id));
      return [...byId.values()].sort((a, b) => a.id - b.id).slice(-200);
    });
  }, []);

  // who am I (to put my own bubbles on the right)
  useEffect(() => {
    if (!acct.authed) { setMe(null); return; }
    acct.token().then((t) => (t ? fetch("/api/profile", { headers: { Authorization: `Bearer ${t}` } }) : null))
      .then((r) => (r && r.ok ? r.json() : null)).then((p) => setMe(p?.user_id ?? null)).catch(() => {});
  }, [acct]);

  // initial history + live updates
  useEffect(() => {
    let dead = false, timer = 0;
    const pull = () => fetch(`/api/chat?after=${last.current}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => { if (!dead) { merge(j.messages ?? []); setStatus((s) => (s === "live" ? s : "polling")); } })
      .catch(() => { if (!dead) setStatus((s) => (s === "loading" ? "offline" : s)); });
    pull();
    let unsub: (() => void) | null = null;
    if (RT_URL && RT_KEY) {
      const sb = createClient(RT_URL, RT_KEY, { auth: { persistSession: false } });
      const ch = sb.channel("squeaks-chat")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: RT_TABLE }, (p) => merge([p.new as Msg]))
        .subscribe((s) => { if (!dead && s === "SUBSCRIBED") setStatus("live"); });
      unsub = () => { sb.removeChannel(ch); };
    }
    timer = window.setInterval(pull, RT_URL && RT_KEY ? 15000 : 2000); // a slow safety net when live
    return () => { dead = true; clearInterval(timer); unsub?.(); };
  }, [merge]);

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    if (!acct.authed) return acct.gate("claim");
    setText("");
    const temp: Msg = { id: Number.MAX_SAFE_INTEGER - Date.now(), user_id: me ?? "me", handle: g.handle || acct.label, skin: g.equip.Skins, body, created_at: new Date().toISOString(), mine: true, pending: true };
    setMsgs((m) => [...m, temp]);
    try {
      const t = await acct.token();
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ body }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "send_failed");
      setMsgs((m) => m.filter((x) => x !== temp));
      merge([j.message]);
    } catch (e) {
      setMsgs((m) => m.filter((x) => x !== temp));
      setText(body);
      const code = e instanceof Error ? e.message : "";
      toast(code === "slow_down" || code === "rate_limited" ? "Easy there! One message at a time" : code === "not_found" || code === "http_404" ? "Chat is opening soon" : "Message not sent, try again");
    }
  };

  return (
    <Shell theme="game">
      <PageHead eyebrow="Global chat" title={<>Squeak <span className="yel">together.</span></>} img="/nft/n12.webp">
        One room for the whole crew. Be kind, no spam, and never share your keys or seed phrase.
      </PageHead>
      <section className="wrap" style={{ paddingBottom: 0 }}><GameNav /></section>
      <section className="wrap">
        <div className="chat">
          <div className="chat-top">
            <b>🧀 The Cheese Room</b>
            <span className={`pill ${status === "live" ? "green" : "gray"}`}>{status === "live" ? <><span className="dot" /> Live</> : status === "polling" ? "Connected" : status === "loading" ? "Connecting…" : "Opening soon"}</span>
          </div>
          <div className="chat-list" ref={list}>
            {msgs.length === 0 && <div className="chat-empty"><img src="/nft/n19.webp" alt="" /><p>{status === "offline" ? "Chat is opening soon. Check back shortly!" : "No messages yet. Say gm to the crew!"}</p></div>}
            {msgs.map((m, i) => {
              const mine = m.mine || (me !== null && m.user_id === me);
              const showHead = i === 0 || msgs[i - 1].user_id !== m.user_id;
              return (
                <div key={`${m.id}-${i}`} className={`msg${mine ? " me" : ""}${m.pending ? " pending" : ""}`}>
                  {!mine && <img className={`av${showHead ? "" : " ghost"}`} src={avatar(m)} alt="" />}
                  <div className="bubble">
                    {showHead && !mine && <b className="who">@{m.handle}</b>}
                    <p>{m.body}</p>
                    <time>{m.pending ? "sending…" : time(m.created_at)}</time>
                  </div>
                </div>
              );
            })}
          </div>
          <form className="chat-send" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input className="inp" value={text} onChange={(e) => setText(e.target.value.slice(0, 280))} placeholder={acct.authed ? "Say something cheesy…" : "Log in to chat"} aria-label="Message" onFocus={() => { if (!acct.authed) acct.gate("claim"); }} />
            <button className="btn btn-play" disabled={!text.trim()}>Send</button>
          </form>
        </div>
      </section>
    </Shell>
  );
}
