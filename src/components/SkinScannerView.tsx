import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Save,
  AlertTriangle,
  CheckCircle2,
  Square,
  ScanFace,
} from 'lucide-react';
import type {
  Customer,
  ParlourTenant,
  ServiceItem,
  SkinAnalysisResult,
  SkinScanRecord,
} from '../types/beauty';
import { GENERATED_ASSETS } from '../data/seedData';

interface SkinScannerViewProps {
  parlour: ParlourTenant;
  customers: Customer[];
  services: ServiceItem[];
  preselectedCustomerId: string;
  onSaveSkinScan: (record: SkinScanRecord) => void;
}

export const SkinScannerView: React.FC<SkinScannerViewProps> = ({
  parlour,
  customers,
  services,
  preselectedCustomerId,
  onSaveSkinScan,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    preselectedCustomerId || customers[0]?.id || ''
  );
  const [lightingNote, setLightingNote] = useState('Studio Window · Diffused');
  const [capturedDataUrl, setCapturedDataUrl] = useState<string>(GENERATED_ASSETS.faceInitial);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<SkinAnalysisResult | null>(null);
  const [activeZone, setActiveZone] = useState<string>('Left Cheek');
  const [treatmentsReceived, setTreatmentsReceived] = useState('');
  const [productsUsed, setProductsUsed] = useState('');
  const [staffObservations, setStaffObservations] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (preselectedCustomerId && customers.some((c) => c.id === preselectedCustomerId)) {
      setSelectedCustomerId(preselectedCustomerId);
    } else if (!customers.some((c) => c.id === selectedCustomerId)) {
      setSelectedCustomerId(customers[0]?.id ?? '');
    }
  }, [preselectedCustomerId, customers, selectedCustomerId]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API is unavailable in this browser. Please upload a photo instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? `Camera access unavailable: ${err.message}. Use photo upload or studio sample instead.`
          : 'Camera permission denied. Use photo upload instead.'
      );
    }
  };

  const capturePhotoFromVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedDataUrl(dataUrl);
    setAnalysisResult(null);
    setSavedNotice('');
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCapturedDataUrl(reader.result);
        setAnalysisResult(null);
        setSavedNotice('');
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const loadImageAsBase64 = async (src: string): Promise<{ base64: string; mimeType: string }> => {
    if (src.startsWith('data:')) {
      const [header, body] = src.split(',');
      const mimeMatch = header.match(/data:(.*?);/);
      return { base64: body, mimeType: mimeMatch?.[1] || 'image/jpeg' };
    }
    const resp = await fetch(src);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = String(reader.result || '');
        const [header, body] = res.split(',');
        const mimeMatch = header.match(/data:(.*?);/);
        resolve({ base64: body || '', mimeType: mimeMatch?.[1] || 'image/jpeg' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const runSkinAnalysis = async () => {
    setAnalysisError('');
    setSavedNotice('');
    setAnalyzing(true);
    try {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      const { base64, mimeType } = await loadImageAsBase64(capturedDataUrl);
      const categories = Array.from(new Set(services.map((s) => s.category)));

      const response = await fetch('/api/ai/skin-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          customerName: customer?.fullName ?? '',
          lightingNote,
          availableCategories: categories,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAnalysisError(data.error || 'Unable to analyze photograph.');
      } else {
        setAnalysisResult(data.analysis);
        if (data.analysis?.zones?.[0]?.zone) {
          setActiveZone(data.analysis.zones[0].zone);
        }
      }
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : 'Network error running facial analysis.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveReport = () => {
    if (!analysisResult || !selectedCustomerId) return;
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    const today = new Date('2026-11-22T10:00:00');
    const followUp = new Date(today);
    followUp.setDate(today.getDate() + (analysisResult.suggestedFollowUpDays || 28));
    const followUpIso = followUp.toISOString().slice(0, 10);

    const record: SkinScanRecord = {
      id: `scan_${Date.now()}`,
      parlourId: parlour.id,
      customerId: customer.id,
      customerName: customer.fullName,
      scanDate: '2026-11-22',
      photoDataUrl: capturedDataUrl,
      lightingCondition: lightingNote,
      summary: analysisResult.summary,
      suggestedFollowUpDate: followUpIso,
      staffObservations:
        staffObservations.trim() || 'Captured in studio under consistent lighting.',
      treatmentsReceived: treatmentsReceived.trim() || 'Consultation Scan',
      productsUsed: productsUsed.trim() || 'Bare skin prior to service',
      analysis: analysisResult,
    };

    onSaveSkinScan(record);
    setSavedNotice(`Saved cosmetic scan record to ${customer.fullName}'s Skin Progress Tracker.`);
  };

  const selectedZoneDetail =
    analysisResult?.zones.find((z) => z.zone === activeZone) ?? analysisResult?.zones[0];

  const zoneCoords: Record<string, { cx: number; cy: number }> = {
    Forehead: { cx: 120, cy: 62 },
    'T-Zone & Nose': { cx: 120, cy: 118 },
    'Left Cheek': { cx: 78, cy: 132 },
    'Right Cheek': { cx: 162, cy: 132 },
    'Eye Contour': { cx: 152, cy: 96 },
    'Chin & Jawline': { cx: 120, cy: 178 },
  };

  return (
    <div className="space-y-5">
      {/* Header & Mandatory Non-Medical Safety Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#EC4899] text-white flex items-center justify-center shadow-sm shrink-0">
            <ScanFace className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              AI Face Scanner &amp; Cosmetic Skin Observation
            </h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Capture or upload a studio portrait to map visible skin characteristics and tailor
              salon treatments.
            </p>
          </div>
        </div>
      </div>

      <div
        role="note"
        className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-[#111827]"
      >
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Cosmetic Assessment Notice:</strong> Image-based facial analysis is an approximate
          cosmetic observation tool only. It does not diagnose skin diseases, infections, skin
          cancer, or medical conditions, and does not provide medical-grade measurements. Always
          refer concerning, changing, or persistent skin lesions to a qualified dermatologist.
        </p>
      </div>

      {/* Main Capture + Facial Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Capture & Controls */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="scan-customer"
                className="block text-xs font-semibold text-[#111827] mb-1"
              >
                Client Profile
              </label>
              <select
                id="scan-customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="scan-lighting"
                className="block text-xs font-semibold text-[#111827] mb-1"
              >
                Lighting Condition
              </label>
              <input
                id="scan-lighting"
                type="text"
                value={lightingNote}
                onChange={(e) => setLightingNote(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
              />
            </div>
          </div>

          {/* Camera / Portrait Alignment Viewport */}
          <div className="relative aspect-[3/4] w-full max-w-[260px] mx-auto rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#F3F4F8]">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={capturedDataUrl}
                alt="Customer facial capture for cosmetic observation"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}

            {/* Face Alignment Reticle */}
            <svg
              viewBox="0 0 240 320"
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              <ellipse
                cx="120"
                cy="152"
                rx="66"
                ry="92"
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity="0.9"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <line x1="120" y1="48" x2="120" y2="256" stroke="#FFFFFF" strokeOpacity="0.4" />
              <line x1="54" y1="145" x2="186" y2="145" stroke="#FFFFFF" strokeOpacity="0.4" />
            </svg>
          </div>

          {cameraError && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
              {cameraError}
            </p>
          )}

          {/* Camera & Upload Action Row */}
          <div className="flex flex-wrap items-center gap-2">
            {!cameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                Open Camera
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={capturePhotoFromVideo}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D91A6B] text-white text-xs font-semibold hover:bg-[#BD145B] whitespace-nowrap"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Capture Face
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#111827] whitespace-nowrap"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop Camera
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-[#F8FAFC] whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload facial photograph"
            />

            <button
              type="button"
              onClick={runSkinAnalysis}
              disabled={analyzing || cameraActive}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D91A6B] text-white text-xs font-semibold hover:bg-[#BD145B] disabled:opacity-50 whitespace-nowrap shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {analyzing ? 'Analyzing Photo...' : 'Analyze Skin Appearance'}
            </button>
          </div>
        </div>

        {/* Right: Visual Facial Map & Cosmetic Report */}
        <div className="lg:col-span-7 space-y-5">
          {analysisError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-sm text-rose-800">
              <p className="font-semibold mb-1">AI Skin Analysis Error</p>
              <p className="text-xs leading-relaxed">{analysisError}</p>
            </div>
          )}

          {!analysisResult ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF0F6] text-[#D91A6B] flex items-center justify-center mx-auto mb-3">
                <ScanFace className="w-6 h-6" />
              </div>
              <p className="font-display text-xl font-bold text-[#111827]">
                Ready for Cosmetic Observation
              </p>
              <p className="text-sm text-[#6B7280] mt-2 max-w-md mx-auto">
                Position the client&apos;s face inside the alignment guide under even, diffused
                lighting, then click <strong>Analyze Skin Appearance</strong> to generate a visual
                facial zone map and skincare summary.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-6 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                <div>
                  <p className="text-xs text-[#6B7280]">
                    {analysisResult.skinAppearanceType} · {analysisResult.faceDetectedNote}
                  </p>
                  <h2 className="font-display text-xl font-bold text-[#111827] mt-0.5">
                    Cosmetic Skin Observation Report
                  </h2>
                </div>
                <span className="text-xs font-mono tabular-nums font-semibold text-[#D91A6B] shrink-0">
                  Follow-up in ~{analysisResult.suggestedFollowUpDays} days
                </span>
              </div>

              <p className="text-sm text-[#111827] leading-relaxed">{analysisResult.summary}</p>

              {/* Visual Facial Map + Interactive Zone Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl p-4">
                <div className="md:col-span-5 flex justify-center">
                  <svg
                    viewBox="0 0 240 240"
                    className="w-52 h-52"
                    role="img"
                    aria-label="Interactive facial zone observation map"
                  >
                    <ellipse
                      cx="120"
                      cy="120"
                      rx="68"
                      ry="92"
                      fill="#FDF0F6"
                      stroke="#F472B6"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M90 96 Q102 90 112 96 M128 96 Q138 90 150 96"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M120 96 L116 132 L124 134"
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="1.3"
                    />
                    <path
                      d="M102 158 Q120 168 138 158"
                      fill="none"
                      stroke="#D91A6B"
                      strokeWidth="1.5"
                    />
                    {analysisResult.zones.map((z) => {
                      const pt = zoneCoords[z.zone] ?? { cx: 120, cy: 120 };
                      const isActive = z.zone === activeZone;
                      return (
                        <g
                          key={z.zone}
                          onClick={() => setActiveZone(z.zone)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={pt.cx}
                            cy={pt.cy}
                            r={isActive ? 11 : 8}
                            fill={isActive ? '#D91A6B' : '#FFFFFF'}
                            stroke="#D91A6B"
                            strokeWidth="2"
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.zones.map((z) => (
                      <button
                        key={z.zone}
                        type="button"
                        onClick={() => setActiveZone(z.zone)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                          activeZone === z.zone
                            ? 'bg-[#D91A6B] text-white'
                            : 'bg-white border border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F8]'
                        }`}
                      >
                        {z.zone}
                      </button>
                    ))}
                  </div>
                  {selectedZoneDetail && (
                    <div className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#111827]">
                          {selectedZoneDetail.zone} · {selectedZoneDetail.focus}
                        </span>
                        <span className="font-mono text-[#5B4CE6] font-semibold">
                          {selectedZoneDetail.intensity}
                        </span>
                      </div>
                      <p className="text-[#6B7280] leading-relaxed">
                        {selectedZoneDetail.observation}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 7 Individual Analysis Cards */}
              <div>
                <h3 className="text-xs font-semibold text-[#6B7280] mb-3">
                  Characteristic Observations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisResult.characteristics.map((char) => (
                    <div
                      key={char.key}
                      className="border border-[#E5E7EB] rounded-xl p-3.5 bg-[#F8FAFC]"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-semibold text-[#111827]">{char.label}</span>
                        <span className="text-xs font-mono font-semibold text-[#D91A6B] shrink-0">
                          {char.level}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                        {char.observation}
                      </p>
                      <p className="text-[11px] text-[#6B7280] mt-1.5">
                        Clarity: {char.confidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skincare Suggestions & Suitable Salon Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#F1F5F9] pt-4 text-xs">
                <div>
                  <h3 className="font-semibold text-[#111827] mb-2">
                    General Skincare Suggestions
                  </h3>
                  <ul className="space-y-1.5 text-[#6B7280]">
                    {analysisResult.skincareSuggestions.map((s) => (
                      <li key={s}>· {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-[#111827] mb-2">
                    Suitable Salon Treatment Categories
                  </h3>
                  <ul className="space-y-1.5 text-[#111827]">
                    {analysisResult.recommendedSalonCategories.map((cat) => (
                      <li key={cat}>· {cat}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Save to Skin Progress Tracker */}
              <div className="border-t border-[#F1F5F9] pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="scan-treatments"
                      className="block text-xs font-semibold text-[#111827] mb-1"
                    >
                      Treatments Received Today
                    </label>
                    <input
                      id="scan-treatments"
                      type="text"
                      value={treatmentsReceived}
                      onChange={(e) => setTreatmentsReceived(e.target.value)}
                      placeholder="e.g. Barrier Calm Hydration Facial"
                      className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="scan-products"
                      className="block text-xs font-semibold text-[#111827] mb-1"
                    >
                      Products Used
                    </label>
                    <input
                      id="scan-products"
                      type="text"
                      value={productsUsed}
                      onChange={(e) => setProductsUsed(e.target.value)}
                      placeholder="e.g. Ceramide Cloud Recovery Cream"
                      className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="scan-obs"
                    className="block text-xs font-semibold text-[#111827] mb-1"
                  >
                    Staff Observations
                  </label>
                  <input
                    id="scan-obs"
                    type="text"
                    value={staffObservations}
                    onChange={(e) => setStaffObservations(e.target.value)}
                    placeholder="Capture notes on lighting consistency and client comfort..."
                    className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-xl bg-[#F8FAFC]"
                  />
                </div>

                {savedNotice && (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{savedNotice}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[#6B7280]">{analysisResult.disclaimer}</p>
                  <button
                    type="button"
                    onClick={handleSaveReport}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D91A6B] text-white text-xs font-semibold hover:bg-[#BD145B] whitespace-nowrap shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save to Progress Tracker
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
