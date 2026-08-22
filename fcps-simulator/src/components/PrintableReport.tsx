'use client';
import React from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   PRINTABLE REPORT — single A4 portrait page

   Deliberately a SEPARATE DOM subtree from the on-screen dashboard rather
   than a print stylesheet layered over it. The dashboard can't be printed
   reliably no matter how many @media print overrides are thrown at it:

     - Recharts' ResponsiveContainer measures its parent in JS at render
       time. The print reflow happens after that measurement, so charts
       either collapse to zero height or keep their screen pixel size and
       run off the sheet.
     - The dashboard is sized in vh/vw and 1fr grid tracks. Neither has a
       meaningful value on a paged medium, which is what produced the
       half-empty trailing pages.
     - framer-motion elements can be captured mid-transition, printing at
       partial opacity or offset.

   So everything here is static: fixed mm dimensions, inline SVG with
   hard-coded geometry, CSS-only bars, no animation, no measurement. What
   you see in the preview is exactly what the printer receives.

   Geometry: A4 is 210 × 297mm. With @page margin 10mm the printable box
   is 190 × 277mm, which is what .pr-root is pinned to. The middle band
   flexes to absorb slack and the root clips overflow, so a long subject
   list or a verbose recommendation can never push content onto a page 2.
═══════════════════════════════════════════════════════════════════════ */

export interface PrintableReportProps {
  candidateName?: string;
  candidateEmail?: string;
  subject: string;
  mode: string;
  /** Session UUID. Doubles as the attempt identifier — a session can only be
   *  submitted once (submit_exam_attempt raises ALREADY_SUBMITTED otherwise),
   *  so it maps 1:1 to an attempt without needing the RPC to hand back the
   *  exam_attempts row id. */
  sessionId?: string;
  submittedAt?: Date;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  pct: number;
  pass: boolean;
  accuracy: number;
  subjectData: { name: string; pct: number; correct: number; total: number }[];
  subjectDataReliable: boolean;
  strongest?: { name: string; pct: number };
  weakest?: { name: string; pct: number };
  /** Per-question outcome in paper order, for the response map. Omitted (or
   *  empty) when the answer key wasn't available, in which case the map is
   *  suppressed rather than printed as a wall of false "wrong" marks. */
  responses?: ('correct' | 'wrong' | 'skipped')[];
  /** Printed in the report header/subtitle. Defaults to 'FCPS Part-1' so
   *  every pre-existing caller (which never passed this) keeps its exact
   *  original wording. Multi-exam attempts (MS/MD, MRCP Part 1, etc. -- see
   *  supabase/migrations/20260822000000_multi_exam_platform_foundation.sql)
   *  pass their own exam_types.display_name here instead. */
  examLabel?: string;
  /** Non-null/true only for exams that actually deduct marks for wrong
   *  answers (MS/MD today). Every FCPS report still gets false/undefined
   *  here and prints exactly the same "No negative marking" copy as before
   *  -- this only changes what's shown for exams where that claim would be
   *  factually wrong. */
  hasNegativeMarking?: boolean;
  /** Total marks for the paper when it's not simply "1 mark per question"
   *  (e.g. MS/MD JCAT: 100 MCQs, 250 total marks, 2.5 marks per correct
   *  answer). Only rescales the printed score fraction/stat -- pct/pass
   *  above are already correct. Undefined (default) keeps every existing
   *  report's "correct/total questions" printing unchanged. */
  totalMarks?: number;
}

/* ── Recommendation engine ──────────────────────────────────────────────
   Banded on percentage, then sharpened with the candidate's own weakest
   subject. Advice is FCPS Part-1 specific: at low scores past papers are
   actively counter-productive (you memorise answers without the substrate),
   so the low band pushes core texts and the high band pushes timed mocks. */

const SUBJECT_RESOURCES: Record<string, string> = {
  Anatomy: 'Snell\u2019s Clinical Anatomy + KLM for embryology; draw every relation you get wrong',
  Physiology: 'BRS Physiology for rapid revision, Guyton for mechanisms you can\u2019t reason through',
  Biochemistry: 'Lippincott Illustrated Reviews; prioritise metabolic pathway regulation points',
  Pathology: 'Robbins Basic Pathology; general pathology chapters carry the highest yield',
  Pharmacology: 'Katzung Review; build a mechanism-and-adverse-effect table per drug class',
  Microbiology: 'Levinson Review; cluster organisms by presentation, not by taxonomy',
  Medicine: 'Davidson\u2019s for clinical correlation; map presentations back to basic science',
  Oncology: 'Robbins neoplasia chapter; focus on tumour markers and staging principles',
  'Obstetrics & Gynecology': 'Focus on reproductive physiology and pelvic anatomy fundamentals',
  Pediatrics: 'Nelson Essentials; concentrate on growth, development and congenital disorders',
  Neurophysiology: 'BRS Physiology neuro section; master tracts and lesion localisation',
  Histology: 'Junqueira\u2019s; identify tissue by defining features rather than rote images',
};

export function buildRecommendation(p: PrintableReportProps): {
  band: string;
  headline: string;
  points: string[];
} {
  const { pct, weakest, strongest, skipped, total, accuracy, subjectDataReliable, hasNegativeMarking, examLabel = 'FCPS Part-1' } = p;
  const points: string[] = [];

  let band: string;
  let headline: string;

  if (pct < 50) {
    band = 'FOUNDATION STAGE';
    headline =
      'Core concepts need rebuilding before question practice becomes productive.';
    points.push(
      'Work through standard textbooks subject by subject rather than attempting more MCQs. Below this threshold, past papers teach you answers instead of principles.',
      'Set a fixed daily block for one subject only. Rotating between subjects too early prevents any of them from consolidating.',
      'Re-attempt this same subject once you have completed a full reading pass — the delta tells you whether the reading worked.',
    );
  } else if (pct < 75) {
    band = 'CONSOLIDATION STAGE';
    headline =
      'Foundations are in place; the gap now is recall speed and applied reasoning.';
    points.push(
      'Shift to high-yield revision notes plus CPSP past papers. Your base is sufficient for question practice to now be the more efficient teacher.',
      'For every incorrect answer, write one line on why the correct option is right AND why your choice was wrong. Reviewing only the right answer is where most candidates plateau.',
      'Begin timed blocks of 50 questions to build exam pacing before adding further content.',
    );
  } else {
    band = 'EXAM-READY STAGE';
    headline =
      'Performance is at passing standard. Priority now is consistency under exam conditions.';
    points.push(
      'Move to full-length timed mocks in a single sitting to build stamina — accuracy typically falls in the final third when this is untrained.',
      'Snipe remaining weak areas rather than re-reading material you already score well on. Broad revision at this stage has poor returns.',
      'Use spaced repetition on previously missed questions to protect against decay before the exam date.',
    );
  }

  if (subjectDataReliable && weakest && weakest.pct < 100) {
    const resource = SUBJECT_RESOURCES[weakest.name];
    points.push(
      `Weakest area is ${weakest.name} at ${weakest.pct}%.${resource ? ` Recommended: ${resource}.` : ''}`,
    );
  }
  if (subjectDataReliable && strongest && strongest.pct >= 70) {
    points.push(
      `${strongest.name} at ${strongest.pct}% is a reliable scoring area — maintain it with brief periodic review rather than further study time.`,
    );
  }

  const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;
  if (skipRate >= 20) {
    points.push(
      hasNegativeMarking
        ? `${skipRate}% of questions were left unattempted. This exam deducts marks for wrong answers, so only guess when you can confidently eliminate at least one option — a blind guess has negative expected value here.`
        : `${skipRate}% of questions were left unattempted. ${examLabel} carries no negative marking, so every blank is a discarded mark — always commit to an answer.`,
    );
  } else if (accuracy > 0 && accuracy - p.pct >= 15) {
    points.push(
      `Accuracy on attempted questions was ${accuracy}% versus ${p.pct}% overall — your knowledge is stronger than the raw score suggests. Time management is the limiting factor, not content.`,
    );
  }

  return { band, headline, points: points.slice(0, 5) };
}

/* ── Print stylesheet ───────────────────────────────────────────────────
   @page carries the A4 declaration. On screen .pr-root is display:none,
   so this subtree costs nothing until a print is invoked. */
const PRINT_CSS = `
@page { size: A4 portrait; margin: 10mm; }

.pr-root { display: none; }

@media print {
  /* Kill the interactive app entirely. Hiding chrome piecemeal leaves
     zero-height wrappers behind that still generate trailing blank pages,
     so the whole dashboard root goes rather than its individual parts. */
  .rs-root, .no-print, nav, aside, header.exam-header { display: none !important; }

  html, body {
    height: auto !important;
    overflow: visible !important;
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .pr-root {
    display: flex !important;
    flex-direction: column;
    /* 210mm sheet - 2x10mm margin = 190mm; 297 - 20 = 277mm. */
    width: 190mm;
    height: 277mm;
    /* Hard stop: whatever happens above, nothing reaches a second page. */
    overflow: hidden;
    box-sizing: border-box;
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: #0f172a;
    background: #fff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .pr-root * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}

/* Screen preview support: .pr-preview lifts the same markup into view so
   the layout can be checked without opening the print dialog. */
.pr-preview .pr-root {
  display: flex !important;
  flex-direction: column;
  width: 190mm;
  height: 277mm;
  overflow: hidden;
  box-sizing: border-box;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 4px 24px rgba(15,23,42,0.18);
  font-family: 'Inter', system-ui, sans-serif;
}

/* ── Header ── */
.pr-head { flex-shrink: 0; border-bottom: 2.5pt solid #0d9488; padding-bottom: 2.5mm; display: flex; justify-content: space-between; align-items: flex-start; }
.pr-title { font-size: 15pt; font-weight: 900; letter-spacing: -0.3pt; line-height: 1.15; color: #0f172a; margin: 0; }
.pr-title span { color: #0d9488; }
.pr-sub { font-size: 7.5pt; color: #64748b; margin-top: 1mm; font-weight: 500; }
.pr-brand { text-align: right; flex-shrink: 0; }
.pr-brand-mark { font-size: 9pt; font-weight: 900; color: #0d9488; letter-spacing: 1pt; text-transform: uppercase; }
.pr-brand-url { font-size: 7pt; color: #64748b; margin-top: 0.5mm; }

/* ── Candidate details ── */
.pr-cand { flex-shrink: 0; margin-top: 3mm; border: 0.75pt solid #cbd5e1; border-radius: 1.5mm; overflow: hidden; }
.pr-cand-bar { background: #f1f5f9; padding: 1.2mm 2.5mm; font-size: 6.5pt; font-weight: 800; letter-spacing: 0.8pt; text-transform: uppercase; color: #475569; border-bottom: 0.75pt solid #cbd5e1; }
.pr-cand-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; }
.pr-cf { padding: 1.8mm 2.5mm; border-right: 0.5pt solid #e2e8f0; border-bottom: 0.5pt solid #e2e8f0; }
.pr-cf:nth-child(3n) { border-right: none; }
.pr-cf:nth-last-child(-n+3) { border-bottom: none; }
.pr-cf-k { font-size: 6pt; font-weight: 700; letter-spacing: 0.5pt; text-transform: uppercase; color: #94a3b8; }
.pr-cf-v { font-size: 8.5pt; font-weight: 700; color: #0f172a; margin-top: 0.6mm; word-break: break-word; }
.pr-cf-v.mono { font-family: 'Courier New', monospace; font-size: 7.5pt; letter-spacing: -0.2pt; }

/* ── Summary ── */
.pr-summary { flex-shrink: 0; margin-top: 3mm; display: flex; gap: 3mm; align-items: stretch; }
.pr-ring-box { width: 44mm; flex-shrink: 0; border: 0.75pt solid #cbd5e1; border-radius: 1.5mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5mm 1mm; }
.pr-verdict { margin-top: 1.5mm; font-size: 7.5pt; font-weight: 900; letter-spacing: 0.6pt; padding: 0.8mm 3mm; border-radius: 6mm; }
.pr-verdict.pass { background: #ccfbf1; color: #0f766e; border: 0.75pt solid #5eead4; }
.pr-verdict.fail { background: #fee2e2; color: #b91c1c; border: 0.75pt solid #fca5a5; }
.pr-stats { flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2mm; }
.pr-stat { border: 0.75pt solid #cbd5e1; border-radius: 1.5mm; padding: 2mm; display: flex; flex-direction: column; justify-content: center; }
.pr-stat-n { font-size: 14pt; font-weight: 900; line-height: 1; }
.pr-stat-l { font-size: 6pt; font-weight: 700; letter-spacing: 0.5pt; text-transform: uppercase; color: #64748b; margin-top: 0.8mm; }

/* ── Middle band (flexes) ── */
/* Content-sized, NOT flex:1. Stretching these to fill the sheet left ~104mm
   of empty space inside bordered boxes, which reads as a rendering fault
   rather than as deliberate whitespace. The footer takes the slack via
   margin-top:auto instead, so unused space is plain page margin. */
.pr-mid { flex: 0 0 auto; min-height: 0; margin-top: 3mm; display: flex; gap: 3mm; }
.pr-panel { border: 0.75pt solid #cbd5e1; border-radius: 1.5mm; padding: 2.5mm; display: flex; flex-direction: column; overflow: hidden; }
.pr-panel-h { font-size: 6.5pt; font-weight: 800; letter-spacing: 0.8pt; text-transform: uppercase; color: #0d9488; padding-bottom: 1.2mm; border-bottom: 0.5pt solid #e2e8f0; margin-bottom: 1.8mm; }

.pr-subj { width: 62mm; flex-shrink: 0; }
.pr-bar-row { display: flex; align-items: center; gap: 1.5mm; margin-bottom: 1.4mm; }
.pr-bar-name { font-size: 7pt; font-weight: 600; color: #334155; width: 20mm; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pr-bar-track { flex: 1; height: 2.6mm; background: #f1f5f9; border-radius: 1.3mm; overflow: hidden; }
.pr-bar-fill { height: 100%; border-radius: 1.3mm; }
.pr-bar-pct { font-size: 6.5pt; font-weight: 800; color: #0f172a; width: 12mm; text-align: right; flex-shrink: 0; }
.pr-note { font-size: 6.5pt; color: #94a3b8; font-style: italic; margin-top: auto; padding-top: 1.5mm; line-height: 1.4; }

.pr-rec { flex: 1; min-width: 0; }
.pr-band { display: inline-block; font-size: 6.5pt; font-weight: 900; letter-spacing: 0.7pt; padding: 0.8mm 2.2mm; border-radius: 5mm; background: #0d9488; color: #fff; margin-bottom: 1.8mm; }
.pr-rec-head { font-size: 8pt; font-weight: 700; color: #0f172a; line-height: 1.35; margin-bottom: 2mm; }
.pr-rec-list { margin: 0; padding: 0; list-style: none; }
.pr-rec-list li { font-size: 7.2pt; line-height: 1.45; color: #334155; padding-left: 3.2mm; margin-bottom: 1.6mm; position: relative; }
.pr-rec-list li::before { content: ''; position: absolute; left: 0; top: 1.1mm; width: 1.4mm; height: 1.4mm; border-radius: 50%; background: #0d9488; }

/* ── Question response map ── */
.pr-map { flex-shrink: 0; margin-top: 3mm; }
.pr-map-grid { display: flex; flex-wrap: wrap; gap: 1mm; }
.pr-qcell { width: 6.4mm; height: 4.6mm; border-radius: 0.8mm; font-size: 5.5pt; font-weight: 800; display: flex; align-items: center; justify-content: center; border: 0.5pt solid; }
.pr-qcell.c { background: #d1fae5; border-color: #6ee7b7; color: #047857; }
.pr-qcell.w { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
.pr-qcell.s { background: #f1f5f9; border-color: #cbd5e1; color: #64748b; }
.pr-legend { display: flex; gap: 4mm; margin-top: 2mm; font-size: 6.5pt; color: #64748b; font-weight: 600; }
.pr-legend-i { display: flex; align-items: center; gap: 1.2mm; }
.pr-legend-sw { width: 3mm; height: 2.4mm; border-radius: 0.6mm; border: 0.5pt solid; }

/* ── Footer ── */
.pr-foot { flex-shrink: 0; margin-top: auto; padding-top: 3mm; border-top: 1.5pt solid #0d9488; padding-top: 1.8mm; display: flex; justify-content: space-between; align-items: flex-end; }
.pr-foot-l { font-size: 6.5pt; color: #64748b; line-height: 1.5; }
.pr-foot-l strong { color: #0f172a; font-weight: 700; }
.pr-foot-r { font-size: 6pt; color: #94a3b8; text-align: right; line-height: 1.5; }
`;

const RING_R = 15.5;
const RING_C = 2 * Math.PI * RING_R;

export default function PrintableReport(props: PrintableReportProps) {
  const {
    candidateName, candidateEmail, subject, mode, sessionId, submittedAt,
    correct, wrong, skipped, total, pct, pass, accuracy,
    subjectData, subjectDataReliable, strongest, weakest, responses,
    examLabel = 'FCPS Part-1', hasNegativeMarking = false, totalMarks,
  } = props;

  const marksPerQuestion = totalMarks && total > 0 ? totalMarks / total : 1;
  const displayMarks = totalMarks ? Math.round(correct * marksPerQuestion * 100) / 100 : correct;
  const displayTotal = totalMarks ?? total;

  const attempted = correct + wrong;
  const when = submittedAt ?? new Date();
  const dateStr = when.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const timeStr = when.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  // Short human-quotable code for support tickets; full UUID also printed.
  const testCode = sessionId
    ? `CPSP-${sessionId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
    : '—';

  const rec = buildRecommendation(props);
  const ringColor = pass ? '#0d9488' : '#ef4444';
  const dash = (RING_C * (pct / 100)).toFixed(2);

  // Cap rows so a Mixed paper spanning many subjects can't overflow the panel.
  const shownSubjects = subjectData.slice(0, 9);
  const hiddenCount = subjectData.length - shownSubjects.length;

  return (
    <>
      <style>{PRINT_CSS}</style>
      <div className="pr-root" id="print-report">

        {/* ── HEADER ── */}
        <div className="pr-head">
          <div>
            <h1 className="pr-title">
              {examLabel} <span>Examination Assessment Report</span>
            </h1>
            <div className="pr-sub">
              Computer-Based Mock Assessment &middot; {mode === 'practice' ? 'Practice Mode' : 'Examination Mode'} &middot; {hasNegativeMarking ? 'Negative marking applies' : 'No negative marking'}
            </div>
          </div>
          <div className="pr-brand">
            <div className="pr-brand-mark">CPSP Prep Portal</div>
            <div className="pr-brand-url">cpsp.vercel.app</div>
          </div>
        </div>

        {/* ── CANDIDATE ── */}
        <div className="pr-cand">
          <div className="pr-cand-bar">Candidate Particulars</div>
          <div className="pr-cand-grid">
            <div className="pr-cf">
              <div className="pr-cf-k">Candidate Name</div>
              <div className="pr-cf-v">{candidateName || 'Candidate'}</div>
            </div>
            <div className="pr-cf">
              <div className="pr-cf-k">Email Address</div>
              <div className="pr-cf-v">{candidateEmail || '—'}</div>
            </div>
            <div className="pr-cf">
              <div className="pr-cf-k">Subject / Specialty</div>
              <div className="pr-cf-v">{subject}</div>
            </div>
            <div className="pr-cf">
              <div className="pr-cf-k">Date of Attempt</div>
              <div className="pr-cf-v">{dateStr}</div>
            </div>
            <div className="pr-cf">
              <div className="pr-cf-k">Time of Attempt</div>
              <div className="pr-cf-v">{timeStr}</div>
            </div>
            <div className="pr-cf">
              <div className="pr-cf-k">Attempt / Test Code</div>
              <div className="pr-cf-v mono">{testCode}</div>
            </div>
          </div>
        </div>

        {/* ── SUMMARY ── */}
        <div className="pr-summary">
          <div className="pr-ring-box">
            {/* Static SVG — no ResponsiveContainer, no measurement, so it
                renders identically on screen and on paper. */}
            <svg width="100" height="100" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={RING_R} fill="none" stroke="#e2e8f0" strokeWidth="4" />
              <circle
                cx="20" cy="20" r={RING_R} fill="none"
                stroke={ringColor} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${dash} ${RING_C.toFixed(2)}`}
                transform="rotate(-90 20 20)"
              />
              <text x="20" y="19.5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#0f172a">{pct}%</text>
              <text x="20" y="25" textAnchor="middle" fontSize="4.2" fontWeight="600" fill="#64748b">{displayMarks}/{displayTotal}{totalMarks ? ' marks' : ''}</text>
            </svg>
            <div className={`pr-verdict ${pass ? 'pass' : 'fail'}`}>
              {pass ? 'PASS' : 'BELOW PASSING'}
            </div>
          </div>

          <div className="pr-stats">
            {[
              { n: total,     l: 'Total Questions',   c: '#0f172a' },
              { n: attempted, l: 'Attempted',         c: '#0d9488' },
              { n: skipped,   l: 'Unattempted',       c: '#d97706' },
              { n: correct,   l: 'Correct Answers',   c: '#16a34a' },
              { n: wrong,     l: 'Incorrect Answers', c: '#dc2626' },
              // Same box as every other report -- when this paper has real
              // total marks (e.g. MS/MD JCAT's 250), show the marks scored
              // there instead of a second copy of the percentage (already
              // shown in the ring above). Keeps the 6-box grid untouched
              // for every exam that doesn't pass totalMarks.
              totalMarks
                ? { n: `${displayMarks}/${totalMarks}`, l: 'Marks Scored', c: '#0d9488' }
                : { n: `${pct}%`, l: 'Total Score', c: '#0d9488' },
            ].map((s) => (
              <div key={s.l} className="pr-stat">
                <div className="pr-stat-n" style={{ color: s.c }}>{s.n}</div>
                <div className="pr-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MIDDLE BAND ── */}
        <div className="pr-mid">
          <div className="pr-panel pr-subj">
            <div className="pr-panel-h">Subject-Wise Performance</div>
            {subjectDataReliable && shownSubjects.length > 0 ? (
              <>
                {shownSubjects.map((s) => (
                  <div key={s.name} className="pr-bar-row">
                    <div className="pr-bar-name">{s.name}</div>
                    <div className="pr-bar-track">
                      <div
                        className="pr-bar-fill"
                        style={{
                          width: `${s.pct}%`,
                          background: s.pct >= 75 ? '#0d9488' : s.pct >= 50 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                    <div className="pr-bar-pct">{s.correct}/{s.total}</div>
                  </div>
                ))}
                {hiddenCount > 0 && (
                  <div className="pr-note">+ {hiddenCount} further subject{hiddenCount > 1 ? 's' : ''} in this attempt.</div>
                )}
                <div className="pr-note">
                  Accuracy on attempted questions: <strong>{accuracy}%</strong>.
                  {strongest ? ` Strongest: ${strongest.name}.` : ''}
                  {weakest ? ` Weakest: ${weakest.name}.` : ''}
                </div>
              </>
            ) : (
              <div className="pr-note">
                Subject-level breakdown is unavailable for this attempt. The overall
                score shown above is server-verified and accurate.
              </div>
            )}
          </div>

          <div className="pr-panel pr-rec">
            <div className="pr-panel-h">Performance Analysis &amp; Improvement Strategy</div>
            <div className="pr-band">{rec.band}</div>
            <div className="pr-rec-head">{rec.headline}</div>
            <ul className="pr-rec-list">
              {rec.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        </div>

        {/* ── QUESTION RESPONSE MAP ── */}
        {responses && responses.length > 0 && (
          <div className="pr-panel pr-map">
            <div className="pr-panel-h">Question Response Map</div>
            <div className="pr-map-grid">
              {responses.map((r, i) => (
                <div
                  key={i}
                  className={`pr-qcell ${r === 'correct' ? 'c' : r === 'wrong' ? 'w' : 's'}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="pr-legend">
              <span className="pr-legend-i">
                <span className="pr-legend-sw" style={{ background: '#d1fae5', borderColor: '#6ee7b7' }} />
                Correct
              </span>
              <span className="pr-legend-i">
                <span className="pr-legend-sw" style={{ background: '#fee2e2', borderColor: '#fca5a5' }} />
                Incorrect
              </span>
              <span className="pr-legend-i">
                <span className="pr-legend-sw" style={{ background: '#f1f5f9', borderColor: '#cbd5e1' }} />
                Unattempted
              </span>
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="pr-foot">
          <div className="pr-foot-l">
            <strong>CPSP Prep Portal</strong> &nbsp;&middot;&nbsp; https://cpsp.vercel.app<br />
            Support: support@cpsp.vercel.app &nbsp;&middot;&nbsp; Ref: <span style={{ fontFamily: 'Courier New, monospace' }}>{sessionId || '—'}</span>
          </div>
          <div className="pr-foot-r">
            Generated automatically via CPSP Prep Portal<br />
            &copy; {when.getFullYear()} CPSP Prep Portal &middot; For personal study use only
          </div>
        </div>
      </div>
    </>
  );
}
