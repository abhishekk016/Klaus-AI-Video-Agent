import React, { useEffect, useRef, useState } from "react";
import { sendChat } from "../api.js";

export default function ChatConsole({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, pending]);

  async function handleSend(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || pending) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setQuestion("");
    setPending(true);
    try {
      const { answer } = await sendChat(sessionId, q);
      setMessages((m) => [...m, { role: "bot", text: answer }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: `Couldn't get an answer: ${err.message}` }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="chat wrap" data-aos="fade-up">
      <div className="chat-panel">
        <div className="chat-header">
          <span className="eyebrow">Ask the recording</span>
          <span className="deck-hint">grounded in this transcript only</span>
        </div>

        <div className="chat-log" ref={logRef}>
          {messages.length === 0 && (
            <p className="chat-empty">
              Try: "What did we agree on?" or "Who owns the follow-up on pricing?"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.text}
            </div>
          ))}
          {pending && <div className="msg bot pending">listening to the tape…</div>}
        </div>

        <form className="chat-input" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Ask a question about this video…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={pending}
          />
          <button type="submit" className="btn btn-ghost" disabled={pending || !question.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  );
}
