# BolMistri (बोल मिस्त्री)

Speak your problem in Hindi. See nearby workers on a map.
First skeleton: no backend, no database, no login. 100% free tools.

## How to run

1. Install Node.js 20.19 or newer
2. `npm install`
3. `npm run dev`
4. Open http://localhost:5173 in Chrome (the mic works in Chrome and Edge)

## Folders

- `src/detectService.js` - finds the service from text (free keyword matching)
- `src/data/` - fake workers and service names
- `src/utils/geo.js` - distance and arrival time
- `src/components/` - CustomerScreen, WorkerMap, WorkerCard

## Add later

- AI detection: a serverless function in `api/`, then call it from `detectService.js`
- Worker screen: `src/components/WorkerScreen.jsx`
- Supabase live offers: `src/lib/supabase.js`
- Keys go in `.env` (see `.env.example`). Never put keys in code.
