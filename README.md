# BolMistri (बोल मिस्त्री)

Speak your problem in Hindi. See nearby workers on a map. Workers send their own price.
Customer and worker chat and call without seeing each other's phone number.
Live tracking of the worker with a time countdown. Star rules for customers.
No backend, no database, no login. 100% free tools.

## How to run

1. Install Node.js 20.19 or newer
2. `npm install`
3. `npm run dev`
4. Open http://localhost:5173 in Chrome (the mic works in Chrome and Edge)

## How to demo (two windows)

1. Window 1: open the app, speak or type a problem, tap **Request** on a worker.
2. Window 2: open the same link and add `#worker` at the end. Choose the same worker.
3. Worker sends a price. Customer chats, calls and accepts.
4. Worker taps **Start trip**. Both windows show the live tracking map.
5. After the worker arrives, the worker reports the result (paid, not paid, no-show, fake).
   The customer gets or loses star points.

Data is shared with localStorage, so both windows must be on the same device for now.
Tracking runs at demo speed (x20). See `src/utils/trip.js`.

## Star rules (src/utils/trust.js)

Start 100 points = 5.0 stars. Job done and paid +3. Cancel after booking -5.
Cancel when the worker is on the way -10. Not at the place -20. Fake request -30. Did not pay -40.
Below 50: Risky (workers see a warning). Below 30: Defaulter (cannot send requests).

## Folders

- `src/detectService.js` - finds the service from text (free keyword matching)
- `src/store.js` - requests, offers, chat, calls, trip, star points (replace with Supabase later)
- `src/utils/` - geo (distance), trip (live tracking), trust (star rules)
- `src/data/` - fake workers and service names
- `src/components/` - screens and cards

## Add later

- Live sync between phones: Supabase (free) inside `src/store.js`
- Real GPS from the worker's phone: `navigator.geolocation.watchPosition` + Supabase Realtime
- Real voice call: WebRTC (free) inside `CallScreen.jsx`
- Login with phone OTP, so a defaulter cannot make a new account
- Keys go in `.env` (see `.env.example`). Never put keys in code.
