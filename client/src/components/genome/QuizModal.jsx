import { useState, useEffect } from 'react';
import { genomeApi } from '../../lib/api';
import { Dna, ChevronRight } from 'lucide-react';
import BestWorstQuestion, { GLOW, GLOW_BRIGHT, GLOW_DIM, VIOLET_TEXT } from './BestWorstQuestion';

const HONE_ACCENT = '#94a3b8'; // slate-400 — honing mode accent

const glowBtnStyle = {
  borderColor: `${GLOW}44`,
  color: GLOW,
  boxShadow: `0 0 8px 1px ${GLOW}11`,
};
const glowBtnHover = (e) => { e.currentTarget.style.boxShadow = `0 0 14px 3px ${GLOW}22`; };
const glowBtnLeave = (e) => { e.currentTarget.style.boxShadow = `0 0 8px 1px ${GLOW}11`; };

export default function QuizModal({ profileId, onComplete, onClose }) {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizResponses, setQuizResponses] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizMode, setQuizMode] = useState(null); // null = loading
  const [quizAnsweredCount, setQuizAnsweredCount] = useState(0);
  const [quizTotalPool, setQuizTotalPool] = useState(18);

  useEffect(() => {
    startQuiz();
  }, []);

  const startQuiz = async () => {
    try {
      const result = await genomeApi.getQuizQuestions(profileId || null);
      if (result.mode === 'complete') {
        setQuizQuestions([]);
        setQuizMode('complete');
        setQuizAnsweredCount(result.answeredCount || 0);
        setQuizTotalPool(result.totalPool || 18);
        return;
      }
      setQuizQuestions(result.questions || []);
      setQuizMode(result.mode || 'standard');
      setQuizAnsweredCount(result.answeredCount || 0);
      setQuizTotalPool(result.totalPool || 18);
      setCurrentQuestion(0);
      setQuizResponses({});
    } catch (error) {
      console.error('Failed to load quiz:', error);
    }
  };

  const handleCardSelect = (questionId, selection) => {
    setQuizResponses({ ...quizResponses, [questionId]: selection });
  };

  const submitQuiz = async () => {
    setSubmittingQuiz(true);
    try {
      const responses = Object.entries(quizResponses).map(([questionId, sel]) => ({
        questionId,
        best: sel.best,
        worst: sel.worst,
      }));
      const result = await genomeApi.submitQuiz(responses, profileId || null);
      const genome = result.summary?.genome || null;
      if (onComplete) onComplete(genome);
      onClose();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (quizMode === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
        <div className="bg-dark-900 rounded-sm border p-8" style={{ borderColor: `${GLOW}22` }}>
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto" style={{ borderColor: GLOW_DIM, borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  // ── Complete state ─────────────────────────────────────────────────────────
  if (quizMode === 'complete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
        <div className="bg-dark-900 rounded-sm border p-8 max-w-lg w-full mx-4 text-center" style={{ borderColor: `${GLOW}22` }}>
          <Dna className="w-16 h-16 mx-auto mb-4" style={{ color: GLOW_DIM }} />
          <h2 className="text-xl font-semibold text-white mb-2 font-mono uppercase tracking-widest">Genome Fully Calibrated</h2>
          <p className="text-dark-400 max-w-md mx-auto mb-6">
            All questions answered. Your archetype distribution is as refined as it can get from the quiz alone.
            Keep using Folio and the content studio to evolve your genome further.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 border rounded-sm font-mono uppercase tracking-widest text-sm transition-all inline-flex items-center gap-2"
            style={glowBtnStyle}
            onMouseEnter={glowBtnHover}
            onMouseLeave={glowBtnLeave}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Active questions ───────────────────────────────────────────────────────
  if (quizQuestions.length > 0) {
    const question = quizQuestions[currentQuestion];
    const isLastQuestion = currentQuestion === quizQuestions.length - 1;
    const currentSel = quizResponses[question.id];
    const isLocked = currentSel?.best && currentSel?.worst;
    const allAnswered = quizQuestions.every(q => quizResponses[q.id]?.best && quizResponses[q.id]?.worst);
    const accentColor = quizMode === 'honing' ? HONE_ACCENT : GLOW;
    const totalProgress = quizAnsweredCount + currentQuestion + 1;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
        <div className="bg-dark-900 rounded-sm border p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ borderColor: `${GLOW}22` }}>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-xl font-bold text-white font-mono uppercase tracking-widest">
                  {quizMode === 'honing' ? 'Deep Honing' : 'Discover Your Archetype'}
                </h1>
                {quizMode === 'honing' && (
                  <p className="text-xs mt-1 font-mono uppercase tracking-widest" style={{ color: HONE_ACCENT }}>
                    Probing areas of uncertainty
                  </p>
                )}
              </div>
              <span className="text-sm text-dark-400 font-mono">
                {currentQuestion + 1}/{quizQuestions.length}
              </span>
            </div>
            <div className="h-1 bg-dark-700/60 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{ width: `${Math.min(100, (totalProgress / quizTotalPool) * 100)}%`, background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})` }}
              />
            </div>
            <p className="text-[11px] text-dark-500 font-mono mt-1 text-right">
              {quizAnsweredCount + Object.keys(quizResponses).filter(k => quizResponses[k]?.best && quizResponses[k]?.worst).length}/{quizTotalPool} total
            </p>
          </div>

          <BestWorstQuestion
            question={question}
            selection={quizResponses[question.id]}
            onSelect={handleCardSelect}
          />

          <div className="flex justify-between mt-6">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-dark-400 hover:text-white disabled:opacity-50 transition-colors font-mono uppercase tracking-widest text-sm"
            >
              Back
            </button>
            {isLastQuestion ? (
              <button
                onClick={submitQuiz}
                disabled={!allAnswered || submittingQuiz}
                className="px-6 py-2 border rounded-sm font-mono uppercase tracking-widest text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                style={glowBtnStyle}
                onMouseEnter={glowBtnHover}
                onMouseLeave={glowBtnLeave}
              >
                {submittingQuiz ? 'Analyzing...' : 'Reveal Archetype'}
                <Dna className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                disabled={!isLocked}
                className="px-6 py-2 border rounded-sm font-mono uppercase tracking-widest text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                style={glowBtnStyle}
                onMouseEnter={glowBtnHover}
                onMouseLeave={glowBtnLeave}
              >
                Lock & Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
