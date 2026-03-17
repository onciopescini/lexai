'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

// Define the event type
interface LiveEvent {
  id: string;
  created_at: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'SYNC';
  agent_name: string;
  message: string;
  metadata: Record<string, unknown>;
}

export default function DaemonDashboard() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch initial historical events (last 50)
    const fetchInitialEvents = async () => {
      const { data, error } = await supabase
        .from('picoclaw_live_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (data && !error) {
        // Reverse to show oldest first at the top, newest at the bottom
        setEvents(data.reverse() as LiveEvent[]);
      }
    };
    fetchInitialEvents();

    // 2. Subscribe to new Realtime events
    const channel = supabase
      .channel('picoclaw_live_events_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'picoclaw_live_events' },
        (payload) => {
          const newEvent = payload.new as LiveEvent;
          setEvents((prev) => [...prev, newEvent].slice(-100)); // Keep max 100 in memory
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, isOpen]);

  // Color mapping for professional log levels
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'SYNC': return 'text-purple-400';
      case 'SUCCESS': return 'text-emerald-400';
      case 'WARNING': return 'text-amber-400';
      case 'ERROR': return 'text-red-500 font-bold';
      default: return 'text-gray-300';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'WARNING': return 'bg-amber-500/10 border-amber-500/20';
      case 'ERROR': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-transparent border-transparent';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 border border-slate-700 shadow-xl hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 group"
        title="Server Diagnostics"
      >
        <div className={`w-3 h-3 rounded-full ${events.length > 0 && events[events.length-1]?.level === 'ERROR' ? 'bg-red-500 animate-pulse' : 'bg-blue-500/80 animate-pulse'}`} />
        {/* Radar/Pulse ring */}
        <div className={`absolute w-full h-full rounded-full border border-blue-500/30 animate-ping opacity-50`} />
      </button>

      {/* Dashboard Panel */}
      <div 
        className={`fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[60vh] z-40 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-500 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-medium text-slate-200 tracking-wider">Atena ORCHESTRATOR</h3>
          </div>
          <span className="text-[10px] uppercase font-mono text-slate-500 tracking-widest px-2 py-1 bg-slate-800 rounded">Live System</span>
        </div>

        {/* Log Viewer */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs custom-scrollbar">
          {events.length === 0 ? (
            <div className="text-slate-500 italic text-center mt-10">Connessione ai server di orchestrazione...</div>
          ) : (
            events.map((ev, i) => (
              <div 
                key={ev.id || i} 
                className={`p-2 rounded border border-transparent hover:bg-slate-900/50 transition-colors ${getLevelBg(ev.level)}`}
              >
                <div className="flex items-start justify-between opacity-60 mb-1">
                  <span className="text-slate-500">{new Date(ev.created_at).toLocaleTimeString('it-IT')}</span>
                  <span className="text-slate-400 capitalize bg-slate-800 px-1.5 rounded">{ev.agent_name}</span>
                </div>
                <div className="flex gap-2">
                  <span className={`font-semibold ${getLevelColor(ev.level)}`}>[{ev.level}]</span>
                  <span className="text-slate-300 leading-relaxed break-words">{ev.message}</span>
                </div>
                {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                  <div className="mt-2 pl-2 border-l border-slate-700">
                    <pre className="text-[10px] text-slate-500 break-all whitespace-pre-wrap">
                      {JSON.stringify(ev.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/30 flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest">
          <span>{events.length} Events Logged</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> SECURE COMMS</span>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(51, 65, 85, 0.8); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 1); 
        }
      `}</style>
    </>
  );
}
