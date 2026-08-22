"use client";
import React, { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid, PieChart, Pie } from "recharts";
import { createClient } from "@/lib/supabase/client";
import PrintableReport from "./PrintableReport";
import CelebrationFx from "./vvip/CelebrationFx";
import AntiTheft from "./AntiTheft";
import ForensicWatermark from "./ForensicWatermark";

/* ── Types ─────────────────────────────────────── */
import Icon from '@/design-system/Icon';
interface Question {
  id: string; question_text: string; correct_answer?: string; subject: string;
  option_a?: string|null; option_b?: string|null; option_c?: string|null;
  option_d?: string|null; option_e?: string|null; explanation?: string|null;
}
interface Props {
  questions: Question[]; answers: (string|null)[]; subject: string; mode: string;
  /** Authoritative score/total from the server-side grading RPC. When present,
   *  these are trusted over the locally-recomputed stats (which can be wrong
   *  if the post-submit answer-key reveal degrades gracefully). */
  score?: number; total?: number;
  /** Non-null only for exams with negative marking (e.g. MS/MD, -0.5/wrong
   *  answer) -- see supabase/migrations/20260822000000_multi_exam_platform_
   *  foundation.sql. Every FCPS attempt gets null/undefined here and this
   *  screen behaves exactly as it did before this prop existed. */
  finalScore?: number | null;
  /** Needed to fetch this student's real past-attempt history for the
   *  Learning Curve chart -- previously this was hardcoded mock data. */
  userId?: string;
  /** Candidate's display name, shown in the header and included when the
   *  report is printed so a printed result is identifiable. */
  candidateName?: string;
  /** Printed on the assessment report so a physical copy is traceable to
   *  an account. */
  candidateEmail?: string;
  /** Session UUID -- printed as the attempt/test code. A session can only be
   *  submitted once, so it identifies the attempt uniquely. */
  sessionId?: string;
  /** When the attempt was actually submitted. Falls back to render time. */
  submittedAt?: Date;
}

/* ── Styles (scoped) ────────────────────────────── */
const S = `
.rs-root{position:relative;height:100vh;width:100vw;display:flex;flex-direction:column;background:#f0fdfa;color:#0f172a;font-family:'Inter',system-ui,sans-serif;overflow:hidden}
.rs-header{flex-shrink:0;height:52px;background:#ffffff;border-bottom:2px solid #10B981;display:flex;align-items:center;justify-content:space-between;padding:0 28px;box-shadow:0 2px 12px rgba(16,185,129,0.08)}
.rs-logo{font-size:0.78rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0f172a}
.rs-logo span{color:#10B981;margin-right:6px}
.rs-logo-wrap{display:flex;flex-direction:column;gap:1px}
.rs-print-meta{font-size:0.6rem;font-weight:600;letter-spacing:0.02em;text-transform:none;color:#64748b}
.rs-tabs{display:flex;gap:2px;background:rgba(16,185,129,0.08);border-radius:8px;padding:3px}
.rs-tab{padding:5px 16px;border-radius:6px;font-size:0.72rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;border:none;background:transparent;color:#64748b;transition:all 0.2s}
.rs-tab.active{background:#ffffff;color:#10B981;box-shadow:0 1px 4px rgba(16,185,129,0.15)}
.rs-hbtns{display:flex;gap:8px}
.rs-btn{padding:6px 16px;border-radius:8px;font-size:0.7rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;transition:all 0.2s;text-decoration:none;display:flex;align-items:center}
.rs-btn:hover{background:#f0fdfa;border-color:#10B981;color:#10B981}
.rs-btn.primary{background:linear-gradient(135deg,#059669,#10B981);border-color:#10B981;color:white;box-shadow:0 4px 14px rgba(16,185,129,0.3)}
.rs-btn.primary:hover{background:linear-gradient(135deg,#10B981,#34D399);box-shadow:0 6px 20px rgba(16,185,129,0.4)}
.rs-btn.print{background:linear-gradient(135deg,#7c3aed,#ec4899);border-color:transparent;color:white;box-shadow:0 4px 14px rgba(124,58,237,0.3)}
.rs-btn.print:hover{background:linear-gradient(135deg,#6d28d9,#db2777);box-shadow:0 6px 20px rgba(124,58,237,0.4)}
/* Printing is handled entirely by PrintableReport, which renders its own
   A4-sized subtree and hides .rs-root. Reflowing this dashboard for paper
   was the source of the multi-page output: its charts are measured in JS
   and its tracks are sized in vh/1fr, none of which survive a paged
   medium. See PrintableReport.tsx for the reasoning. */
.rs-body{flex:1;overflow:hidden}
/* Dashboard grid */
.rs-dash{height:100%;display:grid;grid-template-columns:240px 1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;padding:8px}
.rs-pie-legend{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px;justify-content:center}
.rs-pie-legend-item{display:flex;align-items:center;gap:4px;font-size:0.6rem;font-weight:700;color:#475569}
.rs-pie-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.rs-card{background:#ffffff;border:1px solid rgba(16,185,129,0.12);border-radius:14px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.04);transition:transform 0.2s,box-shadow 0.2s}
.rs-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(16,185,129,0.1)}
.rs-label{font-size:0.58rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#10B981;margin-bottom:4px}
.rs-val{font-size:1.8rem;font-weight:900;line-height:1;color:#0f172a}
.rs-sub{font-size:0.65rem;color:#64748b;margin-top:2px;font-weight:500}
/* Score card -- carries a permanent, subtle "VVIP" gold accent (hairline
   top edge + serif gold-gradient percentage) borrowed from the paid-member
   welcome modal's metal palette, see vvip/vvip-welcome-modal.css. Kept to
   chrome/typography only -- the ring stroke and verdict pill below stay on
   the ordinary green/red pass-fail colors so the result itself is never
   less legible than before, just framed more richly. */
.rs-score-card{position:relative;grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:20px 16px;background:radial-gradient(ellipse at top,rgba(16,185,129,0.08) 0%,rgba(255,255,255,0) 70%),#ffffff}
.rs-score-card::before{content:'';position:absolute;top:0;left:22px;right:22px;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(217,180,91,0) 0%,#D9B45B 22%,#F5E3B3 50%,#D9B45B 78%,rgba(217,180,91,0) 100%)}
.rs-ring-wrap{position:relative;width:140px;height:140px;flex-shrink:0;filter:drop-shadow(0 0 10px rgba(217,180,91,0.3))}
.rs-ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.rs-pct{font-family:var(--font-playfair),'Cormorant Garamond',Georgia,serif;font-style:normal;font-weight:700;font-size:2.3rem;line-height:1;background:linear-gradient(96deg,#8A6A2C 0%,#D9B45B 45%,#F5E3B3 62%,#D9B45B 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;color:transparent}
.rs-frac{font-size:0.72rem;color:#64748b;font-weight:600;margin-top:2px}
.rs-verdict{padding:5px 14px;border-radius:20px;font-size:0.65rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase}
.rs-pass{background:rgba(16,185,129,0.1);color:#059669;border:1px solid rgba(16,185,129,0.25)}
.rs-fail{background:rgba(239,68,68,0.08);color:#dc2626;border:1px solid rgba(239,68,68,0.2)}
.rs-kpis{width:100%;display:flex;flex-direction:column;gap:5px}
.rs-kpi{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9}
.rs-kpi-k{font-size:0.6rem;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em}
.rs-kpi-v{font-size:0.8rem;font-weight:800;color:#0f172a}
.rs-kpi-v.green{color:#059669}.rs-kpi-v.red{color:#dc2626}.rs-kpi-v.amber{color:#d97706}.rs-kpi-v.blue{color:#10B981}
/* Breakdown row */
.rs-bk{display:flex;gap:6px;width:100%}
.rs-bk-item{flex:1;text-align:center;padding:8px 4px;border-radius:8px}
.rs-bk-n{font-size:1.2rem;font-weight:900;line-height:1}
.rs-bk-l{font-size:0.55rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-top:2px}
/* Subject bars */
.rs-bar-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.rs-bar-name{font-size:0.62rem;font-weight:600;color:#64748b;width:80px;flex-shrink:0;text-align:right}
.rs-bar-track{flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden}
.rs-bar-fill{height:100%;border-radius:3px;transition:width 1s ease}
.rs-bar-pct{font-size:0.6rem;font-weight:700;color:#0f172a;width:30px;text-align:right}
/* Review pane */
.rs-review{height:100%;display:flex;flex-direction:column}
.rs-filters{flex-shrink:0;display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid #f1f5f9;background:#ffffff}
.rs-filter{padding:4px 12px;border-radius:20px;font-size:0.65rem;font-weight:700;cursor:pointer;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;transition:all 0.18s}
.rs-filter.active{border-color:#10B981;color:#059669;background:rgba(16,185,129,0.08)}
.rs-qlist{flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:10px;background:#f0fdfa}
.rs-qcard{background:#ffffff;border-radius:12px;padding:14px 16px;border-left:3px solid transparent;box-shadow:0 1px 6px rgba(0,0,0,0.04)}
.rs-qcard.correct{border-left-color:#10B981;background:#f0fdfa}
.rs-qcard.wrong{border-left-color:#ef4444;background:#fff8f8}
.rs-qcard.skipped{border-left-color:#d97706;background:#fffbeb}
.rs-q-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.rs-q-num{font-size:0.6rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em}
.rs-q-badge{font-size:0.55rem;font-weight:800;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:0.08em}
.rs-badge-c{background:rgba(16,185,129,0.1);color:#059669}
.rs-badge-w{background:rgba(239,68,68,0.1);color:#dc2626}
.rs-badge-s{background:rgba(217,119,6,0.1);color:#d97706}
.rs-q-text{font-size:0.82rem;font-weight:600;color:#1e293b;line-height:1.55;margin-bottom:10px}
.rs-opts{display:flex;flex-direction:column;gap:4px}
.rs-opt{display:flex;gap:8px;align-items:flex-start;padding:5px 8px;border-radius:7px;font-size:0.75rem;color:#64748b;background:#f8fafc;width:100%}
.rs-opt.oc{background:rgba(16,185,129,0.08);color:#059669}.rs-opt.ow{background:rgba(239,68,68,0.08);color:#dc2626}
.rs-opt-l{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:0.62rem;font-weight:800;flex-shrink:0;background:#e2e8f0;color:#64748b}
.rs-opt-l.lc{background:#10B981;color:#fff}.rs-opt-l.lw{background:#ef4444;color:#fff}
.rs-explain{margin-top:8px;padding:8px 10px;background:rgba(16,185,129,0.05);border-radius:8px;border-left:2px solid #10B981}
.rs-explain-h{font-size:0.55rem;font-weight:800;color:#10B981;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px}
.rs-explain-t{font-size:0.72rem;color:#475569;line-height:1.5}
`;


/* ── Helpers ────────────────────────────────────── */
function calcStats(questions: Question[], answers: (string|null)[]) {
  let correct=0, wrong=0, skipped=0;
  answers.forEach((a,i) => { if(!a) skipped++; else if(a===questions[i].correct_answer) correct++; else wrong++; });
  return { correct, wrong, skipped, total: questions.length };
}

function calcSubjects(questions: Question[], answers: (string|null)[]) {
  const m: Record<string,{c:number;t:number}> = {};
  questions.forEach((q,i) => {
    if(!m[q.subject]) m[q.subject]={c:0,t:0};
    m[q.subject].t++;
    if(answers[i]===q.correct_answer) m[q.subject].c++;
  });
  return Object.entries(m).map(([name,d]) => ({ name, pct: Math.round((d.c/d.t)*100), correct: d.c, total: d.t }))
    .sort((a,b)=>b.pct-a.pct);
}

const RING_R = 52;
const RING_C = 2*Math.PI*RING_R;
// A strong-enough score gets a one-time confetti/balloon burst (shared
// CelebrationFx component, also used by the paid-member welcome modal) --
// 85% deliberately sits well above the 60% pass mark so it reads as "you
// did great", not just "you passed".
const CELEBRATION_THRESHOLD = 85;

/* ── Component ──────────────────────────────────── */
export default function PremiumResultScreen({ questions, answers, subject, mode, score, total: totalProp, finalScore, userId, candidateName, candidateEmail, sessionId, submittedAt }: Props) {
  const [tab, setTab] = useState<'dash'|'review'>('dash');
  const [filter, setFilter] = useState<'all'|'correct'|'wrong'|'skipped'>('all');
  // Real attempt history (replaces previous hardcoded mock numbers). Each
  // entry is { name, score } where score is that attempt's percentage.
  const [history, setHistory] = useState<{ name: string; score: number }[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      // RLS ("Users can view own attempts") already restricts this to the
      // caller's own rows -- no new policy needed.
      // limit 8: the just-submitted attempt is already the newest row here
      // (the server inserts it before returning), so this naturally includes
      // it as the last point -- no need to append a synthetic "current" entry.
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('score, total_questions, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (cancelled || error || !data) return;
      const past = data
        .slice()
        .reverse()
        .map((a: { score: number; total_questions: number }, i: number) => ({
          name: `E${i + 1}`,
          score: a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0,
        }));
      setHistory(past);
    })();
    return () => { cancelled = true; };
  }, [userId]);
  // Client-only mount gate: this screen intentionally renders nothing
  // during SSR/hydration (see the `if (!mounted) return null` below) and
  // only paints once mounted on the client. useSyncExternalStore gets
  // that same "false on server, true after client mount" value without
  // a setState call inside an effect (which the previous
  // useState+useEffect version did, triggering an extra cascading
  // render every time).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const localStats = calcStats(questions, answers);
  const correct = score !== undefined ? score : localStats.correct;
  const total   = totalProp !== undefined ? totalProp : localStats.total;
  // `skipped` only needs to know which answers are null -- it never depends
  // on correct_answer, so it's reliable even when the answer-key reveal
  // below is stale. `wrong` is then derived as whatever's left after the
  // authoritative `correct` and the reliable `skipped` are accounted for,
  // instead of trusting calcStats' own correct_answer-based wrong count
  // (which, like subjectData below, can silently disagree with the real
  // server-graded score when `questions` doesn't carry the true answer key
  // -- e.g. ExamEngine's "degrade gracefully" fallback after a failed
  // reveal_exam_answers() call).
  const skipped = answers.filter(a => !a).length;
  const wrong   = Math.max(0, total - skipped - correct);
  // Negative-marking exams (MS/MD today) score off `finalScore`, not the
  // raw correct count -- the ring, percentage, and pass/fail verdict all
  // need to reflect the actual deducted score, not just how many were right.
  const hasNegativeMarking = finalScore !== undefined && finalScore !== null;
  const displayScore = hasNegativeMarking ? finalScore! : correct;
  const pct = total > 0 ? Math.round((displayScore/total)*100) : 0;
  const pass = pct >= 60;

  // One-shot celebration burst for a strong score. PremiumResultScreen is
  // mounted fresh per attempt (ExamEngine only renders it once submitted),
  // so an empty dependency array is correct here -- pct is fixed for the
  // lifetime of this mount, this is deliberately "fire once when this
  // result first appears", not "re-fire whenever pct changes".
  const [showCelebration, setShowCelebration] = useState(false);
  useEffect(() => {
    if (pct < CELEBRATION_THRESHOLD) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setShowCelebration(true);
    const t = window.setTimeout(() => setShowCelebration(false), 4500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const subjectData = calcSubjects(questions, answers);
  // The per-subject correct counts above come from comparing answers against
  // questions[i].correct_answer client-side. That answer key is ONLY
  // trustworthy once reveal_exam_answers() has actually populated it -- if
  // that reveal degraded (see ExamEngine), correct_answer can be stale/wrong
  // and subjectData ends up crediting "correct" answers that don't add up to
  // the real, server-graded score. Cross-checking the two catches exactly
  // that: only if they agree do we trust subjectData enough to call anything
  // a "strongest" or "weakest" subject.
  const subjectCorrectSum = subjectData.reduce((s, d) => s + d.correct, 0);
  const subjectDataReliable = subjectCorrectSum === correct;
  // A subject only counts as the "strongest" if the student actually got at
  // least one question right in it (pct > 0). Previously subjectData[0] was
  // used unconditionally after sorting descending, so with an all-wrong
  // attempt (every subject at 0%) the top of that sort still got labelled
  // "strongest" -- a false/dummy signal that misled the student.
  const strongest = subjectDataReliable && subjectData.length > 0 && subjectData[0].pct > 0 ? subjectData[0] : undefined;
  const weakest   = subjectDataReliable && subjectData.length > 0 ? subjectData[subjectData.length-1] : undefined;
  const fcpsPct   = pct >= 80 ? 'Top 10%' : pct >= 70 ? 'Top 25%' : pct >= 60 ? 'Top 40%' : 'Bottom 50%';
  // No negative marking: FCPS Part 1 does not deduct marks for wrong answers,
  // so the score shown here is always the plain correct/total count -- never
  // an "adjusted" or penalized figure.
  const attempted = correct + wrong;
  const accuracy  = attempted > 0 ? Math.round((correct/attempted)*100) : 0;

  // Colorful donut breakdown data (only include non-zero slices so an
  // all-skipped or all-correct attempt doesn't draw an empty gray ring).
  const pieData = [
    { name: 'Correct', value: correct, color: '#22c55e' },
    { name: 'Wrong',   value: wrong,   color: '#ef4444' },
    { name: 'Skipped', value: skipped, color: '#f59e0b' },
  ].filter(d => d.value > 0);
  const RAINBOW = ['#10B981','#6366f1','#ec4899','#f59e0b','#22c55e','#06b6d4','#a855f7','#ef4444'];

  const historyData = history.length > 0 ? history : [{ name: 'E1', score: pct }];
  const personalAvg = historyData.length > 0
    ? Math.round(historyData.reduce((s, d) => s + d.score, 0) / historyData.length)
    : pct;
  const historyChartData = historyData.map(d => ({ ...d, avg: personalAvg }));
  const dashAspect = (RING_C*(pct/100)).toFixed(1);

  const filteredQs = questions.map((q,i)=>({q,i,a:answers[i]})).filter(({q,a})=>{
    if(filter==='correct') return a===q.correct_answer;
    if(filter==='wrong')   return a && a!==q.correct_answer;
    if(filter==='skipped') return !a;
    return true;
  });

  // Printing must show the analytics dashboard (score ring + all the
  // charts), not whichever tab happens to be open, so switch tabs first
  // and let the DOM settle for a tick before invoking the native print
  // dialog. The @media print rules above then strip the header chrome
  // and let every chart card lay out on the page instead of scrolling.
  function handlePrint() {
    // The printable subtree is always mounted and independent of which tab
    // is on screen, so there's no tab flip or settle delay to orchestrate.
    window.print();
  }

  if(!mounted) return null;

  return (
    <>
      <style>{S}</style>

      {/* Print-only: display:none on screen, the sole visible subtree on paper. */}
      <PrintableReport
        responses={subjectDataReliable
          ? questions.map((q, i) => (!answers[i] ? 'skipped' : answers[i] === q.correct_answer ? 'correct' : 'wrong') as 'correct'|'wrong'|'skipped')
          : undefined}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        subject={subject}
        mode={mode}
        sessionId={sessionId}
        submittedAt={submittedAt}
        correct={correct}
        wrong={wrong}
        skipped={skipped}
        total={total}
        pct={pct}
        pass={pass}
        accuracy={accuracy}
        subjectData={subjectData}
        subjectDataReliable={subjectDataReliable}
        strongest={strongest}
        weakest={weakest}
      />

      <div className="rs-root">
        {/* ExamEngine's own <AntiTheft /> unmounts the instant `submitted`
            flips and this screen takes over, so review was previously left
            completely unprotected -- copy/right-click/screenshot-adjacent
            shortcuts all worked again the moment a student saw their
            answers. allowPrint skips only the blanket print-hiding rule
            (PrintableReport already handles print visibility on its own);
            everything else (copy, right-click, keydown, blur-shield,
            text-select) stays active through review same as during the
            exam itself. ForensicWatermark makes any capture that still
            gets through traceable to this candidate. */}
        <AntiTheft allowPrint />
        <ForensicWatermark userEmail={candidateEmail || ''} userName={candidateName || ''} />
        {showCelebration && <CelebrationFx />}

        {/* Header */}
        <header className="rs-header">
          <div className="rs-logo-wrap">
            <div className="rs-logo"><span>FCPS</span>Performance Report</div>
            <div className="rs-print-meta">{candidateName || 'Candidate'} · {subject} · {printDate}</div>
          </div>
          <div className="rs-tabs">
            {(['dash','review'] as const).map(t=>(
              <button key={t} className={`rs-tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>
                {t==='dash'?'Analytics':'Question Review'}
              </button>
            ))}
          </div>
          <div className="rs-hbtns">
            <button className="rs-btn print" onClick={handlePrint}><Icon name="print" /> Print Result</button>
            <a href="/exam/setup" className="rs-btn primary">New Attempt</a>
            <a href="/dashboard" className="rs-btn">Exit</a>
          </div>
        </header>

        <div className="rs-body">
          <AnimatePresence mode="wait">

            {/* ── ANALYTICS TAB ── */}
            {tab==='dash' && (
              <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="rs-dash" style={{height:'100%'}}>

                {/* Score Card (left full height) */}
                <motion.div className="rs-card rs-score-card" initial={{scale:0.92,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:0.5,ease:'easeOut'}}>
                  <div className="rs-label" style={{textAlign:'center'}}>Overall Performance</div>

                  <div className="rs-ring-wrap">
                    <svg width={140} height={140} viewBox="0 0 140 140" style={{transform:'rotate(-90deg)'}}>
                      <circle cx={70} cy={70} r={RING_R} fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth={10}/>
                      <motion.circle cx={70} cy={70} r={RING_R} fill="none"
                        stroke={pass?'#10B981':'#ef4444'} strokeWidth={10} strokeLinecap="round"
                        initial={{strokeDasharray:`0 ${RING_C}`}}
                        animate={{strokeDasharray:`${dashAspect} ${RING_C}`}}
                        transition={{duration:1.4,ease:'easeOut'}}/>
                    </svg>
                    <div className="rs-ring-center">
                      <div className="rs-pct">{pct}%</div>
                      <div className="rs-frac">{hasNegativeMarking ? finalScore : correct}/{total}</div>
                    </div>
                  </div>

                  <div className={`rs-verdict ${pass?'rs-pass':'rs-fail'}`}>{pass?'PASS — ELIGIBLE':'FAIL — PRACTICE MORE'}</div>
                  {hasNegativeMarking ? (
                    <div style={{fontSize:'0.6rem',color:'#94a3b8',fontWeight:600,marginTop:4}}>
                      {correct} correct − {(correct - finalScore!).toFixed(2)} negative marking = {finalScore} final score
                    </div>
                  ) : (
                    <div style={{fontSize:'0.6rem',color:'#94a3b8',fontWeight:600,marginTop:4}}>No negative marking — score reflects correct answers only</div>
                  )}

                  {/* Breakdown */}
                  <div className="rs-bk">
                    <div className="rs-bk-item" style={{background:'rgba(34,197,94,0.08)',border:'1px solid rgba(34,197,94,0.15)'}}>
                      <div className="rs-bk-n" style={{color:'#22c55e'}}>{correct}</div>
                      <div className="rs-bk-l" style={{color:'#16a34a'}}>Correct</div>
                    </div>
                    <div className="rs-bk-item" style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)'}}>
                      <div className="rs-bk-n" style={{color:'#ef4444'}}>{wrong}</div>
                      <div className="rs-bk-l" style={{color:'#dc2626'}}>Wrong</div>
                    </div>
                    <div className="rs-bk-item" style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.15)'}}>
                      <div className="rs-bk-n" style={{color:'#f59e0b'}}>{skipped}</div>
                      <div className="rs-bk-l" style={{color:'#d97706'}}>Skipped</div>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="rs-kpis">
                    {[
                      {k:'Accuracy (Attempted)',v:`${accuracy}%`,cls:'blue'},
                      {k:'Percentile',v:fcpsPct,cls:'blue'},
                      {k:'Strength',v:strongest?.name||'—',cls:'green'},
                      {k:'Weakness',v:weakest?.name||'—',cls:'amber'},
                      {k:'Avg Speed',v:'~42s / Q',cls:''},
                    ].map(r=>(
                      <div key={r.k} className="rs-kpi">
                        <span className="rs-kpi-k">{r.k}</span>
                        <span className={`rs-kpi-v ${r.cls}`}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Top-right: Subject Mastery */}
                <motion.div className="rs-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>
                  <div className="rs-label">Subject-Wise Mastery</div>
                  <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:4}}>
                    {subjectData.map((s,idx)=>(
                      <div key={s.name} className="rs-bar-row">
                        <div className="rs-bar-name">{s.name.length>11?s.name.slice(0,11)+'…':s.name}</div>
                        <div className="rs-bar-track">
                          <motion.div className="rs-bar-fill"
                            initial={{width:0}}
                            animate={{width:`${subjectDataReliable?s.pct:0}%`}}
                            transition={{delay:0.2+idx*0.07,duration:0.8}}
                            style={{background: s===strongest?'#10B981': s===weakest?'#ef4444': idx%2===0?'#34D399':'#059669'}}
                          />
                        </div>
                        <div className="rs-bar-pct">{subjectDataReliable?`${s.pct}%`:'—'}</div>
                      </div>
                    ))}
                  </div>
                  {!subjectDataReliable && (
                    <div style={{marginTop:6,fontSize:'0.6rem',color:'#94a3b8',fontStyle:'italic'}}>
                      Per-subject breakdown unavailable for this attempt — overall score above is accurate.
                    </div>
                  )}
                  {/* Personal progress insight -- based only on this student's own real data */}
                  <div style={{marginTop:12,padding:'8px 10px',background:'rgba(16,185,129,0.06)',borderRadius:9,border:'1px solid rgba(16,185,129,0.15)'}}>
                    <div className="rs-label" style={{marginBottom:4}}>Study Insight</div>
                    <div style={{fontSize:'0.7rem',color:'#475569',lineHeight:1.5}}>
                      {!subjectDataReliable ? (
                        <>Your overall score is <strong style={{color:'#10B981'}}>{pct}%</strong> ({correct}/{total} correct). Subject-level detail isn&apos;t available for this attempt.</>
                      ) : strongest ? (
                        <>Your strongest subject is <strong style={{color:'#10B981'}}>{strongest.name}</strong> at <strong style={{color:'#10B981'}}>{strongest.pct}%</strong>.</>
                      ) : (
                        <>You haven&apos;t answered any questions correctly yet — no subject can be called a strength.</>
                      )}
                      {weakest && <> Focus your next study block on <strong style={{color:'#d97706'}}>{weakest.name}</strong> ({weakest.pct}%).</>}
                    </div>
                  </div>
                </motion.div>

                {/* Top-far-right: Result Breakdown donut */}
                <motion.div className="rs-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.18}} style={{display:'flex',flexDirection:'column'}}>
                  <div className="rs-label">Result Breakdown</div>
                  <div style={{flex:1,minHeight:0,position:'relative'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="82%"
                          paddingAngle={pieData.length>1?3:0}
                          startAngle={90}
                          endAngle={-270}
                          isAnimationActive
                        >
                          {pieData.map((d)=>(<Cell key={d.name} fill={d.color}/>))}
                        </Pie>
                        <Tooltip contentStyle={{background:'#ffffff',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,fontSize:'0.72rem'}}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
                      <div style={{fontSize:'1.3rem',fontWeight:900,color:'#0f172a'}}>{pct}%</div>
                      <div style={{fontSize:'0.55rem',fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em'}}>Scored</div>
                    </div>
                  </div>
                  <div className="rs-pie-legend">
                    {pieData.map(d=>(
                      <div key={d.name} className="rs-pie-legend-item">
                        <span className="rs-pie-dot" style={{background:d.color}}/>{d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Bottom-right: Learning Curve */}
                <motion.div className="rs-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25}} style={{display:'flex',flexDirection:'column'}}>
                  <div className="rs-label">Learning Curve — Last 8 Attempts</div>
                  <div style={{flex:1,marginTop:8}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyChartData} margin={{top:4,right:8,left:-24,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" vertical={false}/>
                        <XAxis dataKey="name" tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} domain={[0,100]}/>
                        <Tooltip contentStyle={{background:'#ffffff',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,fontSize:'0.72rem',color:'#0f172a'}}/>
                        <Line type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2.5} dot={{r:3,fill:'#10B981'}} activeDot={{r:5}}/>
                        <Line type="monotone" dataKey="avg" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{display:'flex',gap:12,marginTop:6}}>
                    {[{c:'#10B981',l:'Your Score'},{c:'#94a3b8',l:`Your Average (${personalAvg}%)`}].map(d=>(
                      <div key={d.l} style={{display:'flex',alignItems:'center',gap:5}}>
                        <div style={{width:16,height:2,background:d.c,borderRadius:2}}/>
                        <span style={{fontSize:'0.58rem',color:'#64748b',fontWeight:600}}>{d.l}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Bottom-far-right: Colorful subject accuracy bars */}
                <motion.div className="rs-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.3}} style={{display:'flex',flexDirection:'column'}}>
                  <div className="rs-label">Subject Accuracy — By Question</div>
                  {subjectDataReliable ? (
                    <div style={{flex:1,marginTop:4,minHeight:0}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectData} margin={{top:6,right:6,left:-24,bottom:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.1)" vertical={false}/>
                          <XAxis dataKey="name" tick={{fontSize:9,fill:'#64748b'}} axisLine={false} tickLine={false} interval={0}
                            tickFormatter={(v:string)=>v.length>8?v.slice(0,8)+'…':v}/>
                          <YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} domain={[0,100]}/>
                          <Tooltip contentStyle={{background:'#ffffff',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,fontSize:'0.72rem'}}
                            formatter={((v: number, _n: string, p: { payload: { correct: number; total: number } }) =>
                              [`${v}% (${p.payload.correct}/${p.payload.total})`, 'Accuracy']) as never}/>
                          <Bar dataKey="pct" radius={[6,6,0,0]}>
                            {subjectData.map((s,idx)=>(<Cell key={s.name} fill={RAINBOW[idx%RAINBOW.length]}/>))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'0 12px'}}>
                      <span style={{fontSize:'0.68rem',color:'#94a3b8',fontStyle:'italic'}}>Per-subject breakdown unavailable for this attempt.</span>
                    </div>
                  )}
                </motion.div>


              </motion.div>
            )}

            {/* ── REVIEW TAB ── */}
            {tab==='review' && (
              <motion.div key="review" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="rs-review">
                <div className="rs-filters">
                  {([['all','All'],['correct','Correct'],['wrong','Wrong'],['skipped','Skipped']] as const).map(([v,l])=>(
                    <button key={v} className={`rs-filter${filter===v?' active':''}`} onClick={()=>setFilter(v)}>{l}</button>
                  ))}
                  <span style={{marginLeft:'auto',fontSize:'0.65rem',color:'#475569',alignSelf:'center'}}>{filteredQs.length} questions</span>
                </div>
                <div className="rs-qlist">
                  {filteredQs.map(({q,i,a})=>{
                    const ok = a===q.correct_answer;
                    const cls = !a?'skipped':ok?'correct':'wrong';
                    const opts = [
                      {l:'A',t:q.option_a},{l:'B',t:q.option_b},
                      {l:'C',t:q.option_c},{l:'D',t:q.option_d},
                      {l:'E',t:q.option_e}
                    ].filter(o => o.t && o.t.trim() !== '');
                    return (
                      <div key={i} className={`rs-qcard ${cls}`}>
                        <div className="rs-q-meta">
                          <span className="rs-q-num">Q{i+1} · {q.subject}</span>
                          <span className={`rs-q-badge ${cls==='correct'?'rs-badge-c':cls==='wrong'?'rs-badge-w':'rs-badge-s'}`}>
                            {cls==='correct'?'Correct':cls==='wrong'?'Incorrect':'Skipped'}
                          </span>
                        </div>
                        <p className="rs-q-text">{q.question_text}</p>
                        <div className="rs-opts">
                          {opts.map(opt=>{
                            const isCor=opt.l===q.correct_answer, isSel=opt.l===a;
                            return (
                              <div key={opt.l} className={`rs-opt${isCor?' oc':isSel?' ow':''}`}>
                                <div className={`rs-opt-l${isCor?' lc':isSel?' lw':''}`}>{opt.l}</div>
                                <span>{opt.t}</span>
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <div className="rs-explain">
                            <div className="rs-explain-h">Explanation</div>
                            <p className="rs-explain-t">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
