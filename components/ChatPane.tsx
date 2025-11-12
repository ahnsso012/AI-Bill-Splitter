
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, PersonTotals } from '../types';
import { PaperAirplaneIcon, UserGroupIcon } from './Icons';

interface ChatPaneProps {
  chatHistory: ChatMessage[];
  onSendCommand: (command: string) => void;
  personTotals: PersonTotals;
  isLoading: boolean;
  error: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const TypingIndicator = () => (
    <div className="flex items-center space-x-1 p-3">
        <span className="text-slate-500">AI is thinking</span>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
    </div>
);

export const ChatPane: React.FC<ChatPaneProps> = ({ chatHistory, onSendCommand, personTotals, isLoading, error }) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendCommand(input.trim());
      setInput('');
    }
  };
  
  const hasHistory = chatHistory.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Breakdown Section */}
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <UserGroupIcon className="h-6 w-6"/>
            Who Owes What
        </h3>
        <div className="space-y-2 text-sm">
          {Object.keys(personTotals).length > 0 ? (
            Object.entries(personTotals).map(([person, total]) => (
              <div key={person} className="flex justify-between items-center bg-white p-3 rounded-lg">
                <p className="font-medium text-slate-800">{person}</p>
                <p className="font-mono text-indigo-600 font-semibold">{formatCurrency(total)}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-center py-4">Assign items in the chat to see the breakdown.</p>
          )}
        </div>
      </div>

      {/* Chat Section */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
         {isLoading && <TypingIndicator />}
         {error && <div className="text-red-500 p-3 bg-red-100 rounded-lg">{error}</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      {hasHistory && (
        <div className="p-4 bg-white border-t border-slate-200">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., 'Sue and John shared the pizza'"
                className="w-full pl-4 pr-12 py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-400 transition-colors"
                disabled={isLoading || !input.trim()}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
