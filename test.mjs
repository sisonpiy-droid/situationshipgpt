// Smoke test: scripted brain always answers, and obeys "stop flirting".
import assert from "node:assert";
import { reply, statusFor, STARTERS, STOP_RE } from "./src/brain.js";
for (const s of [...STARTERS, "zzz qwerty", "", "hello"]) for (let n = 1; n < 10; n++) assert(reply(s, n, false, statusFor(n)).length >= 1);
assert.match(reply("capital of France?", 1, false)[1], /Paris/);
assert.deepEqual(reply("what is 6*7", 1, true), ["It's 42. 🧮"]);
assert(STOP_RE.test("please stop flirting") && !STOP_RE.test("what is GST"));
assert.equal(statusFor(0), "Strangers"); assert.match(statusFor(6), /Divorced/);
console.log("ok");
