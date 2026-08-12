import React, { useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import Deck from "./components/Deck.jsx";
import ProgressReel from "./components/ProgressReel.jsx";
import ResultsTabs from "./components/ResultsTabs.jsx";
import ChatConsole from "./components/ChatConsole.jsx";
import { startProcess, getStatus } from "./api.js";

const UPLOAD_URL = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/upload`;

export default function App() {
  const [stage, setStage] = useState("idle");
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    AOS.init({ duration: 600, once: true, offset: 40 });
  }, []);

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  async function handleUpload(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.path;
  }

  async function handleSubmit(source, language) {
    setError(null);
    setResult(null);
    setStage("queued");
    try {
      const { job_id } = await startProcess(source, language);
      setJobId(job_id);
      pollRef.current = setInterval(async () => {
        try {
          const status = await getStatus(job_id);
          setStage(status.stage);
          if (status.stage === "done") {
            clearInterval(pollRef.current);
            setResult(status.result);
          }
          if (status.stage === "error") {
            clearInterval(pollRef.current);
            setError(status.error || "Something went wrong while processing.");
          }
        } catch (err) {
          clearInterval(pollRef.current);
          setError(err.message);
          setStage("error");
        }
      }, 1500);
    } catch (err) {
      setError(err.message);
      setStage("error");
    }
  }

  const busy = stage !== "idle" && stage !== "done" && stage !== "error";

  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <div className="brand">
            <svg className="brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 4V28"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />

              <path
                d="M10 16L25 5"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />

              <path
                d="M10 16L25 27"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </svg>
            <div>
              Klaus
              <small>Klaus knows it.</small>
            </div>
          </div>
          <a className="btn btn-ghost" href="#chat">
            Jump to chat
          </a>
        </div>
      </header>

      <main>
        <Deck onSubmit={handleSubmit} busy={busy} error={error && stage === "error" ? error : null} onUpload={handleUpload} />

        <ProgressReel stage={stage} />

        {result && <ResultsTabs result={result} />}

        {result && (
          <div id="chat">
            <ChatConsole sessionId={jobId} />
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <span>Klaus</span>
          <span>transcript stays local to this session</span>
        </div>
      </footer>
    </>
  );
}
