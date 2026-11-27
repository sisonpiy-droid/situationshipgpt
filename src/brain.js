// UI-side constants only. Kiki's replies come from Gemini (api/chat.js); nothing is scripted.
export const STATUSES = ["Strangers", "Talking Stage", "Situationship", "Soft Launched 📸", "Married 💍", "In-laws Involved 👵", "Divorced 💔"];
export const statusFor = (n) => (n > 6 ? "Divorced, Still Texting 🫠" : STATUSES[n]);

export const STARTERS = ["k", "What are we?", "I need space", "What's the capital of France?", "How do I center a div?", "I have a girlfriend", "Is Mercury in retrograde?"];

export const MOODS = [
  { k: "flirty", n: "Flirty 😘" },
  { k: "dry", n: "Dry texting 😐" },
  { k: "cringe", n: "Cringe 🤡" },
  { k: "overthink", n: "Overthinking 🌀" },
  { k: "mba", n: "MBA mode 📊" },
  { k: "drama", n: "Dramatic 🎭" },
];

export const STOP_RE = /\b(stop|don'?t|no more|quit|enough)\b.{0,20}\b(flirt|flirting)\b|\bbe serious\b|\bno flirt/i;
export const RESUME_RE = /\b(flirt (again|more)|you can flirt|start flirting)\b/i;
