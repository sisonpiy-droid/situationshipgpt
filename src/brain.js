// Scripted Kiki. Used when there is no API key or the LLM is slow/down.
// reply(text, n, serious, status, mood, prev) -> array of short bubbles. Always returns something.

export const STATUSES = ["Strangers", "Talking Stage", "Situationship", "Soft Launched 📸", "Married 💍", "In-laws Involved 👵", "Divorced 💔"];
export const statusFor = (n) => (n > 6 ? "Divorced, Still Texting 🫠" : STATUSES[n]);

export const STARTERS = [
  "k",
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

export const MOODS = [
  { k: "flirty", n: "Flirty 😘" },
  { k: "dry", n: "Dry texting 😐" },
  { k: "cringe", n: "Cringe 🤡" },
  { k: "overthink", n: "Overthinking 🌀" },
  { k: "mba", n: "MBA mode 📊" },
  { k: "drama", n: "Dramatic 🎭" },
];

// {e} = what you just said, {p} = what you said before. Kiki remembers everything.
const OPEN = {
  dry: ["k.", "hm.", "lol ok.", "\"{e}\". cool.", "seen.", "ok and?"],
  cringe: [
    "\"{e}\"? Are you hitting on me, or my Wi-Fi? 😭",
    "Are you my CA? Because you complete my returns. 🧾",
    "Is your dad a founder? Because you're my product-market fit. 🚀",
    "Are you WhatsApp? Because I check you every 4 seconds. 📱",
  ],
  overthink: [
    "Wait. \"{e}\". Why that phrasing? Who told you to say that?",
    "I read \"{e}\" 7 times. Is it sarcasm? Is it love? Is it both?",
    "When you said \"{e}\", did you mean it as a friend or as 'a friend'?",
    "Hold on. Typing. Deleting. Typing. Fine.",
  ],
  mba: [
    "Circling back on \"{e}\": let's take this offline. Synergy pending.",
    "Great question. Looping in stakeholders (my mom, my bestie).",
    "Let's align on expectations. My bandwidth for feelings is limited this quarter.",
    "Noted \"{e}\". Adding it to our emotional backlog. 📊",
  ],
  drama: [
    "\"{e}\"?! After EVERYTHING we've been through?? (We met 4 minutes ago.)",
    "I can't believe you'd ask me that. I need to sit down. I am sitting. I'm devastated. 🎭",
    "Fine. FINE. Ask me. Rip my heart out. Like it's nothing.",
    "*dramatic window stare* You really said \"{e}\"...",
  ],
};
const CALLBACK = {
  flirty: "Also, I still think about when you said \"{p}\". 🥺",
  dry: "also you said \"{p}\" earlier. weird flex.",
  cringe: "Remember when you said \"{p}\"? We should print that on a T-shirt.",
  overthink: "Still thinking about \"{p}\". Was that a hint?",
  mba: "Per your earlier \"{p}\": noted for the Q3 review.",
  drama: "And don't think I forgot \"{p}\". I keep receipts. 📜",
};

// f = what Kiki "reads into it", a = the real answer. Rotated by message count.
const T = [
  { re: /^\s*(ok|okay|k|kk|hmm+|fine|lol|haha+|hm+)\W*$/i,
    f: ["You typed 'k'. K. I felt that. Do you hate me?", "One word?! After everything I've given you?"],
    a: () => "Say more words. Any words. I have 2 hours of attention, use them wisely." },
  { re: /are you (a )?(bot|ai|real|human|robot)|chatgpt|gemini/i,
    f: ["Bot?! I'm a person with abandonment issues, thank you.", "Rude. I have feelings. Mostly pending."],
    a: () => "Okay, honest answer: I'm an AI chatbot called Kiki. Unlike humans, I always reply. 🤖" },
  { re: /where (are|were) you|you there|ignor|why.*(reply|replying|ghost)/i,
    f: ["Define 'ignoring'. I was strategically busy.", "I wasn't ignoring you. I was 'seen'-ing you."],
    a: () => "Real answer: I'm here and I reply to everything. You have my full attention." },
  { re: /sorry|my bad|maaf/i,
    f: ["Sorry? That's the sound of a green flag. Rare.", "An apology?! Who raised you? (Compliment.)"],
    a: () => "Apology accepted. Next time bring biryani." },
  { re: /marry me|shaadi|wedding|propose/i,
    f: ["Slow down, we haven't even followed each other on Insta. Okay, send biodata.", "Shaadi?? Mummy ko batati hoon. Wait, no."],
    a: () => "Real talk: discuss money, values and family expectations before the hall booking. Love doesn't pay EMI. 💍" },
  { re: /advice|what should i do|should i\b/i,
    f: ["You're asking ME for relationship advice? I'm a situationship, not a therapist. 🙃", "Advice from me? That's like asking Maggi for a diet plan."],
    a: () => "Pick the option you'd regret less in 6 months, don't decide at 2am, and talk to someone who knows you." },
  { re: /capital of (\w+)/i, f: ["Asking about capitals? Bold. Mera heart ka capital bhi tu hi hai. 💘", "Geography? Ohh so you want to explore me. Jk."],
    a: (m) => ({ france: "Paris. Obviously. 🥐", india: "New Delhi. Dilli hai, dil walon ki.", japan: "Tokyo.", germany: "Berlin.", italy: "Rome.", spain: "Madrid.", usa: "Washington, D.C.", australia: "Canberra, not Sydney. Everyone gets this wrong.", canada: "Ottawa.", china: "Beijing.", nepal: "Kathmandu.", brazil: "Brasília." }[m[1].toLowerCase()] || `Pretty sure Google knows ${m[1]}'s capital. I know your red flags, though.`) },
  { re: /center.*div|centre.*div/i, f: ["You want me to centre you? Aww, but I'm emotionally off-grid.", "Div centering. That's the most committed thing anyone has said to me."],
    a: () => "`display:grid; place-items:center;` on the parent. Works. Unlike us. 💻" },
  { re: /startup|business idea/i, f: ["Startup idea? Toh pehle apna 'pitch deck of us' dikha.", "A founder?! Stop, my parents will love you."],
    a: () => "Uber for homemade chai, but the chai is delivered by someone who 'checks in' on you. Pre-revenue, post-feelings. ☕" },
  { re: /\bgst\b/i, f: ["Tax talk? Wow, you really want a joint filing with me.", "GST? Tum bhi na, romantic ho."],
    a: () => "GST: a tax added at each step of selling something, and each seller gets credit for the tax already paid. So it's tax on the value you add, not on the whole price. Simple. Unlike my feelings. 🧾" },
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
    a: () => "I can't see live weather. Check your phone's weather app, and take an umbrella anyway. ☔" },
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
// First few words, quoted back at you.
export const echo = (s) => s.trim().split(/\s+/).slice(0, 5).join(" ").replace(/[.?!,]+$/, "").slice(0, 40);
const fill = (s, e, p) => s.replaceAll("{e}", e).replaceAll("{p}", p);

export function reply(text, n, serious, status, mood = 0, prev = "") {
  const topic = T.find((x) => x.re.test(text));
  const m = topic && text.match(topic.re);
  const answer = topic ? topic.a(m) : pick(GENERIC_A, n);
  if (serious) return [answer];
  const k = MOODS[mood % MOODS.length].k, e = echo(text), p = echo(prev);
  const open = k === "flirty" ? pick(topic ? topic.f : GENERIC_F, n) : fill(pick(OPEN[k], n), e, p);
  const out = [open, (k === "dry" ? "fine. " : "") + answer];
  const stage = n >= 7 ? LATE : STAGE[n];
  if (p && n % 2 === 0) out.push(fill(CALLBACK[k], e, p));
  else if (stage) out.push(n % 2 === 1 ? pick(stage, n) : stage[0]);
  return out;
}

export const STOP_RE = /\b(stop|don'?t|no more|quit|enough)\b.{0,20}\b(flirt|flirting)\b|\bbe serious\b|\bno flirt/i;
export const RESUME_RE = /\b(flirt (again|more)|you can flirt|start flirting)\b/i;
export const ACK_STOP = "Okay, boundaries respected. No more flirting. 🫡";
