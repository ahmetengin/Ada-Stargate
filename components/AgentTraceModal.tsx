
import React from 'react';
import { X, Brain, Code, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { AgentTraceLog } from '../types';

interface AgentTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  traces: AgentTraceLog[];
}

export const AgentTraceModal: React.FC<AgentTraceModalProps> = ({ isOpen, onClose, traces }) => {
  if (!isOpen) return null;

  const getTraceStyle = (trace: AgentTraceLog) => {
    if (trace.isError) return 'bg-red-900/40 border-l-2 border-red-500';
    switch (trace.step) {
      case 'TOOL_CALL': return 'bg-blue-900/20 border-l-2 border-blue-500';
      case 'CODE_OUTPUT': return 'bg-zinc-800/50 border-l-2 border-zinc-600';
      case 'PLANNING': return 'border-l-2 border-transparent';
      case 'FINAL_ANSWER': return 'bg-green-900/20 border-l-2 border-green-500';
      default: return 'border-l-2 border-transparent';
    }
  };

  const getStepIcon = (trace: AgentTraceLog) => {
    if(trace.isError) return <AlertCircle size={12} className="text-red-400" />;
    switch (trace.step) {
        case 'PLANNING': return <Brain size={12} className="text-sky-400" />;
        case 'TOOL_CALL': return <Zap size={12} className="text-blue-400" />;
        case 'CODE_OUTPUT': return <Code size={12} className="text-green-300" />;
        case 'ANALYSIS': return <CheckCircle size={12} className="text-yellow-400" />;
        case 'FINAL_ANSWER': return <CheckCircle size={12} className="text-green-400" />;
        default: return <div className="w-3 h-3" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl h-[80vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-3 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2 text-indigo-400">
            <Brain size={16} />
            <h2 className="font-bold tracking-wider">Agent Trace Log</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800">
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {traces.length > 0 ? traces.map((trace) => (
            <div key={trace.id} className={`flex gap-3 p-2 rounded transition-colors ${getTraceStyle(trace)}`}>
              <div className="flex-shrink-0 w-20 opacity-60 text-zinc-500">{trace.timestamp}</div>
              <div className="flex-shrink-0 w-28 font-bold uppercase tracking-wider flex items-center gap-2">
                 {getStepIcon(trace)}
                 <span className={trace.persona === 'ORCHESTRATOR' ? 'text-indigo-400' : trace.persona === 'EXPERT' ? 'text-sky-400' : 'text-zinc-400'}>
                    {trace.persona}
                 </span>
              </div>
              <div className="flex-shrink-0 w-28 text-zinc-400">{trace.step}</div>
              <code className="break-words leading-relaxed whitespace-pre-wrap text-zinc-300 flex-1">
                {trace.content}
              </code>
            </div>
          )) : (
             <div className="flex items-center justify-center h-full text-zinc-600">
                <span>No agent traces for the last command.</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
