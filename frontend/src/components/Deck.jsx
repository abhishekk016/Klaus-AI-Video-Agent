import React, { useRef, useState } from "react";
import Waveform from "./Waveform.jsx";

export default function Deck({ onSubmit, busy, error, onUpload }) {
  const [source, setSource] = useState("");
  const [language, setLanguage] = useState("english");
  const [fileName, setFileName] = useState("");
  const fileInput = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      const path = await onUpload(file);
      setSource(path);
    } catch (err) {
      setFileName("");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!source.trim() || busy) return;
    onSubmit(source.trim(), language);
  }

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div data-aos="fade-up">
          <span className="eyebrow">Klaus knows it.</span>
          <h1>
            Feed it a recording.
            <br />
            Get the <em>transcript, the digest, and the receipts.</em>
          </h1>
          <p className="hero-sub">
            Drop a YouTube link or a local file. Klaus transcribes it,
            writes the summary, pulls out the action items and decisions —
            then sits ready to answer anything you ask about it.
          </p>

          <form className="deck" onSubmit={handleSubmit}>
            <div className="deck-row">
              <label className="slot">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M10 8l6 4-6 4V8z" />
                  <circle cx="12" cy="12" r="9.2" />
                </svg>
                <input
                  type="text"
                  placeholder="Paste a YouTube URL, or choose a file →"
                  value={fileName ? fileName : source}
                  onChange={(e) => {
                    setFileName("");
                    setSource(e.target.value);
                  }}
                  disabled={busy}
                />
              </label>
              <button type="submit" className="btn btn-brass" disabled={busy || !source.trim()}>
                {busy ? "Processing…" : "Ingest"}
              </button>
            </div>

            <div className="deck-options">
              <div className="lang-toggle" role="group" aria-label="Transcription language">
                {["english", "hinglish"].map((l) => (
                  <button
                    type="button"
                    key={l}
                    className={language === l ? "active" : ""}
                    onClick={() => setLanguage(l)}
                    disabled={busy}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <label className="file-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
                </svg>
                {fileName ? "change local file" : "or upload a local file"}
                <input
                  ref={fileInput}
                  type="file"
                  accept="video/*,audio/*"
                  onChange={handleFile}
                  disabled={busy}
                />
              </label>

              <span className="deck-hint">mp4 · mp3 · wav · m4a · youtube.com</span>
            </div>

            {error && <div className="error-banner">⚠ {error}</div>}
          </form>
        </div>

        <div data-aos="fade-up" data-aos-delay="120">
          <Waveform idle={!busy} label={busy ? "PROCESSING" : "IDLE"} counter={busy ? "REC ●" : "00:00"} />
        </div>
      </div>
    </section>
  );
}
