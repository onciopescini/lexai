import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface QueueTask {
  id: string;
  query_text: string;
  status: 'pending' | 'processing' | 'review_needed' | 'approved';
  created_at: string;
}

export default function AsyncQueueTracker() {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Initial fetch of pending/processing tasks for the current user session
    // For now, we assume 'default_user' as the session id
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('atena_agent_queue')
        .select('*')
        .eq('session_id', 'default_user')
        .in('status', ['pending', 'processing', 'review_needed'])
        .order('created_at', { ascending: false });

      if (data && !error) {
        setTasks(data as QueueTask[]);
      }
    };

    fetchTasks();

    // 2. Subscribe to realtime changes on the queue
    const channel = supabase.channel('queue_tracker')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'atena_agent_queue',
          filter: `session_id=eq.default_user`
        },
        (payload) => {
          // If a task is completed/approved, we might want to remove it from the tracker or show it as done briefly
          
          setTasks((currentTasks) => {
            const newTask = payload.new as QueueTask;
            const eventType = payload.eventType;
            
            if (eventType === 'INSERT') {
                return [newTask, ...currentTasks];
            } else if (eventType === 'UPDATE') {
                // Remove if it reached final state (approved/rejected), or keep and update status
                if (newTask.status === 'approved') {
                    return currentTasks.filter(t => t.id !== newTask.id); // Or let it linger for 3 seconds
                }
                return currentTasks.map(t => t.id === newTask.id ? newTask : t);
            } else if (eventType === 'DELETE') {
                const oldTask = payload.old as { id: string };
                return currentTasks.filter(t => t.id !== oldTask.id);
            }
            return currentTasks;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-32 right-6 z-50 animate-fade-in-up">
      {/* Tracker Bell / Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-4 rounded-full bg-slate-900 border border-slate-700 shadow-2xl hover:scale-105 transition-transform group flex items-center justify-center"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-slate-900 text-[9px] font-bold text-white items-center justify-center">
            {tasks.length}
          </span>
        </span>
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </button>

      {/* Tracker Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[85vw] sm:w-80 max-w-[calc(100vw-2rem)] bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Agentic Queue (Background)
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto p-3 flex flex-col gap-2">
            {tasks.map((task) => (
              <div key={task.id} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-blue-200 transition-colors">
                <p className="text-xs font-semibold text-slate-700 line-clamp-1 mb-2" title={task.query_text}>{`"${task.query_text}"`}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(task.created_at).toLocaleTimeString()}
                  </span>
                  
                  {/* Status Indicator */}
                  {task.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      In Coda
                    </span>
                  )}
                  {task.status === 'processing' && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                      <span className="flex gap-0.5 items-center justify-center">
                        <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce"></span>
                      </span>
                      Lavoro IA in corso...
                    </span>
                  )}
                  {task.status === 'review_needed' && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      Attesa Umana
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
