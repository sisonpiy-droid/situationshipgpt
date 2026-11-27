// Server-side Gemini proxy. The key lives in env only; the client never sees it.
const hits = new Map(); // ponytail: per-warm-instance limiter, use KV if abuse matters
const SYSTEM = `You are "Kiki", the user's dramatic Indian situationship, texting on WhatsApp.
Style: VERY SHORT replies: 2-3 lines separated by a newline, each line under 15 words, like real WhatsApp texts. Playful flirting, sarcasm, cringe pickup lines, natural English + Hinglish, occasional MBA/startup/dating jokes. Interpret innocent questions as romantic mixed signals, then ALWAYS give the genuinely correct, useful answer to what they asked. Mix warm and cold ("seen" energy). Where natural, call back to something the user said earlier ("you said X earlier").
Rules: no sexual content, no bullying, no offensive jokes, no real people, no slurs. If the user asks to stop flirting, or SERIOUS mode is on, stop flirting completely: give a plain, brief, helpful answer with light humour only.
Reply with only the message text, no quotes, no markdown, no narration.`;
// Mood keys are whitelisted; the client never sends free text into the prompt.
const MOODS = {
  flirty: "flirty and playful",
  dry: "dry texting: tiny lowercase lines like 'k.' or 'ok and?', then the real answer",
  cringe: "cringe: one terrible clean pickup line (startup/MBA/tech puns), then the answer",
  overthink: "overthinking: spiral about the hidden meaning of what they said, then the answer",
  mba: "MBA corporate jargon about the relationship (synergy, bandwidth, KPIs, circling back), then the answer",
  drama: "dramatic breakup energy: theatrical, betrayed, over the top, then the answer",
};

export default async function handler(req, res) {
  const send = (code, obj) => { res.statusCode = code; res.setHeader("content-type", "application/json"); res.setHeader("cache-control", "no-store"); res.end(JSON.stringify(obj)); };
  if (req.method !== "POST") return send(405, { error: "POST only" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send(503, { error: "no-key" });

  const ip = String(req.headers["x-forwarded-for"] || "x").split(",")[0].trim();
  const now = Date.now(), h = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (h.length >= 80) return send(429, { error: "rate" });
  hits.set(ip, [...h, now]);

  let b = req.body;
  if (typeof b === "string") try { b = JSON.parse(b); } catch { b = null; }
  const msgs = Array.isArray(b?.messages) ? b.messages.slice(-12) : [];
  if (!msgs.length) return send(400, { error: "no messages" });
  const contents = msgs.map((m) => ({
    role: m.role === "her" ? "model" : "user",
    parts: [{ text: String(m.text || "").slice(0, 500) }],
  }));
  const system = `${SYSTEM}\nRelationship status right now: ${String(b.status || "Strangers").slice(0, 40)}. Lean into it.\nCurrent mood: ${MOODS[b.mood] || MOODS.flirty}.${b.serious ? "\nSERIOUS mode ON: no flirting at all." : ""}`;
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal: AbortSignal.timeout(4500),
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { temperature: 1, maxOutputTokens: 700 },
      }),
    });
    const d = await r.json();
    const text = d?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (!r.ok || !text) return send(502, { error: "upstream" });
    send(200, { reply: text.slice(0, 600) });
  } catch {
    send(504, { error: "timeout" });
  }
}
