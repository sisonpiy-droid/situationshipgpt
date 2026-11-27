// `npm test`: UI constants sanity, then (if GEMINI_API_KEY is set) a LIVE check that the same
// message sent 5 times gets 5 different Gemini replies, plus a factual question answered correctly.
import assert from "node:assert";
import { statusFor, STOP_RE, STARTERS } from "./src/brain.js";
import handler from "./api/chat.js";
assert.equal(statusFor(0), "Strangers"); assert.match(statusFor(6), /Divorced/);
assert(STOP_RE.test("please stop flirting") && !STOP_RE.test("what is GST") && STARTERS.length);
const call = (messages, extra = {}) => new Promise((resolve) => {
  const res = { setHeader() {}, end: (s) => resolve({ code: res.statusCode, ...JSON.parse(s) }) };
  handler({ method: "POST", headers: {}, body: { messages, status: "Situationship", mood: "flirty", ...extra } }, res);
});
if (!process.env.GEMINI_API_KEY) { console.log("ok (offline: skipped live Gemini check, run with --env-file=.env)"); process.exit(0); }
const msgs = [];
const seen = [];
for (let i = 0; i < 5; i++) {
  msgs.push({ role: "me", text: "i miss you" });
  const r = await call(msgs); assert.equal(r.code, 200, JSON.stringify(r));
  console.log(i + 1, r.reply.replace(/\n/g, " / ")); seen.push(r.reply.toLowerCase());
  msgs.push({ role: "her", text: r.reply });
}
assert.equal(new Set(seen).size, 5, "replies repeated");
const f = await call([{ role: "me", text: "what is 12*7?" }], { serious: true });
console.log("math:", f.reply); assert.match(f.reply, /84/);
console.log("ok");
