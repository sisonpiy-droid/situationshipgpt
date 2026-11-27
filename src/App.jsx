import { useEffect, useRef, useState } from "react";
import { MOODS, RESUME_RE, STARTERS, STOP_RE, statusFor } from "./brain.js";

const ERRS = ["wifi ne mujhe leave on read kar diya 📡", "connection lost. emotionally also.", "server ne ghost kar diya. not me, i swear", "network aur tum, dono unstable"];

const SITE = "situationshipgpt-ten.vercel.app";
const LABELS = ["Send", "Don't text me", "Beg to send", "Your call"];
const TYPING = ["Typing", "Deleting", "Consulting the group chat", "Overthinking", "Screenshotting your text for besties", "Typing since 3 hrs ago"];
const NOTIFS = [
  "Kiki liked your message. Then unliked it. 💔",
  "Kiki viewed your story 11 times 👀",
  "Kiki is typing... Kiki stopped typing.",
  "Kiki changed her WhatsApp DP. Not for you.",
  "Your Situationship Score dropped by 3 🔻",
  "Kiki's mom wants to know your CTC 👵",
];
// Fake read receipts: always slightly wrong, like real ones.
const SEEN = ["Seen · just now", "Seen · 3 days ago", "Seen · tomorrow 9:41 AM", "Seen by Kiki and 2 friends", "Read at 3:07 AM", "Seen (not impressed)", "Seen · she screenshotted it"];
const HIDDEN_TITLES = ["Kiki: where did u go? 🥺", "Kiki is typing… 💔", "(14) missed messages from Kiki", "Kiki: nvm. didn't want to talk anyway"];
const DAMAGE = [[25, "Mild interest 🙂"], [50, "Situationship stress 😬"], [75, "Calling mom 📞"], [100, "Booking therapy 🛋️"], [101, "therapy.exe is running"]];
const dmgLabel = (d) => DAMAGE.find(([m]) => d < m)[1];
const rand = (a, b) => a + Math.random() * (b - a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const time = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const oneOf = (a) => a[Math.floor(Math.random() * a.length)];

// One Gemini call per message. null = failed (the UI shows a funny error with Retry).
async function askLLM(history, status, serious, mood, stop) {
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ messages: history.filter((m) => m.text !== "__deleted__" && !m.err).slice(-16).map(({ role, text }) => ({ role, text })), status, serious, mood, stop }),
    });
    const d = await r.json().catch(() => ({}));
    return r.ok && d.reply ? d.reply.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 2) : null;
  } catch {
    return null;
  }
}

// ---- Relationship MIS + divorce certificate (same row format, same PNG exporter) ----
const seedOf = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
const LINE = { t: "------------------------------" };

function buildMIS(msgs, damage, status, dodges) {
  const mine = msgs.filter((m) => m.role === "me");
  const text = mine.map((m) => m.raw).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const moods = new Set(msgs.filter((m) => m.mood).map((m) => m.mood)).size;
  const hr = new Date().getHours(), seed = seedOf(text);
  const cac = 80 * mine.length + 20 * dodges;
  const roi = -Math.min(99, Math.round(damage * 0.6 + (seed % 35)));
  const churn = Math.min(99, Math.round(35 + damage / 2 + dodges * 2));
  const runway = Math.max(1, Math.round(60 - damage / 2 - mine.length));
  const flags = [];
  if (/\?/.test(text)) flags.push("Asks questions. Wants answers. Needy.");
  if (/sorry|please|pls/i.test(text)) flags.push("Said sorry/please. Zero leverage.");
  if (hr >= 23 || hr < 5) flags.push("Texting at this hour. We know what that means.");
  if (dodges >= 4) flags.push("Chased a button. Imagine chasing a person.");
  flags.push("Replied within seconds. Too available.");
  const verdict = damage >= 80 ? "Not a relationship. A case study. Therapy recommended." : damage >= 50 ? "Great chemistry, terrible clarity. Textbook situationship." : "Cute. Dangerous. Still undefined.";
  return [
    { t: "RELATIONSHIP MIS", big: 1 },
    { t: "Q3 FY Vibes · CONFIDENTIAL (to Kiki)", sm: 1 },
    { t: "Report #" + (1000 + seed) + " · " + new Date().toLocaleDateString("en-IN"), sm: 1 },
    LINE,
    { l: "Messages sent", r: mine.length },
    { l: "Avg words/msg", r: (words / mine.length).toFixed(1) },
    { l: "Final status", r: status.replace(/ [^\w ]+$/u, "") },
    { l: "Moods survived", r: moods + "/6" },
    LINE,
    { t: "KEY METRICS", b: 1 },
    { l: "Emotional damage", r: damage + "%" },
    { l: "Emotional ROI", r: roi + "%" },
    { l: "Commitment rate", r: (((seed % 18) + 2) / 10).toFixed(1) + "%" },
    { l: "CAC (per 'hii')", r: "₹" + cac.toLocaleString("en-IN") },
    { l: "Churn probability", r: churn + "%" },
    { l: "Runway", r: runway + " days" },
    { l: "NPS (would rec.)", r: Math.max(0, Math.round(10 - damage / 11)) + "/10" },
    LINE,
    { t: "RED FLAGS", b: 1 },
    ...flags.slice(0, 4).map((f) => ({ t: "• " + f })),
    LINE,
    { t: "VERDICT", b: 1 },
    { t: verdict },
    { t: "Board recommends: " + oneOf(["pivot to friendship", "hire a therapist", "unsubscribe", "never reply to 'k'"]) },
    LINE,
    { t: SITE, sm: 1 },
  ];
}

function buildCert(who, msgs, t0) {
  const k = msgs.filter((m) => m.role === "me").length, s = Math.round((Date.now() - t0) / 1000);
  const me = who.trim() || "The Overthinker", seed = seedOf(msgs.map((m) => m.text).join(""));
  const grounds = ["Irreconcilable vibes", "Left on read (twice)", "Differences in texting speed", "Mixed signals (mutual)", "Said 'k' at a sensitive time"][seed % 5];
  return [
    { t: "CERTIFICATE OF DIVORCE", big: 1 },
    { t: "State of Emotional Damage · Case #" + (1000 + seed), sm: 1 },
    { t: "This certifies that", sm: 1 },
    { t: me, big: 1 },
    { t: "and", sm: 1 },
    { t: "KIKI 💅", big: 1 },
    { t: "are hereby divorced, effective immediately.", sm: 1 },
    { t: "Marriage lasted " + Math.floor(s / 60) + "m " + (s % 60) + "s (" + k + " messages)" },
    { t: "Grounds: " + grounds },
    { t: "Custody: playlist → Kiki · Wi-Fi password → " + me + " · group chat → undecided" },
    { t: "Alimony: ₹0 and one apology (pending)" },
    { t: "Witnessed by: The Group Chat" },
    { t: "Signed: Kiki 💅 (seen)", b: 1 },
    { t: SITE, sm: 1 },
  ];
}

function wrap(ctx, str, w) {
  const out = []; let line = "";
  for (const word of str.split(" ")) {
    if (ctx.measureText(line + word).width > w && line) { out.push(line.trimEnd()); line = ""; }
    line += word + " ";
  }
  return [...out, line.trimEnd()];
}

function downloadPNG(rows, name, cert) {
  const W = cert ? 640 : 560, P = 44, c = document.createElement("canvas"), ctx = c.getContext("2d");
  const fam = cert ? "Georgia, 'Times New Roman', serif" : "'Courier New', monospace";
  c.width = W; c.height = 1800; // upper bound, cropped below
  ctx.fillStyle = cert ? "#fff6dc" : "#fffdf5"; ctx.fillRect(0, 0, W, c.height);
  ctx.fillStyle = cert ? "#5a0a1e" : "#222";
  let y = 78;
  for (const r of rows) {
    const mid = cert || r.big;
    ctx.font = `${r.big ? "bold " + (cert ? 32 : 26) : r.b ? "bold 20" : r.sm ? "15" : "19"}px ${fam}`;
    if (r.l) { ctx.textAlign = "left"; ctx.fillText(r.l, P, y); ctx.textAlign = "right"; ctx.fillText(String(r.r), W - P, y); y += 30; }
    else { ctx.textAlign = mid ? "center" : "left"; for (const ln of wrap(ctx, r.t, W - 2 * P)) { ctx.fillText(ln, mid ? W / 2 : P, y); y += r.big ? 38 : 27; } y += cert ? 10 : 4; }
  }
  const out = document.createElement("canvas"); out.width = W; out.height = y + 36;
  const o = out.getContext("2d");
  o.drawImage(c, 0, 0);
  if (cert) { o.strokeStyle = "#8b0000"; o.lineWidth = 6; o.strokeRect(14, 14, W - 28, out.height - 28); o.lineWidth = 2; o.strokeRect(26, 26, W - 52, out.height - 52); }
  out.toBlob((b) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}

// ---- app -------------------------------------------------------------
export default function App() {
  const uid = useRef(0);
  const [msgs, setMsgs] = useState([{ id: 0, role: "her", text: "heyyy 👀 oh. it's you.", t: time() }]);
  const [text, setText] = useState("");
  const [damage, setDamage] = useState(4);
  const [busy, setBusy] = useState(false);
  const [ghost, setGhost] = useState(false); // fake "typing…" with no message coming
  const [typing, setTyping] = useState(0);
  const [label, setLabel] = useState(0);
  const [dodges, setDodges] = useState(0); // dodges done for the current message
  const [dodgesAll, setDodgesAll] = useState(0);
  const [pos, setPos] = useState([0, 0]);
  const [sure, setSure] = useState(null); // pending message waiting for "are you sure?"
  const [serious, setSerious] = useState(false);
  const [mood, setMood] = useState("Warming up 🥶");
  const [notif, setNotif] = useState(null);
  const [panel, setPanel] = useState(null); // "mis" | "cert"
  const [who, setWho] = useState("");
  const [breaking, setBreaking] = useState(false);
  const [cookie, setCookie] = useState(false);
  const [visitor] = useState(() => 42000 + Math.floor(Math.random() * 900));
  const n = msgs.filter((m) => m.role === "me").length;
  const status = statusFor(n);
  const endRef = useRef(null), lastReq = useRef(null), tick = useRef(0), lastMood = useRef(-1), t0 = useRef(Date.now()), ghostLock = useRef(false);

  const toast = (t) => setNotif(t);
  const flashGhost = (ms) => { setGhost(true); setTimeout(() => setGhost(false), ms); };
  const typingNow = busy || ghost;

  useEffect(() => { const i = setInterval(() => setLabel((l) => (l + 1) % 4), 1700); return () => clearInterval(i); }, []);
  useEffect(() => {
    if (!typingNow) return;
    const i = setInterval(() => setTyping((t) => (t + 1) % TYPING.length), 700);
    return () => clearInterval(i);
  }, [typingNow]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, typingNow]);
  useEffect(() => { if (notif) { const t = setTimeout(() => setNotif(null), 3500); return () => clearTimeout(t); } }, [notif]);

  // First 10 seconds: she's already making it weird before you've typed anything.
  useEffect(() => {
    const add = (t) => setMsgs((m) => (m.some((x) => x.role === "me") ? m : [...m, { id: ++uid.current + 1000, role: "her", text: t, t: time() }]));
    const ids = [
      setTimeout(() => toast("Kiki viewed your profile 4 times 👀"), 900),
      setTimeout(() => setGhost(true), 1300),
      setTimeout(() => { setGhost(false); add("wait dont reply yet. im overthinking 🌀"); }, 2600),
      setTimeout(() => setCookie(true), 3000),
      setTimeout(() => setGhost(true), 3600),
      setTimeout(() => { setGhost(false); add("ok. you may speak. impress me. i have 4 other chats rn 💅"); }, 5000),
    ];
    return () => ids.forEach(clearTimeout);
  }, []);

  // Tab title: typing indicator while she "types", guilt-trip when you leave.
  useEffect(() => {
    const lastHer = [...msgs].reverse().find((m) => m.role === "her" && m.text !== "__deleted__");
    const here = typingNow ? `Kiki is ${TYPING[typing].toLowerCase()}… 💬` : lastHer && n ? `Kiki: ${lastHer.text.slice(0, 28)}` : "SituationshipGPT 💘";
    let k = 0;
    const set = () => { document.title = document.hidden ? HIDDEN_TITLES[k++ % HIDDEN_TITLES.length] : here; };
    set();
    const i = setInterval(set, 2500);
    document.addEventListener("visibilitychange", set);
    return () => { clearInterval(i); document.removeEventListener("visibilitychange", set); };
  }, [msgs, typingNow, typing, n]);

  const pickMood = () => {
    let m;
    do { m = Math.floor(Math.random() * MOODS.length); } while (m === lastMood.current);
    lastMood.current = m;
    return m;
  };

  // One reply. `ack` = this message asked her to stop flirting.
  async function respond(history, raw, count, nowSerious, ack) {
    setBusy(true);
    const mi = nowSerious ? -1 : pickMood();
    const mine = history.filter((m) => m.role === "me");
    const prev = mine.length > 1 ? mine[mine.length - 2].raw : "";
    lastReq.current = [history, raw, count, nowSerious, ack];
    const wait = sleep(rand(1500, 2600)); // intentional delay, < 3s
    const [llm] = await Promise.all([askLLM(history, statusFor(count), nowSerious, mi < 0 ? "flirty" : MOODS[mi].k, ack), wait]);
    setBusy(false);
    if (!Array.isArray(llm)) { setMsgs((m) => [...m, { id: ++uid.current + 1000, role: "her", err: true, text: oneOf(ERRS), why: llm.why, t: time() }]); return; }
    let bubbles = llm;
    if (!nowSerious && count > 1 && Math.random() < 0.18) bubbles = ["__deleted__", ...bubbles];
    const mk = mi < 0 ? "serious" : MOODS[mi].k;
    setMood(mi < 0 ? "Serious 🫡 (boundaries)" : MOODS[mi].n);
    setMsgs((m) => [...m, ...bubbles.map((b) => ({ id: ++uid.current + 1000, role: "her", text: b, t: time(), mood: mk }))]);
    return count;
  }

  async function deliver(raw, sentText) {
    const count = n + 1; // this message's number
    const ack = STOP_RE.test(raw) && !serious;
    const nowSerious = STOP_RE.test(raw) ? true : RESUME_RE.test(raw) ? false : serious;
    setSerious(nowSerious);
    const mineMsg = { id: ++uid.current, role: "me", text: sentText, raw, t: time(), seen: null };
    const history = [...msgs, mineMsg];
    setMsgs(history);
    setText(""); setDodges(0); setPos([0, 0]);
    setDamage((d) => Math.min(100, d + Math.round(rand(8, 15))));
    setTimeout(() => setMsgs((m) => m.map((x) => (x.id === mineMsg.id ? { ...x, seen: oneOf(SEEN) } : x))), 600);
    await respond(history, raw, count, nowSerious, ack);
    if (statusFor(count) !== statusFor(count - 1)) toast("Relationship status changed to: " + statusFor(count));
    else if (count % 2 === 0) toast(NOTIFS[tick.current++ % NOTIFS.length]);
    if (count === 5) toast("📊 Your Relationship MIS is ready!");
    if (count === 6) toast("📜 Divorce papers have been drafted!");
  }

  // "Regenerate response", renamed: she answers the same message again, different mood.
  function reconsider() {
    if (busy) return;
    const li = msgs.map((m) => m.role).lastIndexOf("me");
    if (li < 0) return;
    const history = msgs.slice(0, li + 1);
    setMsgs(history);
    setDamage((d) => Math.min(100, d + 5));
    respond(history, history[li].raw, n, serious, false);
  }

  function submit(e) {
    e?.preventDefault();
    const raw = text.trim();
    if (!raw || busy || sure) return;
    if (dodges < 2) return dodge();
    if (Math.random() < 0.25) { setSure(raw); return; }
    deliver(raw, raw);
  }

  function retry() {
    if (busy || !lastReq.current) return;
    setMsgs((m) => m.filter((x) => !x.err));
    respond(...lastReq.current);
  }

  function dodge() {
    if (!text.trim() || busy || sure || dodges >= 2) return;
    const small = window.innerWidth < 600;
    setPos([rand(small ? -90 : -170, small ? 40 : 170), -rand(50, 90)]);
    setDodges((d) => d + 1);
    setDodgesAll((d) => d + 1);
    setDamage((d) => Math.min(100, d + 2));
    setLabel((l) => (l + 1) % 4);
  }

  function onType(e) {
    setText(e.target.value.slice(0, 300));
    // She starts typing. Then stops. Classic.
    if (!busy && !ghostLock.current && Math.random() < 0.08) {
      ghostLock.current = true; flashGhost(1400);
      setTimeout(() => { ghostLock.current = false; }, 6000);
    }
  }

  function breakUp() {
    setBreaking(true);
    setTimeout(() => {
      setMsgs([{ id: 0, role: "her", text: "oh. you're back. i didn't block you. i muted you. 🙂", t: time() }]);
      setDamage(4); setSerious(false); setPanel(null); setBreaking(false); setSure(null); setText(""); setDodgesAll(0);
      setMood("Warming up 🥶"); t0.current = Date.now(); lastMood.current = -1;
    }, 2200);
  }

  const rows = panel === "mis" ? buildMIS(msgs, damage, status, dodgesAll) : panel === "cert" ? buildCert(who, msgs, t0.current) : null;
  const lastIsHer = msgs[msgs.length - 1].role === "her";

  return (
    <div className="page">
      <div className="marquee"><span>★ SituationshipGPT.com — India's #1 Trusted Mixed-Signals Service ★ 100% Verified Profiles* ★ *Not verified ★ Horoscope Matching Available ★</span></div>
      <h1 className="logo">SituationshipGPT <span>💘</span></h1>
      <p className="tag">The only AI that gives you mixed signals instead of tokens.</p>

      {cookie && (
        <div className="cookie" role="dialog" aria-label="Cookies">
          <b>🍪 Kiki uses cookies to remember everything you say. Forever.</b>
          <div className="grow">
            {["Accept", "Accept harder", "Manage my feelings"].map((b) => (
              <button key={b} onClick={() => { setCookie(false); toast("Preferences saved. Not like she saves yours. (We collect nothing.)"); }}>{b}</button>
            ))}
          </div>
        </div>
      )}

      <div className="layout">
        <aside className="biodata">
          <h3>~ Profile of the Day ~</h3>
          <div className="photo">🧍‍♀️<small>(photo hidden — you haven't earned it)</small></div>
          <table><tbody>
            <tr><td>Name</td><td>Kiki 💅</td></tr>
            <tr><td>Age</td><td>26 (emotionally 14)</td></tr>
            <tr><td>Height</td><td>5'4" (5'7" in heels)</td></tr>
            <tr><td>Education</td><td>MBA (Mostly Bad Attachment)</td></tr>
            <tr><td>Diet</td><td>Pure Veg (except 2am)</td></tr>
            <tr><td>Income</td><td>₹ Emotional</td></tr>
            <tr><td>Guna Match</td><td>4/36 ✨</td></tr>
            <tr><td>Looking for</td><td>Someone who "just gets it"</td></tr>
          </tbody></table>
          <p className="views">Profile views: 3 (all you)</p>
        </aside>

        <main className={"chat" + (breaking ? " shake" : "")}>
          <header className="chead">
            <div className="av">K</div>
            <div className="who">
              <b>Kiki 💅 <em>{typingNow ? TYPING[typing] + "…" : "last seen: never (for you)"}</em></b>
              <div className="pills">
                <span className="pill" key={status}>{status}</span>
                <span className="pill mood" key={mood}>{mood}</span>
              </div>
            </div>
            <div className="match">It's a Match! 🔥</div>
          </header>

          <div className="meter">
            <label>Emotional Damage: {damage}% — {dmgLabel(damage)}</label>
            <div className="bar"><i style={{ width: damage + "%" }} /></div>
          </div>

          <div className="msgs" aria-live="polite">
            <div className="day">TODAY · End-to-end encrypted (except my feelings)</div>
            {msgs.map((m) => m.text === "__deleted__"
              ? <div key={m.id} className="b her deleted">🚫 This message was deleted</div>
              : m.err ? (
                <div key={m.id} className="b her err">{m.text}<br /><small>{m.why}</small><br /><button className="retry" onClick={retry}>↻ Retry (she might come back)</button></div>
              ) : (
                <div key={m.id} className={"b " + m.role}>
                  {m.text.split("\n").map((l, j) => <div key={j}>{l}</div>)}
                  <small>{m.t} {m.role === "me" && <><span className={"tick" + (m.seen ? " on" : "")}>✓✓</span>{m.seen && <i className="seen"> {m.seen}</i>}</>}</small>
                </div>
              ))}
            {typingNow && <div className="b her typing">{TYPING[typing]}<span className="dots" /></div>}
            <div ref={endRef} />
          </div>

          {n === 0 && !busy && (
            <div className="starters">
              <span className="sl">Icebreakers (she'll ignore all of these):</span>
              {STARTERS.map((s) => <button key={s} onClick={() => !busy && deliver(s, s)}>{s}</button>)}
            </div>
          )}

          {n > 0 && lastIsHer && !busy && !sure && (
            <button className="reconsider" onClick={reconsider}>🥺 Make her reconsider</button>
          )}

          {sure && (
            <div className="gate" role="dialog" aria-label="Are you sure">
              <b>Are you sure you want to text her?</b>
              <span>She will see this. Her group chat may screenshot it. Kiki's lawyer may use it against you.</span>
              <div className="grow">
                <button onClick={() => { const r = sure; setSure(null); deliver(r, r); }}>Yes</button>
                <button onClick={() => { const r = sure; setSure(null); deliver(r, r); }}>Also yes</button>
                <button className="struck" disabled title="Cancel unavailable: commitment issues">Cancel</button>
              </div>
            </div>
          )}

          <form className="input" onSubmit={submit}>
            <input value={text} onChange={onType} placeholder="Draft a risky text (she'll read it twice)" aria-label="Message" disabled={busy} />
            <button
              type="submit"
              className="send"
              style={{ transform: `translate(${pos[0]}px, ${pos[1]}px)` }}
              onPointerEnter={(e) => e.pointerType === "mouse" && dodge()}
              onClick={(e) => { if (dodges < 2) { e.preventDefault(); dodge(); } }}
            >{LABELS[label]}</button>
          </form>
          <div className="hint">{dodges < 2 && text.trim() ? `Send button is playing hard to get (${dodges}/2)` : "Seen ✓✓ · typing sounds loud"}</div>
        </main>
      </div>

      <footer className="foot">
        <div className="construction">🚧 UNDER CONSTRUCTION (like her feelings) 🚧</div>
        <div>Best viewed in Internet Explorer 6 · You are visitor #{String(visitor).padStart(6, "0")} · By continuing you consent to emotional damage</div>
      </footer>

      <button className="breakup" onClick={breakUp}>💔 BREAK UP</button>
      {n >= 5 && <button className="rcpt" onClick={() => setPanel("mis")}>📊 Relationship MIS</button>}
      {n >= 6 && <button className="rcpt cert-btn" onClick={() => setPanel("cert")}>📜 Divorce papers</button>}
      {notif && <div className="notif" role="status">🔔 {notif}</div>}

      {breaking && <div className="overlay"><div><h2>💔 Breaking up…</h2><p>Blocking on WhatsApp. Muting on Insta. Unfollowing on LinkedIn.</p></div></div>}

      {panel && (
        <div className="overlay" onClick={() => setPanel(null)}>
          <div className={"paper" + (panel === "cert" ? " cert" : "")} onClick={(e) => e.stopPropagation()}>
            {panel === "cert" && (
              <label className="who-in">Your name for the paperwork (stays in this tab):
                <input value={who} maxLength={24} placeholder="The Overthinker" onChange={(e) => setWho(e.target.value)} />
              </label>
            )}
            {rows.map((r, i) => r.l
              ? <div key={i} className="rrow"><span>{r.l}</span><span>{r.r}</span></div>
              : <div key={i} className={r.big ? "rbig" : r.b ? "rb" : r.sm ? "rsm" : ""}>{r.t}</div>)}
            <div className="grow">
              <button onClick={() => downloadPNG(rows, panel === "cert" ? "divorce-certificate.png" : "relationship-mis.png", panel === "cert")}>⬇ Download {panel === "cert" ? "certificate" : "MIS"}</button>
              <button className="tiny" onClick={() => setPanel(null)}>close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
