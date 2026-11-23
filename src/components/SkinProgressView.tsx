import React, { useState } from 'react';
import { SlidersHorizontal, AlertCircle, History } from 'lucide-react';
import type { Customer, SkinScanRecord } from '../types/beauty';

interface SkinProgressViewProps {
  customers: Customer[];
  skinScans: SkinScanRecord[];
}

export const SkinProgressView: React.FC<SkinProgressViewProps> = ({ customers, skinScans }) => {
  const defaultCustomerId =
    customers.find((c) => skinScans.some((s) => s.customerId === c.id))?.id ??
    customers[0]?.id ??
    '';
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(defaultCustomerId);
  const [splitPercent, setSplitPercent] = useState(50);

  React.useEffect(() => {
    if (!customers.some((c) => c.id === selectedCustomerId)) {
      const next =
        customers.find((c) => skinScans.some((s) => s.customerId === c.id))?.id ??
        customers[0]?.id ??
        '';
      setSelectedCustomerId(next);
    }
  }, [customers, skinScans, selectedCustomerId]);

  const clientScans = skinScans
    .filter((s) => s.customerId === selectedCustomerId)
    .sort((a, b) => a.scanDate.localeCompare(b.scanDate));

  const baselineScan = clientScans[0] ?? null;
  const latestScan = clientScans[clientScans.length - 1] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0D9488] text-white flex items-center justify-center shadow-sm shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Skin Progress Tracker
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Compare baseline and follow-up visits side by side with documented treatments and
              lighting conditions.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label
            htmlFor="progress-client"
            className="block text-xs font-semibold text-[#6B7280] mb-1"
          >
            Select Client Timeline
          </label>
          <select
            id="progress-client"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-white"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lighting & Comparison Caveat */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-[#111827]">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Visual Comparison Integrity:</strong> Photographic appearance varies with ambient
          lighting, camera distance, and skin hydration immediately prior to capture. Always review
          lighting notes alongside aesthetician observations rather than drawing conclusions from
          images alone.
        </p>
      </div>

      {clientScans.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <p className="font-display text-xl font-bold text-[#111827]">
            No Skin Scans Recorded Yet
          </p>
          <p className="text-sm text-[#6B7280] mt-2">
            Run a facial observation in the AI Face Scanner and save it to start this client&apos;s
            progress timeline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Before / After Comparison Slider */}
          <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-[#111827]">
                Before &amp; After Comparison
              </h2>
              <span className="text-xs font-mono text-[#6B7280]">{clientScans.length} visits</span>
            </div>

            {baselineScan && latestScan && (
              <>
                <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-[#E5E7EB] select-none">
                  <img
                    src={latestScan.photoDataUrl}
                    alt={`Follow-up visit on ${latestScan.scanDate}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                  >
                    <img
                      src={baselineScan.photoDataUrl}
                      alt={`Initial visit on ${baselineScan.scanDate}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                    style={{ left: `${splitPercent}%` }}
                  />
                  <div className="absolute bottom-3 left-3 bg-black/65 text-white text-[11px] font-mono px-2 py-1 rounded-lg">
                    Initial · {baselineScan.scanDate}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/65 text-white text-[11px] font-mono px-2 py-1 rounded-lg">
                    Latest · {latestScan.scanDate}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="compare-slider"
                    className="flex items-center justify-between text-xs text-[#6B7280] mb-1.5"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Comparison Divider
                    </span>
                    <span className="font-mono tabular-nums">{splitPercent}%</span>
                  </label>
                  <input
                    id="compare-slider"
                    type="range"
                    min={5}
                    max={95}
                    value={splitPercent}
                    onChange={(e) => setSplitPercent(Number(e.target.value))}
                    className="w-full accent-[#D91A6B]"
                  />
                </div>

                <div className="text-xs text-[#6B7280] border-t border-[#F1F5F9] pt-3 space-y-1">
                  <p>
                    <strong className="text-[#111827]">Initial Lighting:</strong>{' '}
                    {baselineScan.lightingCondition}
                  </p>
                  <p>
                    <strong className="text-[#111827]">Latest Lighting:</strong>{' '}
                    {latestScan.lightingCondition}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Historical Visit Timeline */}
          <div className="lg:col-span-7 space-y-4">
            {clientScans
              .slice()
              .reverse()
              .map((scan, idx) => (
                <div
                  key={scan.id}
                  className="bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-3 shadow-[0_4px_18px_rgba(15,23,42,0.03)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
                    <div>
                      <span className="text-xs font-mono font-semibold text-[#D91A6B]">
                        Visit #{clientScans.length - idx} · {scan.scanDate}
                      </span>
                      <h3 className="font-display text-lg font-bold text-[#111827]">
                        {scan.analysis.skinAppearanceType}
                      </h3>
                    </div>
                    <span className="text-xs text-[#6B7280]">
                      Suggested Follow-up: {scan.suggestedFollowUpDate}
                    </span>
                  </div>

                  <p className="text-sm text-[#111827] leading-relaxed">{scan.summary}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-[#6B7280] block font-semibold">
                        Treatments Received
                      </span>
                      <span className="text-[#111827]">{scan.treatmentsReceived}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block font-semibold">Products Used</span>
                      <span className="text-[#111827]">{scan.productsUsed}</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block font-semibold">
                        Staff Observations
                      </span>
                      <span className="text-[#111827]">{scan.staffObservations}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
