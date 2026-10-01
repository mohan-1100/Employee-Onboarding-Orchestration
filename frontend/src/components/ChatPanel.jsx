import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  User, 
  RefreshCw, 
  Trash2,
  Terminal,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import DiffApprovalCard from './DiffApprovalCard';

const QUICK_PROMPTS = [
  {
    role: 'HR',
    label: '➕ Onboard Rachel Green',
    text: 'Add recruit Rachel Green as Cloud Architect in Engineering starting in 3 days, work mode Remote'
  },
  {
    role: 'HR',
    label: '📋 Verify BGV (Alex Rivera)',
    text: 'Mark background verification as Verified for Alex Rivera'
  },
  {
    role: 'IT',
    label: '💻 Activate SSO & GitHub (Alex Rivera)',
    text: 'Activate SSO account and mark GitHub invited for Alex Rivera'
  },
  {
    role: 'Facilities',
    label: '📦 Ship Gear (Marcus Chen)',
    text: 'Assign MacBook Pro 16 and set shipping status to Shipped for Marcus Chen'
  },
  {
    role: 'IT',
    label: '⛔ Test Unauthorized (IT -> HR NDA)',
    text: 'Mark NDA signed for Elena Rostova'
  }
];

export default function ChatPanel({ 
  currentRole, 
  messages, 
  onSendMessage, 
  isLoading, 
  activeProposal, 
  onConfirmProposal, 
  onCancelProposal, 
  isConfirming,
  onClearChat
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeProposal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handlePromptClick = (text) => {
    if (isLoading) return;
    onSendMessage(text);
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[750px] shadow-2xl relative overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">CrewAI Governance Assistant</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-medium">
                HITL Governed
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Active Persona: <strong className="text-indigo-400">{currentRole}</strong>
            </p>
          </div>
        </div>

        {/* Clear chat button */}
        <button
          onClick={onClearChat}
          title="Clear message history"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Command Suggestions */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Quick Prompts:
          </span>
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(p.text)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-all hover:border-slate-700 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isStrictError = msg.is_error || msg.text === 'You do not have access to modify this data.';

          return (
            <div
              key={index}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              {/* Message Header Tag */}
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                {isUser ? (
                  <>
                    <span className="font-semibold text-indigo-400">{msg.role || currentRole}</span>
                    <User className="w-3 h-3 text-indigo-400" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold text-purple-300">CrewAI Agent</span>
                  </>
                )}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : isStrictError
                    ? 'bg-red-950/70 border border-red-500/50 text-red-200 rounded-tl-none ring-1 ring-red-500/30'
                    : 'bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Error Banner for Strict Unauthorized Edit Rejection */}
                {isStrictError && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/30 text-red-300 font-bold">
                    <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>Role Boundary Enforcement</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Staged Diff Proposal inside this message */}
                {msg.proposal && (
                  <DiffApprovalCard
                    proposal={msg.proposal}
                    onConfirm={onConfirmProposal}
                    onCancel={onCancelProposal}
                    isConfirming={isConfirming}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 text-xs text-slate-400 animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span>CrewAI Agent parsing natural language with role governance checks...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/90">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={`Type a command as ${currentRole} (e.g. "Add recruit Jordan Hayes as Frontend Dev in 2 days")...`}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Human-in-the-loop: No write occurs without manual approval.</span>
          <span className="font-mono">FastAPI • CrewAI</span>
        </div>
      </form>

    </div>
  );
}
