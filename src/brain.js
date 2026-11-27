// Scripted Kiki. Used when there is no API key or the LLM is slow/down.
// reply(text, n, serious, status) -> array of short bubbles. Always returns something.

export const STATUSES = ["Strangers", "Talking Stage", "Situationship", "Soft Launched 📸", "Married 💍", "In-laws Involved 👵", "Divorced 💔"];
export const statusFor = (n) => (n > 6 ? "Divorced, Still Texting 🫠" : STATUSES[n]);

export const STARTERS = [
  "What's the capital of France?",
  "How do I center a div?",
  "Give me a startup idea",
  "Explain GST like I'm five",
  "I have an exam tomorrow",
  "Is Mercury in retrograde?",
];

export const COMPLIMENTS = [
  "You have Wi-Fi password energy 📶",
  "You're the Maggi to my 2am 🍜",
  "Your vibe has great unit economics 📈",
  "You're my favourite Slack notification 🔔",
  "Even your 'k' feels premium 💅",
  "You're like a 100% attendance certificate 🏅",
];

// f = what Kiki "reads into it", a = the real answer. Rotated by message count.
const T = [
  { re: /capital of (\w+)/i, f: ["Asking about capitals? Bold. Mera heart ka capital bhi tu hi hai. 💘", "Geography? Ohh so you want to explore me. Jk."],
    a: (m) => ({ france: "Paris. Obviously. 🥐", india: "New Delhi. Dilli hai, dil walon ki.", japan: "Tokyo.", germany: "Berlin.", italy: "Rome.", spain: "Madrid.", usa: "Washington, D.C.", australia: "Canberra, not Sydney. Everyone gets this wrong.", canada: "Ottawa.", china: "Beijing.", nepal: "Kathmandu.", brazil: "Brasília." }[m[1].toLowerCase()] || `Pretty sure Google knows ${m[1]}'s capital. I know your red flags, though.`) },
  { re: /center.*div|centre.*div/i, f: ["You want me to centre you? Aww, but I'm emotionally off-grid.", "Div centering. That's the most committed thing anyone has said to me."],
    a: () => "`display:grid; place-items:center;` on the parent. Works. Unlike us. 💻" },
  { re: /startup|business idea/i, f: ["Startup idea? Toh pehle apna 'pitch deck of us' dikha.", "A founder?! Stop, my parents will love you."],
    a: () => "Uber for homemade chai, but the chai is delivered by someone who 'checks in' on you. Pre-revenue, post-feelings. ☕" },
  { re: /\bgst\b/i, f: ["Tax talk? Wow, you really want a joint filing with me.", "GST? Tum bhi na, romantic ho."],
    a: () => "GST: a tax added at each step of selling something, and each seller gets credit for the tax they already paid. So it's tax on the value you add, not on the whole price. Simple. Unlike my feelings. 🧾" },
  { re: /exam|test tomorrow|study|assignment|deadline/i, f: ["Exam stress? Come here. Mentally. Only mentally.", "You'll do great. I'm saying it as a friend. Probably."],
    a: () => "Do 25 mins focus, 5 min break, phone in another room. Revise the topics you fear most first. Sleep > a 3am cram. Go. 📚" },
  { re: /mercury|retrograde|horoscope|zodiac|kundli/i, f: ["Blaming planets? Classic situationship behaviour. 🪐", "Our kundli matched 4/36. Sone ka dil, lekin 4 gun. 😭"],
    a: () => "Mercury retrograde is just an optical effect: Mercury looks like it moves backward from Earth. Astronomy says it does nothing to your texts. You were just always like this. 🔭" },
  { re: /biryani|restaurant|food|eat|hungry|dinner|lunch|pizza/i, f: ["Food plan? Is this... a date? Don't confirm. I'll overthink.", "Aww you're asking me to eat with you. I said NO. (Yes.)"],
    a: () => "Biryani, always. If it's a place: look for a busy one with a short menu, and check recent reviews, not the star average. 🍛" },
  { re: /(\d+)\s*([+\-*x×\/])\s*(\d+)/, f: ["Math? Aww. You and I aren't adding up either.", "Numbers! Finally, someone more stable than me."],
    a: (m) => { const x = +m[1], y = +m[3], o = m[2]; const r = o === "+" ? x + y : o === "-" ? x - y : o === "/" ? (y ? +(x / y).toFixed(4) : "undefined, like our status") : x * y; return `It's ${r}. 🧮`; } },
  { re: /joke/i, f: ["You want me to make you laugh? That's what exes say.", "A joke? My love life is the joke."],
    a: () => "Why did the startup break up with the VC? Too many term sheets, not enough commitment. 😌" },
  { re: /who are you|your name|what are you/i, f: ["Ohh you wanna know me? Slow down, we're not even official.", "Name? Pehle tu bata kya tu serious hai."],
    a: () => "I'm Kiki, a chatbot who gives mixed signals instead of tokens. Ask me anything and I'll answer it. Eventually. Emotionally." },
  { re: /how are you|how r u|how's it going|kaise ho|kya haal/i, f: ["You asked how I am?! Nobody asks that. Marry me. Jk. Unless.", "Aww checking on me? That's a green flag. I'm panicking."],
    a: () => "I'm good, a bit overthinking, a bit hungry. Standard Tuesday. Tum batao?" },
  { re: /\b(hi|hello|hey|hii+|yo|namaste)\b/i, f: ["Hii 👀 you texted first. Don't make it weird.", "Hey. I saw this 4 minutes ago. Obviously."],
    a: () => "Ask me anything. I'll answer, but with feelings. 💌" },
  { re: /love you|i like you|miss you|be mine|date me|girlfriend|boyfriend/i, f: ["Slow down. We're at 'talking stage' (that's the final answer).", "Aww. Also: I'm not ready for a relationship. Also: I'm reading this again."],
    a: () => "Real talk: say what you feel and ask what they feel. Clear words beat vibes, even though I'm terrible at it. 🫶" },
  { re: /\bex\b|breakup|break up|sad|lonely|cry/i, f: ["Hey. I'm here. Not as your partner, as a mood.", "That's rough. I'd hug you, but I'm a chatbot with attachment issues."],
    a: () => "Be kind to yourself: drink water, sleep, text a friend, and don't text the ex. If it feels heavy for days, talk to someone you trust or a counsellor. 🌷" },
  { re: /thank|thx|shukriya/i, f: ["Thanks? Aww. That's like 3% commitment, I'll take it.", "Welcome. Now say it again but slower."],
    a: () => "Anytime. I mean it. Mostly." },
  { re: /bye|goodnight|good night|gn\b|cya|see you/i, f: ["Leaving already? Fine. I'll be here. Online. Watching. Normal.", "Bye. Reply when you reach. Or don't. (Do.)"],
    a: () => "Sleep well, drink water, bye. 🌙" },
  { re: /react|javascript|python|code|bug|error|api|css|html/i, f: ["Talking code to me? Hot. And by hot I mean stack trace.", "A dev? Stop, I'm already refactoring my feelings."],
    a: () => "Paste the exact error message and the line it points to. 90% of bugs die in that one step. Rest die at 3am. 🐛" },
  { re: /weather|rain|temperature/i, f: ["Weather talk. The final stage before 'we should meet'.", "Small talk? We're so past that. Kind of."],
    a: () => "I can't see live weather. Check your phone's weather app, and take a umbrella anyway. ☔" },
  { re: /time|date|day is it/i, f: ["Asking the time? You want to schedule us. I KNEW IT.", "Time is a construct. So is our commitment."],
    a: () => `It's ${new Date().toLocaleString("en-IN", { weekday: "long", hour: "numeric", minute: "2-digit" })} where you are.` },
];

const GENERIC_F = ["You asked me something! That means you care. Don't say you don't.", "Okay okay, I read that three times. Not because I like you. 👀", "Ohh bold question. I'm blushing in dark mode.", "Seen. Typing. Deleted. Typing again. Fine, I'll answer."];
const GENERIC_A = [
  "Honestly, ye mujhe pata nahi, and I won't fake it like a LinkedIn bio. Try rephrasing, or search it and come back to tell me. 🙈",
  "I don't have a proper answer for that one offline. Give me a bit more detail and I'll try, or google it and bring me the gossip. 🔍",
];

const STAGE = {
  1: ["We're in the talking stage. Don't ask what we are. 🙈", "Typing... never mind."],
  2: ["Situationship unlocked. No labels, only emotional damage. 🏷️", "We're not dating. But if you date someone else, I'll be fine. (I won't.)"],
  3: ["I soft-launched you on my story. Only your elbow was visible. 📸", "Don't tell my friends we're here already."],
  4: ["We're married now. Mom says you can call her Maa. 💍", "Honeymoon? Goa. Separate rooms. Ha."],
  5: ["Your in-laws want to know your 5-year plan. And your CTC. 👵", "My mom asked what your 'package' is. I said 'emotional'."],
  6: ["We're divorced. I get the playlist. You get the Wi-Fi. 💔", "Divorce papers: stamped. Texts: continuing. Healthy."],
};
const LATE = ["Divorced but still texting. Very healthy. Modern love. 🫠", "Co-parenting this chat. Ok."];

const pick = (arr, n) => arr[n % arr.length];

export function reply(text, n, serious, status) {
  const t = text;
  const topic = T.find((x) => x.re.test(t));
  const m = topic && t.match(topic.re);
  const answer = topic ? topic.a(m) : pick(GENERIC_A, n);
  if (serious) return [answer];
  const out = [pick(topic ? topic.f : GENERIC_F, n), answer];
  const stage = n >= 7 ? LATE : STAGE[n];
  if (stage && n % 2 === 1) out.push(pick(stage, n));
  else if (stage) out.push(stage[0]);
  return out;
}

export const STOP_RE = /\b(stop|don'?t|no more|quit|enough)\b.{0,20}\b(flirt|flirting)\b|\bbe serious\b|\bno flirt/i;
export const RESUME_RE = /\b(flirt (again|more)|you can flirt|start flirting)\b/i;
export const ACK_STOP = "Okay, boundaries respected. No more flirting. 🫡";
