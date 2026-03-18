'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isComplete: boolean;
  statusUpdates: { type: string; text: string }[];
  attachment?: {
    name: string;
    type: string;
  };
}

export default function AtenaChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Salve, sono Atena, l\'Intelligenza Legale Autonoma. Come posso assisterla oggi?',
      isComplete: true,
      statusUpdates: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMessageId = useRef<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    // Genera o recupera il session ID (thread_id) per LangGraph Memory
    const storedSession = localStorage.getItem('atena_session_id');
    if (storedSession) {
      setSessionId(storedSession);
    } else {
      const newSession = 'atena_sess_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('atena_session_id', newSession);
      setSessionId(newSession);
    }
    scrollToBottom();
  }, [messages]);

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Il file è troppo grande. Massimo 5MB consentiti.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    const userQuery = input.trim();
    const currentFile = selectedFile;
    
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsLoading(true);

    const newUserId = Date.now().toString();
    const newAssistantId = (Date.now() + 1).toString();
    currentMessageId.current = newAssistantId;

    const userMessage: Message = { 
      id: newUserId, 
      role: 'user', 
      content: userQuery || "Analizza il documento allegato.", 
      isComplete: true, 
      statusUpdates: [] 
    };

    let base64File = null;
    if (currentFile) {
      userMessage.attachment = { name: currentFile.name, type: currentFile.type };
      try {
        base64File = await toBase64(currentFile);
      } catch (err) {
        console.error("Error converting file to Base64:", err);
      }
    }

    setMessages(prev => [
      ...prev,
      userMessage,
      { id: newAssistantId, role: 'assistant', content: '', isComplete: false, statusUpdates: [] }
    ]);

    try {
      const requestBody: { query: string; thread_id: string; file?: { filename: string; mime_type: string; data: string } } = { query: userQuery, thread_id: sessionId };
      if (currentFile && base64File) {
        requestBody.file = {
          filename: currentFile.name,
          mime_type: currentFile.type,
          data: base64File
        };
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: requestBody.query })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Errore di connessione' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      setMessages(prev => prev.map(m => {
        if (m.id === currentMessageId.current) {
          return { 
            ...m, 
            content: data.synthesizedAnswer || data.answer || 'Nessuna risposta ricevuta.',
            isComplete: true,
            statusUpdates: [
              ...(data.intent ? [{ type: 'status', text: `Intent: ${data.intent}` }] : []),
              ...(data.sources?.length ? [{ type: 'tool', text: `${data.sources.length} fonti trovate` }] : [])
            ]
          };
        }
        return m;
      }));
    } catch (error) {
      console.error("Error connecting to Atena API:", error);
      setMessages(prev => prev.map(m => 
        m.id === currentMessageId.current 
          ? { ...m, content: "**Errore di connessione:** Impossibile raggiungere l'API di Atena. Riprova tra qualche secondo.", isComplete: true } 
          : m
      ));
    } finally {
      setIsLoading(false);
      currentMessageId.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-200">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-[24px] bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
             </Link>
             <div className="flex flex-col">
               <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Atena</span>
               <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Oracolo Integrato</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-600 tracking-wide uppercase">Online</span>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col gap-6 scroll-smooth">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            {message.role === 'assistant' && (
               <div className="flex-shrink-0 mr-4 mt-1">
                 <div className="w-10 h-10 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
                   A
                 </div>
               </div>
            )}
            
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
              {/* User Bubble */}
              {message.role === 'user' && (
                <div className="flex flex-col items-end gap-2">
                  {message.attachment && (
                    <div className="bg-slate-800 text-slate-200 rounded-[24px] px-4 py-2 text-sm flex items-center gap-2 shadow-sm border border-slate-700/50">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                      <span className="font-medium truncate max-w-[200px]">{message.attachment.name}</span>
                    </div>
                  )}
                  {message.content && (
                    <div className="bg-slate-900 text-white rounded-[32px] rounded-tr-sm px-6 py-4 shadow-md text-[15px] leading-relaxed">
                      {message.content}
                    </div>
                  )}
                </div>
              )}

              {/* Assistant Bubble */}
              {message.role === 'assistant' && (
                <div className="flex flex-col gap-2">
                  
                  {/* Status Updates (Thinking Process) */}
                  {message.statusUpdates.length > 0 && (
                    <div className="flex flex-col gap-2 mb-2">
                        {message.statusUpdates.map((status, idx) => (
                           <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/60 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-full w-fit">
                             {status.type === 'tool' ? (
                               <svg className="w-3.5 h-3.5 text-blue-500 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                             ) : (
                               <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                             )}
                             {status.text}
                           </div>
                        ))}
                    </div>
                  )}

                  {/* Main Content */}
                  <div className="bg-white border border-slate-200/60 rounded-[32px] rounded-tl-sm px-6 py-5 shadow-sm">
                    {!message.isComplete && !message.content ? (
                      <div className="flex items-center gap-2 h-6">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    ) : (
                      <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50 prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-headings:text-slate-900 text-[15px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {typeof message.content === 'object' ? JSON.stringify(message.content, null, 2) : message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 sm:p-6 transition-all duration-300">
        <div className="max-w-4xl mx-auto">
          
          {/* File preview */}
          {selectedFile && (
            <div className="mb-3 flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-[24px] w-fit border border-blue-100/50 shadow-sm animate-fade-in-up">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
              <button 
                type="button" 
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="ml-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-200/50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-white rounded-[32px] sm:rounded-full border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all p-1.5 overflow-hidden">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.png,.jpg,.jpeg" 
              className="hidden" 
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Allega Documento o Immagine"
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 transition-colors self-end mb-1 ml-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Chiedi ad Atena o allega un documento..."
              className="w-full max-h-32 bg-transparent border-0 focus:ring-0 resize-none py-3 pl-2 pr-4 text-[15px] text-slate-800 placeholder:text-slate-400 leading-relaxed disabled:opacity-50"
              rows={1}
              disabled={isLoading}
              style={{ minHeight: '52px' }}
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 transition-colors shadow-sm self-end mb-0.5 mr-0.5"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              ) : (
                <svg className="w-5 h-5 translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              )}
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] font-medium text-slate-400">Atena può commettere errori. Verifica sempre le informazioni legali importanti.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

