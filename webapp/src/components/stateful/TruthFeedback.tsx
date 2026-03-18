import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TruthFeedbackProps {
  queryText: string;
  assistantResponse: string;
}

export default function TruthFeedback({ queryText, assistantResponse }: TruthFeedbackProps) {
  const [feedbackState, setFeedbackState] = useState<'none' | 'up' | 'down'>('none');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // We find or create a telemetry entry
  const recordFeedback = async (score: number, note?: string) => {
    setIsSubmitting(true);
    try {
      // In a real app we might pass the precise telemetry ID. 
      // For this demo, we'll UPSERT based on session_id (default_user) & query_text
      const { data: existingData } = await supabase
          .from('atena_truth_telemetry')
          .select('id')
          .eq('session_id', 'default_user')
          .eq('query_text', queryText)
          .single();

      if (existingData) {
          await supabase
            .from('atena_truth_telemetry')
            .update({ 
               user_feedback_score: score, 
               feedback_notes: note ? note : null 
            })
            .eq('id', existingData.id);
      } else {
          // Fallback if not tracked yet
          await supabase
            .from('atena_truth_telemetry')
            .insert({
                session_id: 'default_user',
                query_text: queryText,
                ai_response: assistantResponse,
                fact_check_confidence: 1.0, // dummy fallback
                user_feedback_score: score,
                feedback_notes: note ? note : null
            });
      }
    } catch (e) {
      console.error("Error saving feedback:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsUp = async () => {
    if (feedbackState === 'up') return;
    setFeedbackState('up');
    setShowNoteInput(false);
    await recordFeedback(1);
  };

  const handleThumbsDown = () => {
    if (feedbackState === 'down') return;
    setFeedbackState('down');
    setShowNoteInput(true);
    // Don't record immediately for down, give them a chance to type the note
  };

  const handleSubmitDown = async () => {
    await recordFeedback(-1, noteText);
    setShowNoteInput(false);
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-400">Verità e Precisione:</span>
        <div className="flex items-center gap-2">
          {/* Thumbs Up */}
          <button
            onClick={handleThumbsUp}
            disabled={isSubmitting}
            className={`p-2 rounded-[20px] flex items-center gap-1.5 transition-all
              ${feedbackState === 'up' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' 
                  : 'bg-white text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 border border-transparent'}
            `}
            title="Risposta corretta e utile"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11V19m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>

          {/* Thumbs Down */}
          <button
            onClick={handleThumbsDown}
            disabled={isSubmitting}
            className={`p-2 rounded-[20px] flex items-center gap-1.5 transition-all
              ${feedbackState === 'down' 
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm' 
                  : 'bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-transparent'}
            `}
            title="Risposta imprecisa o errata"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.714.211-1.412.608-2.006L17 13V5m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
          </button>
        </div>
      </div>

      {showNoteInput && (
        <div className="flex items-center gap-2 animate-fade-in-up mt-1">
          <input 
            type="text" 
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Quale legge ho sbagliato? Aiutami a migliorare..." 
            className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-[20px] focus:outline-none focus:ring-1 focus:ring-rose-300 text-slate-700"
          />
          <button 
            onClick={handleSubmitDown}
            disabled={!noteText.trim() || isSubmitting}
            className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-[24px] hover:bg-rose-600 shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Invia
          </button>
        </div>
      )}
    </div>
  );
}

