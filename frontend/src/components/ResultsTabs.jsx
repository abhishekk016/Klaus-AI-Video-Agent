import React, { useState } from "react";

function List({ items, empty }) {
  const list = Array.isArray(items) ? items : String(items || "").split("\n").filter(Boolean);
  if (!list.length) return <p>{empty}</p>;
  return (
    <ul>
      {list.map((item, i) => (
        <li key={i}>{typeof item === "string" ? item.replace(/^[-•]\s*/, "") : JSON.stringify(item)}</li>
      ))}
    </ul>
  );
}

export default function ResultsTabs({ result }) {
  const [tab, setTab] = useState("summary");

  const tabs = [
    { key: "summary", label: "Summary" },
    { key: "action_items", label: "Action items" },
    { key: "key_decisions", label: "Key decisions" },
    { key: "open_questions", label: "Open questions" },
    { key: "transcript", label: "Full transcript" },
  ];

  return (
    <section className="results wrap" data-aos="fade-up">
      <div className="results-head">
        <h2 className="results-title">{result.title || "Untitled recording"}</h2>
      </div>

      <div className="tabbar" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? "active" : ""}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="cue-card">
          <h4>Summary</h4>
          <pre>{result.summary || "No summary was produced."}</pre>
        </div>
      )}

      {tab === "action_items" && (
        <div className="cue-card">
          <h4>Action items</h4>
          <List items={result.action_items} empty="No action items were found." />
        </div>
      )}

      {tab === "key_decisions" && (
        <div className="cue-card">
          <h4>Key decisions</h4>
          <List items={result.key_decisions} empty="No decisions were flagged." />
        </div>
      )}

      {tab === "open_questions" && (
        <div className="cue-card">
          <h4>Open questions</h4>
          <List items={result.open_questions} empty="No open questions were found." />
        </div>
      )}

      {tab === "transcript" && (
        <div className="cue-card transcript">
          <h4>Full transcript</h4>
          <pre>{result.transcript || "Transcript unavailable."}</pre>
        </div>
      )}
    </section>
  );
}
