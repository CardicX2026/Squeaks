import Link from "next/link";
import { PageHead, Shell } from "@/components/ui";

export const metadata = { title: "The Squeaks token" };

export default function Token() {
  return (
    <Shell>
      <PageHead eyebrow="Token" title={<>Squeaks, <span className="yel">explained plainly</span></>} img="sqks">
        Squeaks is the community token of the CardicX ecosystem. It is not live yet. This page states what exists today, what is still undecided, and what we will not promise.
      </PageHead>

      <section className="wrap two">
        <div className="card">
          <span className="eyebrow">Status</span>
          <h2 style={{ fontSize: 26, margin: "10px 0 18px" }}>Where things stand</h2>
          <div className="kv">
            <span>Token</span><span><span className="pill gray">Not launched</span></span>
            <span>Contract address</span><span>Not published</span>
            <span>Total supply</span><span>Not final</span>
            <span>Allocation</span><span>Not final</span>
            <span>Launch date</span><span>Not set</span>
            <span>Squeaks points</span><span><span className="pill green">Live in testing</span></span>
          </div>
          <p className="muted small" style={{ marginTop: 18 }}>Each line is updated here, and only here, once it is final. Treat any other source as unofficial.</p>
        </div>
        <div className="card">
          <span className="eyebrow">Points</span>
          <h2 style={{ fontSize: 26, margin: "10px 0 12px" }}>How Squeaks points are earned</h2>
          <p className="muted">Points are a season score. They measure participation and nothing else.</p>
          <div className="kv" style={{ marginTop: 16 }}>
            <span>Cheese Chase runs</span><span>1 point per 100 score</span>
            <span>Daily cap from runs</span><span>300 points</span>
            <span>Daily reward</span><span>5 points</span>
            <span>Missions</span><span>Shown on each mission</span>
          </div>
          <p className="muted small" style={{ marginTop: 18 }}>Cheese is separate. It buys shop items and never converts into points or tokens.</p>
        </div>
      </section>

      <section className="sec wrap">
        <span className="eyebrow">What we will not say</span>
        <h2 className="sec-h">No price, no yield, no date.</h2>
        <div className="three" style={{ marginTop: 26 }}>
          <div className="card pillar"><h3 style={{ marginTop: 0 }}>No guaranteed value</h3><p>Squeaks points have no guaranteed value and no fixed conversion rate into anything, including a future token.</p></div>
          <div className="card pillar"><h3 style={{ marginTop: 0 }}>No returns</h3><p>Nothing on this site pays interest or yield. The Mine is an idle game that produces Cheese, an in-game currency.</p></div>
          <div className="card pillar"><h3 style={{ marginTop: 0 }}>No rushed launch</h3><p>Terms of use and regional availability will be published after legal review and before any token claim opens.</p></div>
        </div>
      </section>

      <section className="wrap faq" style={{ paddingBottom: 40 }}>
        <span className="eyebrow">Questions</span>
        <h2 className="sec-h">Asked often</h2>
        <details><summary>Can I buy Squeaks today?</summary><p>No. The token is not launched and there is no official contract. Anyone offering Squeaks for sale right now is not us.</p></details>
        <details><summary>Will my points turn into tokens?</summary><p>Points are the only in-game balance that could count toward the token later, but no amount or rate has been decided, and it may differ by region.</p></details>
        <details><summary>Does Cheese have any value?</summary><p>Only inside the game. Cheese buys skins, hats, trails, boosts and Mine upgrades. It cannot be withdrawn or traded.</p></details>
        <details><summary>How is cheating handled?</summary><p>Runs, the Mine and rewards are counted on the server. Implausible scores, multi-account farming and automated play are flagged and can lose their points.</p></details>
        <details><summary>How does this connect to CardicX?</summary><p>One account works on both sites. Squeaks points appear in the CardicX Rewards Center and are recorded once on a shared ledger.</p></details>
        <div style={{ marginTop: 28 }}><Link href="/play" className="btn btn-play">Start earning points</Link></div>
      </section>
    </Shell>
  );
}
