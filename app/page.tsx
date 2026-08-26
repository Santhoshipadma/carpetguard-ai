"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { analyzeCarpetPhoto, type ScanResult } from "@/lib/analyzeCarpet";

type Choice = "no" | "unsure" | "yes";
type Odor = "none" | "faint" | "strong";
type WaterEvent = "none" | "recent" | "older";

type Priority = {
  score: number;
  label: string;
  tone: "low" | "medium" | "high";
  summary: string;
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

function Selector<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <fieldset className="selector">
      <legend>{label}</legend>
      <div className="segmented">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={value === option.value ? "active" : ""}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [damp, setDamp] = useState<Choice>("unsure");
  const [odor, setOdor] = useState<Odor>("none");
  const [waterEvent, setWaterEvent] = useState<WaterEvent>("none");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const priority = useMemo<Priority | null>(() => {
    if (!result) return null;
    const dampPoints = damp === "yes" ? 25 : damp === "unsure" ? 9 : 0;
    const odorPoints = odor === "strong" ? 24 : odor === "faint" ? 10 : 0;
    const waterPoints = waterEvent === "older" ? 22 : waterEvent === "recent" ? 14 : 0;
    const score = Math.round(clamp(result.visualScore * 0.45 + dampPoints + odorPoints + waterPoints));

    if (score >= 64) {
      return {
        score,
        label: "High follow-up priority",
        tone: "high",
        summary: "The visible pattern plus your observations justify prompt moisture investigation.",
      };
    }
    if (score >= 34) {
      return {
        score,
        label: "Check this area soon",
        tone: "medium",
        summary: "There are enough signals to document, dry, and monitor this carpet carefully.",
      };
    }
    return {
      score,
      label: "Lower concern from this screen",
      tone: "low",
      summary: "No strong combined signal appeared, but a photo cannot rule out hidden moisture or growth.",
    };
  }, [result, damp, odor, waterEvent]);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Please use a photo smaller than 15 MB.");
      return;
    }

    setScanning(true);
    setError("");
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);

    try {
      const nextResult = await analyzeCarpetPhoto(file);
      setResult(nextResult);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "The photo could not be scanned.");
    } finally {
      setScanning(false);
    }
  }

  const actions = useMemo(() => {
    const next = ["Photograph the full area and a close-up in neutral light."];
    if (damp !== "no" || waterEvent !== "none") {
      next.push("Find and stop the moisture source; dry wet material quickly.");
    }
    if (priority?.tone === "high") {
      next.push("Avoid disturbing the patch and contact the property manager or a qualified inspector.");
    } else {
      next.push("Recheck after 24 hours and note whether the patch, dampness, or odor changes.");
    }
    next.push("Seek medical advice for breathing trouble or concerning symptoms.");
    return next;
  }, [damp, waterEvent, priority]);

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="CarpetGuard AI home">
          <span className="brand-mark">CG</span>
          <span>CarpetGuard <b>AI</b></span>
        </a>
        <div className="nav-links">
          <a href="#scanner">Scanner</a>
          <a href="#science">Safety</a>
        </div>
        <span className="privacy-pill"><i /> On-device photo analysis</span>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>01</span> VISUAL CARPET SCREENING</div>
        <h1>See the patch.<br /><em>Know the next step.</em></h1>
        <p className="hero-copy">
          A privacy-first tool that marks unusual visual regions in a carpet photo, then combines them
          with moisture and odor clues to suggest a sensible follow-up priority.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#scanner">Start a private scan <span>↘</span></a>
          <a className="button ghost" href="#science">Understand the limits</a>
        </div>
        <div className="boundary-strip">
          <span className="signal-dot" />
          <p><strong>Honest by design:</strong> this tool screens visual anomalies. It cannot identify mold species,
            bacteria, toxicity, or how long a patch has been present.</p>
        </div>
      </section>

      <section className="scanner-section shell" id="scanner">
        <div className="section-heading">
          <div><span className="step">STEP 01</span><h2>Scan the carpet</h2></div>
          <p>Use the rear camera or choose a clear photo. The image stays in this browser tab.</p>
        </div>

        <div className="scanner-grid">
          <div className="capture-panel panel">
            <div className={`photo-stage ${preview ? "has-photo" : ""}`}>
              {preview ? (
                // The analyzed image is a local data URL, so Next image optimization cannot apply.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result?.annotatedImage || preview} alt={result ? "Carpet photo with highlighted visual anomalies" : "Carpet ready to scan"} />
              ) : (
                <div className="empty-state">
                  <div className="viewfinder" aria-hidden="true"><span /><span /><span /><span /></div>
                  <p className="mono">CAMERA READY</p>
                  <h3>Frame one carpet area</h3>
                  <small>Avoid deep shadows, flash glare, and patterned rugs when possible.</small>
                </div>
              )}
              {scanning && <div className="scan-line"><span>ANALYZING PIXEL REGIONS</span></div>}
            </div>

            <label className="upload-button">
              <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
              <span className="camera-icon">◎</span>
              {fileName ? "Take or choose another photo" : "Open camera or choose photo"}
            </label>
            {fileName && <p className="file-name">Current image: {fileName}</p>}
            {error && <p className="error" role="alert">{error}</p>}
          </div>

          <div className="observations panel">
            <div className="panel-label"><span>02</span> ADD CONTEXT</div>
            <h3>What do you notice?</h3>
            <p className="muted">These clues matter more than color alone.</p>
            <Selector<Choice>
              label="Does the carpet feel damp?"
              value={damp}
              onChange={setDamp}
              options={[{ value: "no", label: "No" }, { value: "unsure", label: "Unsure" }, { value: "yes", label: "Yes" }]}
            />
            <Selector<Odor>
              label="Is there a musty odor?"
              value={odor}
              onChange={setOdor}
              options={[{ value: "none", label: "None" }, { value: "faint", label: "Faint" }, { value: "strong", label: "Strong" }]}
            />
            <Selector<WaterEvent>
              label="Any leak or water event?"
              value={waterEvent}
              onChange={setWaterEvent}
              options={[{ value: "none", label: "None" }, { value: "recent", label: "Past 48h" }, { value: "older", label: "Earlier" }]}
            />
            <div className="privacy-note"><span>⌁</span><p><strong>Your photo is not uploaded.</strong><br />Analysis happens locally in your browser.</p></div>
          </div>
        </div>
      </section>

      {result && priority && (
        <section className="results shell" aria-live="polite">
          <div className="section-heading result-heading">
            <div><span className="step">YOUR SCREEN</span><h2>Practical, not diagnostic</h2></div>
            <p>Highlighted cells are visually different from the rest of this specific photo—not confirmed mold.</p>
          </div>
          <div className="result-grid">
            <article className={`priority-card ${priority.tone}`}>
              <div className="score-ring" style={{ "--score": `${priority.score * 3.6}deg` } as React.CSSProperties}>
                <span><b>{priority.score}</b>/100</span>
              </div>
              <div>
                <span className="result-kicker">FOLLOW-UP SCORE</span>
                <h3>{priority.label}</h3>
                <p>{priority.summary}</p>
              </div>
            </article>
            <article className="metric-card">
              <span className="result-kicker">VISUAL DIFFERENCE</span>
              <strong>{result.flaggedPercent}%</strong>
              <p>{result.flaggedTiles} of {result.totalTiles} image regions crossed the visual threshold.</p>
            </article>
            <article className="action-card">
              <span className="result-kicker">NEXT ACTIONS</span>
              <ol>{actions.map((action) => <li key={action}>{action}</li>)}</ol>
            </article>
          </div>
        </section>
      )}

      <section className="science shell" id="science">
        <div className="section-heading">
          <div><span className="step">SAFETY BOUNDARY</span><h2>What a phone can—and cannot—tell you</h2></div>
          <p>Carpet appearance is one clue. Moisture history, smell, inspection, and professional judgment complete the picture.</p>
        </div>
        <div className="truth-grid">
          <article className="truth-card can">
            <span>CAN HELP</span>
            <h3>Document visible change</h3>
            <ul><li>Mark unusual color and texture regions</li><li>Create a consistent photo record</li><li>Combine visible and moisture clues</li><li>Suggest a follow-up priority</li></ul>
          </article>
          <article className="truth-card cannot">
            <span>CANNOT CLAIM</span>
            <h3>Identify a biological hazard</h3>
            <ul><li>Name a mold species from a photo</li><li>Detect invisible bacteria or spores</li><li>Measure toxicity or health danger</li><li>Estimate how many years it has grown</li></ul>
          </article>
        </div>
        <div className="guidance">
          <div><span className="guidance-number">24–48h</span><p>Dry wet materials quickly and address the moisture source.</p></div>
          <div><span className="guidance-number">NO COLOR TEST</span><p>Mold color alone does not establish its type or risk.</p></div>
          <div><span className="guidance-number">ACT ON MOISTURE</span><p>Visible growth or persistent dampness deserves action regardless of species.</p></div>
        </div>
        <div className="source-row">
          <span>Trusted guidance</span>
          <a href="https://www.epa.gov/mold/brief-guide-mold-moisture-and-your-home" target="_blank" rel="noreferrer">EPA mold & moisture guide ↗</a>
          <a href="https://www.cdc.gov/mold-health/about/index.html" target="_blank" rel="noreferrer">CDC mold basics ↗</a>
          <a href="https://www.cdc.gov/niosh/mold/testing-remediation/index.html" target="_blank" rel="noreferrer">CDC testing guidance ↗</a>
        </div>
      </section>

      <footer className="shell">
        <div className="brand"><span className="brand-mark">CG</span><span>CarpetGuard <b>AI</b></span></div>
        <p>Built as a responsible AI/ML portfolio project. Screening only—not a medical, laboratory, or property inspection service.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
