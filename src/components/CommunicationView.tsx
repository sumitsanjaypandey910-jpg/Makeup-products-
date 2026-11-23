import React, { useEffect, useState } from 'react';
import { Sparkles, Copy, Check, ShieldAlert, ExternalLink } from 'lucide-react';
import type { CommunicationLog, Customer, ParlourTenant } from '../types/beauty';
import { validateWhatsappDispatch } from '../utils/analytics';

interface CommunicationViewProps {
  parlour: ParlourTenant;
  customers: Customer[];
  communications: CommunicationLog[];
  preselectedCustomerId: string;
  onLogCommunication: (entry: CommunicationLog) => void;
}

type CampaignType = CommunicationLog['campaignType'];

export const CommunicationView: React.FC<CommunicationViewProps> = ({
  parlour,
  customers,
  communications,
  preselectedCustomerId,
  onLogCommunication,
}) => {
  const [customerId, setCustomerId] = useState(
    preselectedCustomerId || customers[0]?.id || ''
  );
  const [campaignType, setCampaignType] = useState<CampaignType>('Follow-up');
  const [contextNote, setContextNote] = useState('');
  const [messageText, setMessageText] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    if (preselectedCustomerId) {
      setCustomerId(preselectedCustomerId);
    }
  }, [preselectedCustomerId]);

  const activeCustomer = customers.find((c) => c.id === customerId) ?? null;

  const generateAiDraft = async () => {
    if (!activeCustomer) return;
    setDraftError('');
    setDrafting(true);
    try {
      const resp = await fetch('/api/ai/whatsapp-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: activeCustomer.fullName,
          campaignType,
          contextNote: contextNote || activeCustomer.preferences,
          parlourName: parlour.name,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setDraftError(data.error || 'Could not draft message.');
      } else {
        setMessageText(data.message || '');
      }
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Network error drafting message.');
    } finally {
      setDrafting(false);
    }
  };

  const applyTemplate = () => {
    if (!activeCustomer) return;
    const first = activeCustomer.fullName.split(' ')[0];
    const templates: Record<CampaignType, string> = {
      'Follow-up': `Hi ${first}, thank you for visiting ${parlour.name}. We hope your skin feels calm and refreshed! Reply anytime if you would like to schedule your 4-week follow-up scan.`,
      'Appointment Reminder': `Hello ${first}, a gentle reminder from ${parlour.name} regarding your upcoming appointment. Please let us know if you need any timing adjustments.`,
      Birthday: `Warm birthday wishes from all of us at ${parlour.name}, ${first}! Enjoy a complimentary botanical eye mask during your birthday month visit.`,
      Promotion: `Hi ${first}, ${parlour.name} is hosting our seasonal Radiance Renewal week. Reply STOP to opt out of promotional updates.`,
      Feedback: `Hi ${first}, we valued hosting you at ${parlour.name}! On a scale of 1 to 5, how was your experience with our specialist team?`,
    };
    setMessageText(templates[campaignType]);
  };

  const dispatchCheck = activeCustomer
    ? validateWhatsappDispatch(activeCustomer, messageText)
    : { allowed: false, reason: 'Select a customer first.' };

  const handleLogMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !dispatchCheck.allowed) return;
    onLogCommunication({
      id: `comm_${Date.now()}`,
      parlourId: parlour.id,
      customerId: activeCustomer.id,
      customerName: activeCustomer.fullName,
      phone: activeCustomer.phone,
      channel: 'WhatsApp',
      campaignType,
      message: messageText.trim(),
      consentVerified: true,
      sentAt: '2026-11-22 10:15',
      ...(campaignType === 'Feedback' && feedbackComment.trim()
        ? { feedbackRating, feedbackComment: feedbackComment.trim() }
        : {}),
    });
    setMessageText('');
    setFeedbackComment('');
  };

  const copyToClipboard = async () => {
    if (!messageText.trim()) return;
    await navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const sanitizedPhone = activeCustomer ? activeCustomer.phone.replace(/[^\d]/g, '') : '';
  const whatsappUrl =
    sanitizedPhone && messageText.trim()
      ? `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(messageText.trim())}`
      : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-[#1E1916]">
          Customer Communication &amp; WhatsApp Care
        </h1>
        <p className="text-sm text-[#6E645D] mt-1">
          Compose personalised follow-ups, appointment reminders, birthday notes, campaigns, and
          feedback requests with strict opt-in verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Composer */}
        <form
          onSubmit={handleLogMessage}
          className="lg:col-span-6 bg-white border border-[#E8E0D8] rounded-2xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="comm-client"
                className="block text-xs font-medium text-[#1E1916] mb-1"
              >
                Recipient Client
              </label>
              <select
                id="comm-client"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.whatsappConsent ? 'Opted In' : 'No Consent'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="comm-type"
                className="block text-xs font-medium text-[#1E1916] mb-1"
              >
                Message Category
              </label>
              <select
                id="comm-type"
                value={campaignType}
                onChange={(e) => setCampaignType(e.target.value as CampaignType)}
                className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
              >
                <option value="Follow-up">Follow-up Reminder</option>
                <option value="Appointment Reminder">Appointment Reminder</option>
                <option value="Birthday">Birthday Message</option>
                <option value="Promotion">Promotional Campaign</option>
                <option value="Feedback">Feedback Collection</option>
              </select>
            </div>
          </div>

          {activeCustomer && !activeCustomer.whatsappConsent && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Consent Blocked:</strong> {activeCustomer.fullName} has not opted in to
                WhatsApp communication. Dispatch is disabled until consent is recorded in their CRM
                profile.
              </p>
            </div>
          )}

          <div>
            <label
              htmlFor="comm-context"
              className="block text-xs font-medium text-[#1E1916] mb-1"
            >
              Personalisation Context (Optional)
            </label>
            <input
              id="comm-context"
              type="text"
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              placeholder="e.g. Mention ceramide barrier cream or upcoming bridal trial..."
              className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={generateAiDraft}
              disabled={drafting || !activeCustomer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4EFEA] text-xs font-medium text-[#1E1916] hover:bg-[#EAE1D8] disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B08B4F]" />
              {drafting ? 'Drafting...' : 'AI Draft Message'}
            </button>
            <button
              type="button"
              onClick={applyTemplate}
              className="px-3 py-1.5 rounded-lg border border-[#E8E0D8] text-xs font-medium text-[#1E1916] hover:bg-[#FAF8F6]"
            >
              Use Standard Template
            </button>
          </div>

          {draftError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              {draftError}
            </p>
          )}

          <div>
            <label
              htmlFor="comm-message"
              className="block text-xs font-medium text-[#1E1916] mb-1"
            >
              WhatsApp Message Preview
            </label>
            <textarea
              id="comm-message"
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write or generate a personalised message..."
              className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
            />
          </div>

          {campaignType === 'Feedback' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="fb-rating"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Client Rating (1-5)
                </label>
                <input
                  id="fb-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={feedbackRating}
                  onChange={(e) => setFeedbackRating(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="fb-comment"
                  className="block text-xs font-medium text-[#1E1916] mb-1"
                >
                  Recorded Feedback Note
                </label>
                <input
                  id="fb-comment"
                  type="text"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Optional client feedback..."
                  className="w-full px-3 py-2 text-sm border border-[#E8E0D8] rounded-lg bg-[#FAF8F6]"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!messageText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E0D8] text-xs font-medium text-[#1E1916] disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
              {dispatchCheck.allowed && whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8E0D8] text-xs font-medium text-[#1E1916] hover:bg-[#FAF8F6]"
                >
                  Open WhatsApp
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <button
              type="submit"
              disabled={!dispatchCheck.allowed}
              className="px-4 py-2 rounded-lg bg-[#B85C6F] text-white text-xs font-medium hover:bg-[#A34D5F] disabled:opacity-50 whitespace-nowrap"
            >
              Verify Consent &amp; Log Message
            </button>
          </div>
        </form>

        {/* Communication & Feedback History */}
        <div className="lg:col-span-6 bg-white border border-[#E8E0D8] rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-[#1E1916]">
            Recent Communication &amp; Feedback Log
          </h2>
          <div className="divide-y divide-[#EAE3DC]">
            {communications.map((log) => (
              <div key={log.id} className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1E1916]">
                    {log.customerName} · {log.campaignType}
                  </span>
                  <span className="font-mono text-[#6E645D]">{log.sentAt}</span>
                </div>
                <p className="text-xs text-[#6E645D] leading-relaxed">{log.message}</p>
                {log.feedbackComment && (
                  <p className="text-xs text-[#B08B4F] font-medium">
                    Client Feedback ({log.feedbackRating}/5 ★): &ldquo;{log.feedbackComment}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
