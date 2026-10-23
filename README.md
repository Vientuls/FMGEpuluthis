# FMGE Mock Test (v2)

Fast, installable, works offline. Questions load per set on demand, images are small WebP files, and the app is split into ES modules (no build step, no npm).

## 1. Put it online with GitHub Pages

This folder has ~1,900 files (one small image per picture question), which is **too many for the GitHub website's "Upload files"** button (100 files max). Use either:

**GitHub Desktop (easiest)**
1. Install GitHub Desktop, sign in, then *File > Add local repository* and pick this folder (accept "create a repository" if asked).
2. Click **Publish repository** (GitHub Pages on a free account needs a *public* repository).
3. On github.com open the repo > **Settings > Pages > Source: Deploy from a branch > main / (root) > Save**.
4. After about a minute: `https://YOUR-USERNAME.github.io/REPO-NAME/`

**Command line**
```
cd this-folder
git init && git add . && git commit -m "FMGE v2"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
git push -u origin main
```
then step 3 above.

Open the link on each phone/laptop. In Chrome/Edge use *Install app*, on iPhone use *Share > Add to Home Screen*. After the first visit it opens instantly and works offline.

## 2. Sync across devices (optional, free, ~5 minutes)

Without this, progress lives in each browser separately.

1. Create a free project at supabase.com.
2. *SQL Editor* > New query > paste `supabase/schema.sql` > Run.
3. *Authentication > Providers > Email*: leave enabled. For the simplest start, switch **off** "Confirm email" (otherwise a confirmation mail is needed once).
4. *Project Settings > API*: copy the **Project URL** and the **anon public** key into `config.js`.
5. Commit and push (or upload) the changed `config.js`.
6. In the app: ⚙︎ > **Sync** > create an account / sign in.

How it behaves
- Data is stored under your **user name inside the app** (e.g. "Priya"). Use the same name on your other device to get the same progress.
- Synced: XP/badges/streak, bookmarks, correct/incorrect marks, past attempts, last attempt, questions you added. A test in progress is not synced.
- If you study on two devices at once, numbers like XP take the larger value, history and badges are merged. Your own added questions use "newest save wins".
- The anon key is meant to be public; row-level security makes each account see only its own rows.

## 3. Flashcards

Every question in the bank (including the ones you add) works as a flashcard: question on the front, answer + explanation on the back.

- **Home > New module > Cards** builds a session from the subjects, sets and filter you picked (e.g. only *Incorrect* questions). "Cards per session" sets the size (default 20).
- **Home > Progress > 🗂 Flashcards** reviews everything that is due today, across all sets.
- Tap **Show answer**, then rate **Again / Good / Easy**. Again brings the card back in a few cards and tomorrow's schedule restarts; Good and Easy push it 1 / 3 / 7 / 14 / 30 days out. The small label on each button shows when you will see it next.
- Keys: Space flips (and rates Good once flipped), 1 / 2 / 3 rate, O shows the options on the front, B bookmarks, Z undoes.
- Card progress is stored with your profile, so it syncs and backs up like everything else. Reviews also keep your daily streak and give a little XP.

## 4. Question sets and the teacher's notes

The annotated sets (Anatomy, Biochemistry, Microbiology, PSM, ENT, OBG, Paediatrics, Ophthalmology ...) keep the teacher's handwritten pages as images: they show under the explanation after you answer and on the back of a flashcard. Answer fixes are listed in `CORRECTIONS.md`.

## 5. Changing things

| I want to… | Edit |
|---|---|
| Add/rename a theme or change colours | `js/themes.js` (one line per theme) |
| Change layout/looks | `css/app.css` |
| Change test behaviour | `js/views/test.js` |
| Change flashcards / review schedule | `js/views/cards.js`, `js/srs.js` (`GAP` = days per box) |
| Change scoring/XP/badges | `js/game.js` |
| Add questions | in the app (*Add questions*), or put a new JSON file in `data/sets/` and add it to `data/meta.json` |

After changing app files, open `sw.js` and bump `VERSION` (e.g. `v2`) so phones fetch the new files. Questions and images are cached separately and are not re-downloaded.

## Files
```
index.html  config.js  manifest.webmanifest  sw.js
css/app.css          js/ (main, ui, router, themes, store, data, game, sync, srs, views/*)
data/meta.json       data/sets/NN.json  (questions, one file per set)
img/q/*.webp         img/hero/*.webp    icons/*
supabase/schema.sql  tools/build_data.py (how the data was converted from the old single HTML)
```
