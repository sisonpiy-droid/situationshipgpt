// Smoke test: scripted brain always answers, every mood works, callbacks and "stop flirting" behave.
import assert from "node:assert";
import { reply, statusFor, STARTERS, STOP_RE, MOODS, echo } from "./src/brain.js";
for (const s of [...STARTERS, "zzz qwerty", "", "hello"]) for (let n = 1; n < 10; n++) for (let m = 0; m < MOODS.length; m++) {
  const r = reply(s, n, false, statusFor(n), m, "earlier thing");
  assert(r.length >= 1 && r.every((x) => x && !x.includes("{")), `${s}|${n}|${m}`);
}
assert.match(reply("capital of France?", 1, false, "", 0)[1], /Paris/);
assert.match(reply("capital of France?", 2, false, "", 4, "how are you today")[2], /how are you today/); // callback
assert.match(reply("k", 1, false, "", 1)[0] + reply("k", 1, false, "", 1)[1], /Say more words/);
assert.deepEqual(reply("what is 6*7", 1, true), ["It's 42. 🧮"]);
assert(STOP_RE.test("please stop flirting") && !STOP_RE.test("what is GST"));
assert.equal(statusFor(0), "Strangers"); assert.match(statusFor(6), /Divorced/);
assert.equal(echo("What's the capital of France? Quick"), "What's the capital of France");
console.log("ok");
