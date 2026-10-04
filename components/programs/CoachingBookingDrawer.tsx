"use client";

import { useState, useEffect } from "react";
import { X, Check, MessageSquare, Sparkles, ChevronRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { COACH_NAME } from "@/lib/content";

interface CoachingBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProgram?: string;
}

type SkillLevel = "beginner" | "intermediate" | "advanced";

const SKILL_LEVELS: { id: SkillLevel; title: string; badge: string; desc: string }[] = [
  {
    id: "beginner",
    title: "Foundational & Grip",
    badge: "Level 1",
    desc: "Basic footwork, stroke mechanics, clear/drop accuracy, and rules mastery.",
  },
  {
    id: "intermediate",
    title: "Club Competitor",
    badge: "Level 2",
    desc: "Full-court agility, half-smash attack chains, doubles rotation, and deceptive net spins.",
  },
  {
    id: "advanced",
    title: "Tournament Elite",
    badge: "Level 3",
    desc: "Jump smash power, high-tempo flat rallies, state ranking match tactics, and peak conditioning.",
  },
];

const FOCUS_AREAS = [
  "Jump Smash Power & Angle",
  "Split-Step & Rapid Footwork",
  "Deceptive Net Spin & Tumble",
  "Doubles Rotations & Synergy",
  "High-Stamina Match Conditioning",
  "Pressure Point Mental Tactics",
];

const TIME_SLOTS = [
  { id: "morning", label: "Morning Squad", time: "06:00 AM – 07:30 AM", days: "Mon–Fri" },
  { id: "evening", label: "Evening Elite", time: "05:00 PM – 07:00 PM", days: "Mon–Fri" },
  { id: "weekend", label: "Weekend Masterclass", time: "07:30 AM – 10:00 AM", days: "Sat & Sun" },
];

export default function CoachingBookingDrawer({
  isOpen,
  onClose,
  defaultProgram,
}: CoachingBookingDrawerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [level, setLevel] = useState<SkillLevel>("intermediate");
  const [selectedFocus, setSelectedFocus] = useState<string[]>([
    "Jump Smash Power & Angle",
    "Split-Step & Rapid Footwork",
  ]);
  const [selectedSlot, setSelectedSlot] = useState<string>("evening");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    experience: "1-2 years",
    dominantHand: "Right",
  });
  const [submitted, setSubmitted] = useState(false);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setSubmitted(false);
      setStep(1);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFocus = (item: string) => {
    setSelectedFocus((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleWhatsAppDispatch = () => {
    const slotInfo = TIME_SLOTS.find((s) => s.id === selectedSlot);
    const levelInfo = SKILL_LEVELS.find((l) => l.id === level);

    const message = `🏸 *BADMINATION ACADEMY - TRIAL INQUIRY*
━━━━━━━━━━━━━━━━━━━━
👤 *Athlete Name:* ${formData.name || "Prospective Athlete"}
🎂 *Age:* ${formData.age || "N/A"} (${formData.dominantHand}-Handed)
⏱️ *Experience:* ${formData.experience}
📊 *Skill Level:* ${levelInfo?.title} (${levelInfo?.badge})
🎯 *Focus Areas:* ${selectedFocus.join(", ") || "General All-Around"}
⏰ *Preferred Batch:* ${slotInfo ? `${slotInfo.label} (${slotInfo.time})` : "Flexible"}
${defaultProgram ? `📌 *Program:* ${defaultProgram}\n` : ""}━━━━━━━━━━━━━━━━━━━━
Hi Coach ${COACH_NAME}, I would like to book my trial session assessment at Badmination!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919944888888?text=${encoded}`, "_blank");
    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md transition-all animate-fade-in"
    >
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-off-white/10 bg-charcoal shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-off-white/10 bg-charcoal/95 px-6 py-5 backdrop-blur-lg">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-court-green/15 text-court-green border border-court-green/30">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 id="booking-drawer-title" className="font-display text-sm font-black tracking-wider uppercase text-off-white">
                Trial Session & Skill Assessment
              </h2>
              <p className="text-xs text-muted">Train under Coach {COACH_NAME} · Badmination Academy</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-xl border border-off-white/10 bg-off-white/5 text-muted hover:text-off-white hover:border-court-green transition-colors"
          >
            <X className="size-5" />
            <span className="sr-only">Close drawer</span>
          </button>
        </div>

        {/* Step Progress Bar */}
        {!submitted && (
          <div className="flex border-b border-off-white/10 bg-black/40 px-6 py-3 text-xs">
            <div className="flex w-full items-center justify-between">
              <span className={`font-display font-bold uppercase ${step >= 1 ? "text-court-green" : "text-muted"}`}>
                1. Skill Profile
              </span>
              <ChevronRight className="size-3.5 text-muted/40" />
              <span className={`font-display font-bold uppercase ${step >= 2 ? "text-court-green" : "text-muted"}`}>
                2. Training Focus
              </span>
              <ChevronRight className="size-3.5 text-muted/40" />
              <span className={`font-display font-bold uppercase ${step >= 3 ? "text-court-green" : "text-muted"}`}>
                3. Book & Dispatch
              </span>
            </div>
          </div>
        )}

        {/* Drawer Body Content */}
        <div className="flex-1 p-6 sm:p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-court-green/20 text-court-green border border-court-green/40 shadow-[0_0_24px_rgba(16,185,129,0.3)] mb-4">
                <Check className="size-8" />
              </div>
              <h3 className="font-display text-2xl font-black uppercase text-off-white">
                Inquiry Dispatched!
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted">
                Your assessment card has been formatted for WhatsApp. Coach {COACH_NAME} or the academy desk will confirm your slot within 2 hours.
              </p>
              <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl bg-court-green py-3 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-off-white transition-colors"
                >
                  Return to Academy
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* STEP 1: Skill Profile */
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-off-white">
                  Select Your Skill Level
                </h3>
                <p className="mt-1 text-xs text-muted">
                  We balance each training court so you compete against athletes at your intensity.
                </p>
              </div>

              <div className="space-y-3">
                {SKILL_LEVELS.map((sl) => (
                  <button
                    key={sl.id}
                    type="button"
                    onClick={() => setLevel(sl.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      level === sl.id
                        ? "border-court-green bg-court-green/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                        : "border-off-white/10 bg-off-white/[0.03] hover:border-off-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold uppercase text-off-white">
                        {sl.title}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wider ${
                          level === sl.id ? "bg-court-green text-black" : "bg-off-white/10 text-muted"
                        }`}
                      >
                        {sl.badge}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted leading-relaxed">{sl.desc}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Playing Hand
                  </label>
                  <select
                    value={formData.dominantHand}
                    onChange={(e) => setFormData({ ...formData, dominantHand: e.target.value })}
                    className="w-full rounded-xl border border-off-white/10 bg-black/60 px-3 py-2.5 text-xs text-off-white focus:border-court-green focus:outline-none"
                  >
                    <option value="Right">Right-Handed</option>
                    <option value="Left">Left-Handed (Southpaw)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Experience
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full rounded-xl border border-off-white/10 bg-black/60 px-3 py-2.5 text-xs text-off-white focus:border-court-green focus:outline-none"
                  >
                    <option value="Just starting">Just Starting (&lt; 6 mos)</option>
                    <option value="1-2 years">1 – 2 Years</option>
                    <option value="3-5 years">3 – 5 Years</option>
                    <option value="5+ years competitive">5+ Years (Competitive)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-court-green py-3.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-off-white transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)]"
              >
                <span>Continue to Focus Areas</span>
                <ChevronRight className="size-4" />
              </button>
            </div>
          ) : step === 2 ? (
            /* STEP 2: Training Focus & Time Slot */
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-off-white">
                  Custom Tactical Focus
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Choose the techniques you want Coach {COACH_NAME} to evaluate during your trial.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((fa) => {
                  const isSelected = selectedFocus.includes(fa);
                  return (
                    <button
                      key={fa}
                      type="button"
                      onClick={() => toggleFocus(fa)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-court-green bg-court-green/20 text-court-green font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                          : "border-off-white/10 bg-off-white/[0.03] text-muted hover:border-off-white/30"
                      }`}
                    >
                      {isSelected ? <Check className="size-3.5 text-court-green" /> : <span>+</span>}
                      <span>{fa}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-off-white/10">
                <h4 className="font-display text-sm font-bold uppercase text-off-white mb-3">
                  Preferred Training Slot
                </h4>
                <div className="space-y-2.5">
                  {TIME_SLOTS.map((ts) => (
                    <button
                      key={ts.id}
                      type="button"
                      onClick={() => setSelectedSlot(ts.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                        selectedSlot === ts.id
                          ? "border-court-green bg-court-green/10"
                          : "border-off-white/10 bg-black/40 hover:border-off-white/20"
                      }`}
                    >
                      <div>
                        <p className="font-display text-xs font-bold uppercase text-off-white">
                          {ts.label}
                        </p>
                        <p className="text-[11px] text-muted">{ts.days}</p>
                      </div>
                      <span className="font-display text-xs font-semibold text-court-green">
                        {ts.time}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-off-white/10 bg-off-white/5 px-4 py-3 text-xs font-semibold text-muted hover:text-off-white transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-court-green py-3 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-off-white transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                >
                  <span>Final Step: Athlete Info</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 3: Athlete Info & Instant WhatsApp Dispatch */
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-off-white">
                  Athlete Details & Dispatch
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Instantly sends your assessment dossier to Coach {COACH_NAME} via WhatsApp.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Athlete Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-off-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-off-white placeholder:text-muted/50 focus:border-court-green focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-off-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-off-white placeholder:text-muted/50 focus:border-court-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 19"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full rounded-xl border border-off-white/15 bg-black/60 px-3.5 py-2.5 text-sm text-off-white placeholder:text-muted/50 focus:border-court-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Summary Preview Box */}
              <div className="rounded-xl border border-court-green/20 bg-court-green/5 p-4 text-xs">
                <div className="flex items-center gap-2 text-court-green font-display font-bold uppercase mb-2">
                  <ShieldCheck className="size-4" />
                  <span>Dossier Summary</span>
                </div>
                <div className="space-y-1 text-muted">
                  <p>
                    <strong className="text-off-white">Level:</strong>{" "}
                    {SKILL_LEVELS.find((l) => l.id === level)?.title}
                  </p>
                  <p>
                    <strong className="text-off-white">Batch:</strong>{" "}
                    {TIME_SLOTS.find((s) => s.id === selectedSlot)?.label} (
                    {TIME_SLOTS.find((s) => s.id === selectedSlot)?.time})
                  </p>
                  <p>
                    <strong className="text-off-white">Tactics:</strong>{" "}
                    {selectedFocus.slice(0, 3).join(", ")}
                    {selectedFocus.length > 3 ? ` +${selectedFocus.length - 3} more` : ""}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-off-white/10 bg-off-white/5 px-4 py-3 text-xs font-semibold text-muted hover:text-off-white transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppDispatch}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 font-display text-xs font-bold uppercase tracking-wider text-black hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(37,211,102,0.4)]"
                >
                  <MessageSquare className="size-4" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>

              <p className="text-center text-[11px] text-muted">
                Direct connection to head coach desk · Instant response guaranteed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
