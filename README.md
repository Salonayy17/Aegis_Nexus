# AEGIS NEXUS — React + Flask prototype
"See the Cascade. Simulate the Impact. Stay Ready."  All data is SIMULATED demonstration data.

## Stack (as per pitch slide)
Frontend: React 18 + TypeScript, Vite, Tailwind CSS, React Flow, Recharts, Lucide React
Backend: Python + Flask, NetworkX, SQLite (portfolio state), LocalStorage (frontend demo state)
Engine: transparent risk formulas, dependency delay propagation, weighted ORS, rules-based mitigation comparison. No paid AI services.

## Run the frontend (works on its own)
    npm install
    npm run dev          # http://localhost:5173

## Run the backend (optional)
    cd backend && pip install -r requirements.txt && python app.py   # http://localhost:5000
With the backend running, `npm run dev` proxies /api to it and the top bar shows "Flask API connected".
Try: curl -X POST localhost:5000/api/simulate -H 'Content-Type: application/json' -d '{"project_id":"P1","days":45}'

## Honest status
- The UI currently computes everything in the browser using src/engine.ts, which mirrors backend/engine.py (same formulas). The UI only reads /api/health; wiring every page to the API is the next step.
- Backend serves REST endpoints (health, dashboard, projects CRUD, risks, dependencies, readiness, simulate, recommendations, reset) with validation and SQLite persistence.

## Models
Risk = min(5,P+delay/60) x Impact x min(1.5,1+0.1*downstream)/37.5 x 100 (Critical>=60, High>=40, Medium>=20, else Low).
Propagation: add(v)=max over parents(add(u) x strength) in topological order; cycles rejected.
ORS weights 20/15/15/15/15/20 (infra, equipment, personnel, training, dependency health, inverted risk).
Strategy score: 40% readiness gain, 20% delay recovery, 20% cost efficiency, 20% feasibility.
Recommendation score: 30% gain, 15% criticality, 15% urgency, 15% risk reduction, 10% cost, 15% feasibility.
Safety-critical decisions require authorized human approval. ORS/risk scores are prototype indicators, not validated standards.

## UI redesign (obsidian command centre)
- Design system in `src/ui.tsx` (Card, Kpi, Btn, Pill, Delta, Bar1); screens in `src/views.tsx`; shell, portfolio CRUD, domino trace and recommendations in `src/App.tsx`.
- Cascade Map (React Flow): minimap, zoom/pan/fit, filters, reset, selection dims unrelated links and highlights the downstream failure chain (amber) and upstream dependencies (cyan), details panel with direct vs propagated delay, editable edge strengths, "Simulate failure here".
- Risk workspace: search/filter/sort register + investigation drawer (score breakdown, direct vs propagated impact, affected dependencies, suggested mitigation, evidence).
- Simulation Studio: baseline vs do-nothing vs selected strategy, strategy small-multiples, plain-language "why recommended", per-project impact table, confirm-before-apply.
- Readiness: stacked ORS composition, points lost per factor, main driver per factor, actions.
- Toasts, confirm dialogs, collapsible sidebar, responsive layout. Calculation engine and backend are unchanged (TS and Python engines verified to agree: baseline ORS 79.91; 45-day scenario: do-nothing 64.34, A 67.51, B 69.56, C 64.52).
- Dataset remains the simulated fire & rescue portfolio; swap SEED/EDGES in `src/engine.ts` and `backend/engine.py` to model another project.

## Landing page
- `src/Landing.tsx` is the initial route (`#/`); "Enter Command Centre" opens the dashboard at `#/app`; the AEGIS NEXUS logo and "← Home" return to the landing page. Hash routing, no new dependency.
- **Add your hero photograph at `public/images/hero.jpg`** (see `public/images/README.txt`). No photo is bundled; until you add one the page shows a neutral charcoal fallback.
- Motion: one fade-in on load, link underline and button colour transitions, smooth scrolling; all disabled under `prefers-reduced-motion`.

## Command Centre refinement
Minimal layout: readiness hero + metric strip, history chart, "Risks needing attention" (incl. the simulated dependency alert, which opens the cascade trace), recommended actions; budget and activity history are in collapsible panels. Compact header: brand, project selector, search, notifications, subtle "Demo data" chip, reset. Palette: #0B0E13 / #131821 / #191F2A / #283241, amber #F5AD35, cyan #4CC9D8, green #4CCB91, red #F16B75.
Relocated (not removed): predicted cascade delay + featured scenario -> Simulation Studio; budget at risk -> Risk Intelligence summary and the Command Centre budget panel; cascade tracing -> Risk Domino, Simulation Studio and the dependency alert.

## Matte-black theme & final polish
Shared tokens (tailwind.config.js, src/ui.tsx, src/index.css): #0A0A0A background, #141414 panels, #191919 elevated, #292929 borders, text #F2F2F2 / #A1A1AA / #737373, amber #E8A332, cyan #56C4CF, green #55B987, red #E76570. The Risk Intelligence "Scoring model" panel was removed from the UI (the formula still drives all scores in src/engine.ts and backend/engine.py; per-risk score breakdown remains in the risk drawer). Landing page re-art-directed (matte overlay, numbered editorial sections); add public/images/hero.jpg.
