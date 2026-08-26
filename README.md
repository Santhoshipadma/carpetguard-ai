# CarpetGuard AI

CarpetGuard AI is a privacy-first camera app for **visual carpet screening**. It highlights photo regions that differ from the surrounding carpet, combines that signal with moisture and odor observations, and returns a practical follow-up priority.

It is intentionally honest: a phone photo cannot identify a mold species, detect invisible bacteria, measure toxicity, estimate the age of growth, or replace a qualified inspection.

## Why this project is different

- **Useful without overclaiming:** it supports documentation and follow-up decisions instead of pretending to diagnose a biological hazard.
- **On-device by default:** photos are processed in the browser and are not uploaded or stored.
- **Simple visual scoring:** every image becomes its own baseline. Small regions are compared by brightness and green color balance.
- **Human context matters:** dampness, musty odor, and water-event timing influence the follow-up score.
- **Actionable result:** the app explains what it saw, what it cannot know, and what the user can do next.

## How the screening works

1. Resize the photo in the browser to a safe working resolution.
2. Divide it into a responsive grid.
3. Measure the average brightness and green color balance in each cell.
4. Compare cells with the median feature profile of that photo.
5. Highlight visually unusual cells.
6. Combine the visual signal with the user's moisture observations.
7. Return a low, medium, or high follow-up priority.

The score is a **portfolio demonstration**, not a calibrated health-risk model.

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. Camera capture works best on a phone over HTTPS; desktop users can choose an existing image.

## Quality checks

```bash
npm run lint
npm test
```

## Technology

- Next.js + React + TypeScript
- Vinext / Vite deployment runtime
- Canvas API and ImageBitmap for local image analysis
- Responsive CSS with no UI framework

## Beginner-friendly code map

- `app/page.tsx` contains the screen, questions, score, and next actions.
- `lib/analyzeCarpet.ts` contains the photo comparison in small, named steps.
- `app/globals.css` contains the visual design.

Read `analyzeCarpetPhoto` from top to bottom: resize, divide, compare, highlight, return. The short comments explain *why* a step exists, so the project is easier to present in an interview.

## Responsible-use boundary

CarpetGuard AI can help document a visible patch and decide whether moisture follow-up is sensible. It does not provide medical advice, laboratory identification, remediation clearance, or a property inspection.

Official guidance:

- [EPA: A Brief Guide to Mold, Moisture and Your Home](https://www.epa.gov/mold/brief-guide-mold-moisture-and-your-home)
- [CDC: Mold](https://www.cdc.gov/mold-health/about/index.html)
- [CDC/NIOSH: Mold, Testing, and Remediation](https://www.cdc.gov/niosh/mold/testing-remediation/index.html)

## Portfolio talking points

- Explain why relative anomaly detection is more honest than fake species classification without a validated dataset.
- Walk through the privacy choice: image pixels never leave the browser.
- Discuss model limitations, false positives from shadows/patterns, and how a future labeled dataset could improve calibration.
- Propose a future professional mode with repeat-photo comparison, moisture-meter readings, and exportable inspection notes.

## License

MIT
