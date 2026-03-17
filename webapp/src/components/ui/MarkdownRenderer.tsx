import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const markdownComponents: Components = {
    h1: ({...props}) => <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-6 mb-4 tracking-tight" {...props} />,
    h2: ({...props}) => (
      <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-8 mb-4 border-b border-slate-100 pb-2" {...props} />
    ),
    h3: ({...props}) => <h3 className="text-lg md:text-xl font-semibold text-slate-800 mt-6 mb-3" {...props} />,
    h4: ({...props}) => <h4 className="font-semibold text-slate-800 mt-4 mb-2 uppercase tracking-wider text-sm" {...props} />,
    p: ({...props}) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
    ul: ({...props}) => <ul className="list-none pl-1 mb-6 space-y-3" {...props} />,
    ol: ({...props}) => <ol className="list-decimal pl-6 mb-6 space-y-3 text-slate-700 marker:text-blue-600 marker:font-bold" {...props} />,
    li: ({...props}) => {
      // Check if it's likely a checked/unchecked list item from markdown checklists
      const isTodo = props.className?.includes('task-list-item');
      if (isTodo) {
         return <li className="flex items-center gap-2" {...props} />;
      }
      return (
        <li className="relative pl-6">
          {/* Custom animated bullet point */}
          <span className="absolute left-0 top-2 w-2 h-2 rounded-full bg-blue-500/80 ring-4 ring-blue-500/10"></span>
          <span className="text-slate-700">{props.children}</span>
        </li>
      );
    },
    a: ({...props}) => (
      <a 
        className="text-blue-600 hover:text-blue-700 underline decoration-blue-300/50 hover:decoration-blue-600 underline-offset-4 transition-all font-medium" 
        target="_blank" 
        rel="noopener noreferrer" 
        {...props} 
      />
    ),
    strong: ({...props}) => <strong className="font-bold text-slate-900" {...props} />,
    blockquote: ({...props}) => (
      <blockquote className="relative border-l-[4px] border-blue-500 bg-gradient-to-r from-blue-50/80 to-transparent p-5 rounded-r-2xl italic text-slate-700 my-6 shadow-[inset_1px_0_0_rgba(255,255,255,0.5)]" {...props}>
         {props.children}
      </blockquote>
    ),
    code: ({className, children, ...props}) => {
      const match = /language-(\w+)/.exec(className || '');
      // If there is a language match, it's typically a code block, otherwise consider it inline
      if (match) {
        return (
          <div className="rounded-2xl overflow-hidden my-6 border border-slate-200 shadow-sm shadow-slate-200/50 group">
            <div className="bg-slate-100/80 backdrop-blur-sm text-slate-500 text-xs px-4 py-2 border-b border-slate-200 flex items-center justify-between font-mono uppercase tracking-widest font-bold">
               <span>{match[1]}</span>
               <div className="flex gap-1.5 opacity-60">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
               </div>
            </div>
            <pre className="bg-slate-900 p-5 overflow-x-auto text-[13px] md:text-sm text-slate-50 font-mono leading-relaxed selection:bg-blue-500/30">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      }
      return (
        <code className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md text-[0.9em] font-mono border border-indigo-100/50 shadow-sm whitespace-nowrap" {...props}>
          {children}
        </code>
      );
    },
    table: ({...props}) => (
      <div className="overflow-x-auto my-8 rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-left border-collapse min-w-full" {...props} />
      </div>
    ),
    th: ({...props}) => <th className="bg-slate-50 p-4 font-bold text-slate-800 border-b border-slate-200 whitespace-nowrap text-sm uppercase tracking-wider" {...props} />,
    td: ({...props}) => <td className="p-4 border-b border-slate-100 text-slate-700 align-top" {...props} />,
    hr: ({...props}) => <hr className="my-8 border-slate-200" {...props} />
  };

  return (
    <div className={`prose prose-slate max-w-none w-full ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]} 
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
