import { useState } from 'react';
import type { Clip } from '../types/clip';
import { getAIProvider } from '../services/ai/providerFactory';

interface AskMemoryProps {
  clips: Clip[];
}

const SUGGESTIONS = [
  'What did I save about coding?',
  'Summarize my saved design clips.',
  'Show my recent business research.',
  'What banking or finance clips do I have?',
];

export function AskMemory({ clips }: AskMemoryProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;

    setLoading(true);
    setAnswer('');
    try {
      const ai = getAIProvider();
      const result = await ai.answerFromSavedClips(query, clips);
      setAnswer(result);
      if (q) setQuestion(q);
    } catch {
      setAnswer('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ask-memory cm-glass-card">
      <div className="ask-memory__header">
        <span className="ask-memory__icon">🧠</span>
        <div>
          <h3>Ask My Memory</h3>
          <p>Search and synthesize your saved web knowledge with AI</p>
        </div>
      </div>

      <div className="ask-memory__input-wrap">
        <input
          className="cm-input ask-memory__input"
          placeholder="What did I save about…?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        />
        <button
          className="cm-btn cm-btn--primary ask-memory__btn"
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
        >
          {loading ? <span className="cm-spinner" /> : 'Ask'}
        </button>
      </div>

      <div className="ask-memory__suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="ask-memory__chip" onClick={() => handleAsk(s)}>
            {s}
          </button>
        ))}
      </div>

      {answer && (
        <div className="ask-memory__answer">
          <pre>{answer}</pre>
        </div>
      )}

      {clips.length === 0 && (
        <p className="ask-memory__empty">Save some clips first to start asking questions about your memory.</p>
      )}
    </section>
  );
}
