import React, { useState } from 'react';
import { Send, Globe, Sparkles, ExternalLink } from 'lucide-react';
import type { Customer, SkinScanRecord } from '../types/beauty';

interface AiAssistantViewProps {
  customers: Customer[];
  skinScans: SkinScanRecord[];
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: { uri: string; title: string }[];
}

const QUICK_PROMPTS = [
  'Explain this client’s latest skin observation in warm, simple language.',
  'Suggest a gentle AM/PM cosmetic skincare routine for sensitive cheeks.',
  'Recommend suitable salon treatment categories and a realistic follow-up interval.',
  'Draft a personalised post-facial customer-care summary.',
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ customers, skinScans }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id ?? '');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [messages, setMessages] = useState<ChatEntry[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am the BeautyOS AI Beauty Assistant. Select a client context on the left or ask any beauty, cosmetic skincare routine, or salon follow-up question. I never diagnose medical conditions or prescribe medication.',
    },
  ]);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;
  const latestScan = skinScans
    .filter((s) => s.customerId === selectedCustomerId)
    .sort((a, b) => b.scanDate.localeCompare(a.scanDate))[0];

  const sendPrompt = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean || loading) return;

    setErrorMsg('');
    const userMsg: ChatEntry = { id: `u_${Date.now()}`, role: 'user', text: clean };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const customerContext = activeCustomer
        ? `${activeCustomer.fullName} (Segment: ${activeCustomer.segment}, Preferences: ${activeCustomer.preferences || 'None listed'})`
        : '';
      const scanSummary = latestScan
        ? `Scan Date: ${latestScan.scanDate}. Appearance: ${latestScan.analysis.skinAppearanceType}. Summary: ${latestScan.summary}`
        : '';

      const resp = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: clean,
          customerContext,
          scanSummary,
          useSearchGrounding,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.error || 'Assistant request failed.');
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a_${Date.now()}`,
            role: 'assistant',
            text: data.reply || 'No response returned.',
            sources: Array.isArray(data.sources) ? data.sources : [],
          },
        ]);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error calling assistant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#1E1916]">
          AI Beauty Assistant
        </h1>
        <p className="text-sm text-[#6E645D] mt-1">
          Powered by Gemini with optional Google Search grounding for up-to-date cosmetic
          skincare education and salon consultation summaries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Context & Quick Prompts Sidebar */}
        <div className="lg:col-span-4 bg-white border border-[#E8E0D8] rounded-2xl p-5 space-y-4">
          <div>
            <label
              htmlFor="assistant-client"
              className="block text-xs font-medium text-[#1E1916] mb-1"
            >
              Active Client Context
            </label>
            <select
              id="assistant-client"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </div>

          {latestScan && (
            <div className="p-3 rounded-xl bg-[#FAF8F6] border border-[#E8E0D8] text-xs space-y-1">
              <p className="font-medium text-[#1E1916]">
                Latest Scan · {latestScan.scanDate}
              </p>
              <p className="text-[#6E645D] line-clamp-3">{latestScan.summary}</p>
            </div>
          )}

          <label className="flex items-center justify-between gap-2 text-xs text-[#1E1916] pt-1">
            <span className="inline-flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#B08B4F]" />
              Google Search Grounding
            </span>
            <input
              type="checkbox"
              checked={useSearchGrounding}
              onChange={(e) => setUseSearchGrounding(e.target.checked)}
              className="rounded border-[#E8E0D8]"
            />
          </label>

          <div className="border-t border-[#EAE3DC] pt-4 space-y-2">
            <p className="text-xs font-medium text-[#6E645D]">Quick Consultation Prompts</p>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendPrompt(q)}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#FAF8F6] border border-[#E8E0D8] text-xs text-[#1E1916] hover:bg-[#F4EFEA] transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Thread */}
        <div className="lg:col-span-8 bg-white border border-[#E8E0D8] rounded-2xl flex flex-col h-[560px]">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#B85C6F] text-white'
                      : 'bg-[#FAF8F6] border border-[#E8E0D8] text-[#1E1916]'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#B08B4F] mb-1">
                      <Sparkles className="w-3 h-3" />
                      BeautyOS Assistant
                    </div>
                  )}
                  <p>{m.text}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#E8E0D8] space-y-1">
                      <p className="text-[11px] font-medium text-[#6E645D]">
                        Grounded Web Sources:
                      </p>
                      {m.sources.slice(0, 4).map((src) => (
                        <a
                          key={src.uri}
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-[#B85C6F] hover:underline truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{src.title}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-[#6E645D] italic">
                Thinking through cosmetic care recommendations...
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="mx-5 mb-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt(input);
            }}
            className="p-4 border-t border-[#EAE3DC] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about skin routines, salon treatment intervals, or client care..."
              aria-label="Ask AI Beauty Assistant"
              className="flex-1 px-3.5 py-2.5 text-sm bg-[#FAF8F6] border border-[#E8E0D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B85C6F]/30"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#B85C6F] text-white text-sm font-medium hover:bg-[#A34D5F] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
