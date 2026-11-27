# SituationshipGPT 💘
*The only AI that gives you mixed signals instead of tokens.*

A deliberately awful (but fully working) chatbot: a dramatic Indian situationship in a UI that is part WhatsApp, part Tinder, part 2010 matrimonial site. React + Vite + CSS, one serverless function, no database, no login, no tracking. Chat state lives in the browser tab only.

## The bits
1. Send button dodges the cursor twice (hover, tap or Enter) before working
2. Send label cycles: Send / Don't text me / Beg to send / Your call
3. Typing indicator: Typing / Deleting / Consulting the group chat / Overthinking
4. Status: Strangers → Talking Stage → Situationship → Soft Launched → Married → In-laws → **Divorced** by message 6
5. Emotional damage meter rises on every message (and every dodge)
6. Some messages require picking a ridiculous compliment first
7. "New chat" is a dramatic **BREAK UP** button
8. After 5 messages: a Relationship Receipt (red flags, emotional ROI, commitment rate, verdict) you can download as a PNG
9. Clickable conversation starters answer instantly
- Say "stop flirting" and she does (until you say "flirt again" or break up). Every message gets a reply; intentional delays are 1.5-2.6s.

## Run
```
npm install
npm run dev        # http://localhost:5173
npm run build && npm test
```
Works with **no keys** (scripted, context-aware replies). For live Gemini replies, copy `.env.example` to `.env` and set `GEMINI_API_KEY`. The key is only read by `api/chat.js` on the server; if the call fails or takes >5s the scripted brain answers instead. Default model is `gemini-flash-lite-latest` (about 1s; the full flash model took 5s+). Override with `GEMINI_MODEL`.

## Deploy (Vercel)
```
npx vercel --prod
npx vercel env add GEMINI_API_KEY production   # optional
npx vercel --prod                              # redeploy so the key applies
```
Deploy from this folder (`situationshipgpt/`); Vercel detects Vite and serves `api/chat.js` as a function.

## Layout
`src/App.jsx` UI and mechanics · `src/brain.js` scripted Kiki · `api/chat.js` Gemini proxy · `test.mjs` smoke test
