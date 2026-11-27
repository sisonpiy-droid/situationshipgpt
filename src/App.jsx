import { useEffect, useRef, useState } from "react";
import { ACK_STOP, COMPLIMENTS, RESUME_RE, STARTERS, STOP_RE, reply, statusFor } from "./brain.js";

const LABELS = ["Send", "Don't text me", "Beg to send", "Your call"];
const TYPING = ["Typing", "Deleting", "Consulting the group chat", "Overthinking"];
const NOTIFS = [
  "Kiki liked your message. Then unliked it. 💔",
  "Kiki viewed your story 11 times 👀",
  "Kiki is typing... Kiki stopped typing.",
  "Kiki changed her WhatsApp DP. Not for you.",
  "Your Situationship Score dropped by 3 🔻",
  "Kiki's mom wants to know your CTC 👵",
];
const rand = (a, b) => a + Math.random() * (b - a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const time = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

async function askLLM(history, status, serious) {
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({ messages: history.slice(-12).map(({ role, text }) => ({ role, text })), status, serious }),
    });
    if (!r.ok) return null;
    const { reply: t } = await r.json();
    return t ? t.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3) : null;
  } catch {
    return null; // no key, offline, slow: scripted fallback takes over
  }
}

// ---- receipt ---------------------------------------------------------
function buildReceipt(msgs, damage, status) {
  const mine = msgs.filter((m) => m.role === "me");
  const text = mine.map((m) => m.text).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const hr = new Date().getHours();
  const seed = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
  const commit = Math.max(1, (seed % 18) + 2) / 10; // 0.2% - 1.9%
  const roi = -(40 + (seed % 55));
  const flags = [];
  if (/\?/.test(text)) flags.push("Asks questions. Wants answers. Needy.");
  if (/sorry|please|pls/i.test(text)) flags.push("Said sorry/please. Zero leverage.");
  if (hr >= 23 || hr < 5) flags.push("Texting at this hour. We know what that means.");
  if (mine.some((m) => m.text === m.text.toLowerCase())) flags.push("Typed in all lowercase. Gives 'I'll ghost' energy.");
  flags.push("Replied within seconds. Too available.", "Used a startup as foreplay. Er, small talk.");
  const verdict = damage >= 80 ? "Not a relationship. A case study. Therapy recommended." : damage >= 50 ? "Great chemistry, terrible clarity. Textbook situationship." : "Cute. Dangerous. Still undefined.";
  const rows = [
    { t: "SITUATIONSHIP RECEIPT", big: 1 },
    { t: "Order #" + (1000 + seed) + " · " + new Date().toLocaleDateString("en-IN") },
    { t: "------------------------------" },
    { l: "Messages sent", r: mine.length },
    { l: "Avg words/msg", r: (words / mine.length).toFixed(1) },
    { l: "Final status", r: status.replace(/ [^\w ]+$/u, "") },
    { l: "Emotional damage", r: damage + "%" },
    { l: "Commitment rate", r: commit.toFixed(1) + "%" },
    { l: "Emotional ROI", r: roi + "%" },
    { l: "Replies 'seen'", r: "0 (all answered)" },
    { t: "------------------------------" },
    { t: "RED FLAGS", b: 1 },
    ...flags.slice(0, 4).map((f) => ({ t: "• " + f })),
    { t: "------------------------------" },
    { t: "VERDICT", b: 1 },
    { t: verdict },
    { t: "------------------------------" },
    { t: "No refunds. No closure. Thank you!" },
  ];
  return rows;
}

function wrap(ctx, str, w) {
  const out = []; let line = "";
  for (const word of str.split(" ")) {
    if (ctx.measureText(line + word).width > w && line) { out.push(line.trimEnd()); line = ""; }
    line += word + " ";
  }
  return [...out, line.trimEnd()];
}

function downloadReceipt(rows) {
  const W = 560, P = 36, c = document.createElement("canvas"), ctx = c.getContext("2d");
  c.width = W; c.height = 1400; // upper bound, cropped below
  let y = 70;
  ctx.fillStyle = "#fffdf5"; ctx.fillRect(0, 0, W, c.height);
  ctx.fillStyle = "#222";
  for (const r of rows) {
    ctx.font = (r.big ? "bold 26px" : r.b ? "bold 20px" : "20px") + " 'Courier New', monospace";
    if (r.l) { ctx.textAlign = "left"; ctx.fillText(r.l, P, y); ctx.textAlign = "right"; ctx.fillText(String(r.r), W - P, y); y += 30; }
    else { ctx.textAlign = r.big ? "center" : "left"; for (const ln of wrap(ctx, r.t, W - 2 * P)) { ctx.fillText(ln, r.big ? W / 2 : P, y); y += 28; } y += 4; }
  }
  const out = document.createElement("canvas"); out.width = W; out.height = y + 30;
  out.getContext("2d").drawImage(c, 0, 0);
  out.toBlob((b) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b); a.download = "situationship-receipt.png"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
}

// ---- app -------------------------------------------------------------
const OPENER = [{ role: "her", text: "heyyy 👀 oh. it's you.", t: time() }];

export default function App() {
  const [msgs, setMsgs] = useState(OPENER);
  const [text, setText] = useState("");
  const [damage, setDamage] = useState(4);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(0);
  const [label, setLabel] = useState(0);
  const [dodges, setDodges] = useState(0); // dodges done for the current message
  const [pos, setPos] = useState([0, 0]);
  const [gate, setGate] = useState(null); // pending message waiting for a compliment
  const [pick, setPick] = useState("");
  const [serious, setSerious] = useState(false);
  const [notif, setNotif] = useState(null);
  const [receipt, setReceipt] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const n = msgs.filter((m) => m.role === "me").length;
  const status = statusFor(n);
  const endRef = useRef(null);
  const tick = useRef(0);

  useEffect(() => { const i = setInterval(() => setLabel((l) => (l + 1) % 4), 1700); return () => clearInterval(i); }, []);
  useEffect(() => {
    if (!busy) return;
    const i = setInterval(() => setTyping((t) => (t + 1) % 4), 700);
    return () => clearInterval(i);
  }, [busy]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);
  useEffect(() => { if (notif) { const t = setTimeout(() => setNotif(null), 3500); return () => clearTimeout(t); } }, [notif]);

  const toast = (t) => setNotif(t);

  async function deliver(raw, sentText) {
    const count = n + 1; // this message's number
    const stop = STOP_RE.test(raw);
    const nowSerious = stop ? true : RESUME_RE.test(raw) ? false : serious;
    setSerious(nowSerious);
    const mine = { role: "me", text: sentText, t: time() };
    const history = [...msgs, mine];
    setMsgs(history);
    setText(""); setDodges(0); setPos([0, 0]); setBusy(true);
    setDamage((d) => Math.min(100, d + Math.round(rand(8, 15))));
    const wait = sleep(rand(1500, 2600)); // intentional delay, < 3s
    const [llm] = await Promise.all([askLLM(history, statusFor(count), nowSerious), wait]);
    let bubbles = llm || reply(raw, count, nowSerious, statusFor(count));
    if (stop && !serious) bubbles = [ACK_STOP, ...bubbles.slice(-1)];
    setBusy(false);
    setMsgs((m) => [...m, ...bubbles.map((b) => ({ role: "her", text: b, t: time() }))]);
    if (statusFor(count) !== statusFor(count - 1)) toast("Relationship status changed to: " + statusFor(count));
    else if (count % 2 === 0) toast(NOTIFS[tick.current++ % NOTIFS.length]);
    if (count === 5) toast("🧾 Your Relationship Receipt is ready!");
  }

  function submit(e) {
    e?.preventDefault();
    const raw = text.trim();
    if (!raw || busy || gate) return;
    if (dodges < 2) return dodge();
    // compliment gate: always on the 2nd message, otherwise ~1 in 3
    if (n === 1 || Math.random() < 0.3) { setGate(raw); setPick(""); return; }
    deliver(raw, raw);
  }

  function dodge() {
    if (!text.trim() || busy || gate || dodges >= 2) return;
    const small = window.innerWidth < 600;
    const dx = rand(small ? -90 : -170, small ? 40 : 170);
    setPos([dx, -rand(50, 90)]);
    setDodges((d) => d + 1);
    setDamage((d) => Math.min(100, d + 2));
    setLabel((l) => (l + 1) % 4);
  }

  function confirmGate() {
    const raw = gate;
    setGate(null);
    deliver(raw, `${pick}\n${raw}`);
  }

  function breakUp() {
    setBreaking(true);
    setTimeout(() => {
      setMsgs([{ role: "her", text: "oh. you're back. i didn't block you. i muted you. 🙂", t: time() }]);
      setDamage(4); setSerious(false); setReceipt(false); setBreaking(false); setGate(null); setText("");
    }, 2200);
  }

  const rows = receipt ? buildReceipt(msgs, damage, status) : null;

  return (
    <div className="page">
      <div className="marquee"><span>★ SituationshipGPT.com — India's #1 Trusted Mixed-Signals Service ★ 100% Verified Profiles* ★ *Not verified ★ Horoscope Matching Available ★</span></div>
      <h1 className="logo">SituationshipGPT <span>💘</span></h1>
      <p className="tag">The only AI that gives you mixed signals instead of tokens.</p>

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
              <b>Kiki 💅 <em>{busy ? TYPING[typing] + "…" : "online (not for you)"}</em></b>
              <span className="pill" key={status}>{status}</span>
            </div>
            <div className="match">It's a Match! 🔥</div>
          </header>

          <div className="meter">
            <label>Emotional Damage: {damage}% {damage >= 100 ? "— therapy.exe" : ""}</label>
            <div className="bar"><i style={{ width: damage + "%" }} /></div>
          </div>

          <div className="msgs" aria-live="polite">
            <div className="day">TODAY · End-to-end encrypted (except my feelings)</div>
            {msgs.map((m, i) => (
              <div key={i} className={"b " + m.role}>
                {m.text.split("\n").map((l, j) => <div key={j}>{l}</div>)}
                <small>{m.t} {m.role === "me" && <span className="tick">✓✓</span>}</small>
              </div>
            ))}
            {busy && <div className="b her typing">{TYPING[typing]}<span className="dots" /></div>}
            <div ref={endRef} />
          </div>

          {n === 0 && !busy && (
            <div className="starters">
              {STARTERS.map((s) => <button key={s} onClick={() => !busy && deliver(s, s)}>{s}</button>)}
            </div>
          )}

          {gate && (
            <div className="gate" role="dialog" aria-label="Pick a compliment">
              <b>💐 Mandatory: compliment her before sending.</b>
              {COMPLIMENTS.map((c) => (
                <label key={c}><input type="radio" name="c" checked={pick === c} onChange={() => setPick(c)} /> {c}</label>
              ))}
              <div className="grow">
                <button disabled={!pick} onClick={confirmGate}>Submit with compliment</button>
                <button className="tiny" onClick={() => setGate(null)}>cancel (cold)</button>
              </div>
            </div>
          )}

          <form className="input" onSubmit={submit}>
            <input value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} placeholder="Type a message (she'll read it twice)" aria-label="Message" disabled={busy} />
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

      <button className="breakup" onClick={breakUp}>💔 BREAK UP</button>
      {n >= 5 && <button className="rcpt" onClick={() => setReceipt(true)}>🧾 Receipt</button>}
      {notif && <div className="notif" role="status">🔔 {notif}</div>}

      {breaking && <div className="overlay"><div><h2>💔 Breaking up…</h2><p>Blocking on WhatsApp. Muting on Insta. Unfollowing on LinkedIn.</p></div></div>}

      {receipt && (
        <div className="overlay" onClick={() => setReceipt(false)}>
          <div className="paper" onClick={(e) => e.stopPropagation()}>
            {rows.map((r, i) => r.l
              ? <div key={i} className="rrow"><span>{r.l}</span><span>{r.r}</span></div>
              : <div key={i} className={r.big ? "rbig" : r.b ? "rb" : ""}>{r.t}</div>)}
            <div className="grow">
              <button onClick={() => downloadReceipt(rows)}>⬇ Download receipt</button>
              <button className="tiny" onClick={() => setReceipt(false)}>close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
