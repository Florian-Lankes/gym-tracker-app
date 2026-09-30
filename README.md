# Lift Log

An offline-first, iPhone-first workout tracker. Build workouts in any order, save reusable exercise templates, add optional private workout and exercise notes, automatically record session duration, and review completed workout details and a simple weight-progress chart.

## Install on iPhone

Open https://florian-lankes.github.io/gym-tracker-app/ in Safari, tap Share, then tap **Add to Home Screen**. The installed app keeps workout data locally in this browser's IndexedDB.

Repository: https://github.com/Florian-Lankes/gym-tracker-app

## Run locally

Requires Node.js 18+.

    npm install
    npm run build
    npx serve dist

Open the local URL in a browser. The service worker is enabled for the production build; install from the browser's Share menu on iPhone where supported. Use the Settings icon in the Home header for local display and backup preferences. The optional backup reminder stays in the app, never sends notifications, and can be set to Off or every 5, 10 (default), or 20 completed workouts.

## Checks

    npm test
    npm run build

## Touch interaction

The viewport requests no page zoom (`maximum-scale=1,user-scalable=no`) and the app shell uses `touch-action: manipulation` to suppress accidental double-tap and pinch zoom where the installed browser/PWA honors standard viewport policy. Browser or OS accessibility settings may override this request; Lift Log does not use broad JavaScript gesture prevention, so native text entry, selection, scrolling, and controls remain available.

## Privacy

Lift Log has no accounts, backend, analytics, cloud sync, or sharing. Workout data is stored only in this browser's IndexedDB on this device. Clearing browser/site data removes it.

## Scope

Suggestions are optional text prompts based on the most recent saved set. They never automatically change a workout or prescribe a program.
