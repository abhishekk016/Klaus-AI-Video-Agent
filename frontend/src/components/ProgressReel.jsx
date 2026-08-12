import React from "react";

const STEP_LABELS = {
  ingesting: "Ingest",
  transcribing: "Transcribe",
  titling: "Title",
  summarizing: "Summarize",
  extracting: "Extract",
  indexing: "Index",
};

const ORDER = ["ingesting", "transcribing", "summarizing", "extracting", "indexing"];

export default function ProgressReel({ stage }) {
  if (!stage || stage === "idle") return null;

  const collapsedStage = stage === "titling" ? "transcribing" : stage;
  const currentIndex = ORDER.indexOf(collapsedStage);

  return (
    <section className="reel wrap" data-aos="fade-up">
      <div className="reel-track">
        {ORDER.map((key, i) => {
          const isDone = stage === "done" || i < currentIndex;
          const isActive = i === currentIndex && stage !== "done" && stage !== "error";
          return (
            <div
              key={key}
              className={`reel-step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
            >
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span className="label">{STEP_LABELS[key]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
