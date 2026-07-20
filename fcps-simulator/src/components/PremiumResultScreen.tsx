"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from "recharts";

/* ── Types ─────────────────────────────────────── */
interface Question {
  id: string; question_text: string; correct_answer: string; subject: string;
  option_a?: string|null; option_b?: string|null; option_c?: string|null;
  option_d?: string|null; option_e?: string|null; explanation?: string|null;
}
interface Props { questions: Question[]; answers: (string|null)[]; subject: string; mode: string; }

/* ── Styles (scoped) ────────────────────────────── */
const S = `
.rs-root{height:100vh;width:100vw;display:flex;flex-direction:column;background:#f0fdfa;color:#0f172a;font-family:'Inter',system-ui,sans-serif;overflow:hidden}
.rs-header{flex-shrink:0;height:52px;background:#ffffff;border-bottom:2px solid #0d9488;display:flex;align-items:center;justify-content:space-between;padding:0 28px;box-shadow:0 2px 12px rgba(13,148,136,0.08)}
.rs-logo{font-size:0.78rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0f172a}
.rs-logo span{color:#0d9488;margin-right:6px}
.rs-tabs{display:flex;gap:2px;background:rgba(13,148,136,0.08);border-radius:8px;padding:3px}
.rs-tab{padding:5px 16px;border-radius:6px;font-size:0.72rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;cursor:pointer;border:none;background:transparent;color:#64748b;transition:all 0.2s}
.rs-tab.active{background:#ffffff;color:#0d9488;box-shadow:0 1px 4px rgba(13,148,136,0.15)}
.rs-hbtns{display:flex;gap:8px}
.rs-btn{padding:6px 16px;border-radius:8px;font-size:0.7rem;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;transition:all 0.2s;text-decoration:none;display:flex;align-items:center}
.rs-btn:hover{background:#f0fdfa;border-color:#0d9488;color:#0d9488}
.rs-btn.primary{background:linear-gradient(135deg,#0f766e,#0d9488);border-color:#0d9488;color:white;box-shadow:0 4px 14px rgba(13,148,136,0.3)}
.rs-btn.primary:hover{background:linear-gradient(135deg,#0d9488,#14b8a6);box-shadow:0 6px 20px rgba(13,148,136,0.4)}
.rs-body{flex:1;overflow:hidden}
/* Dashboard grid */
.rs-dash{height:100%;display:grid;grid-template-columns:260px 1fr;grid-template-rows:1fr 1fr;gap:10px;padding:10px}
.rs-card{background:#ffffff;border:1px solid rgba(13,148,136,0.12);border-radius:14px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.04);transition:transform 0.2s,box-shadow 0.2s}
.rs-card:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(13,148,136,0.1)}
.rs-label{font-size:0.58rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0d9488;margin-bottom:4px}
.rs-val{font-size:1.8rem;font-weight:900;line-height:1;color:#0f172a}
.rs-sub{font-size:0.65rem;color:#64748b;margin-top:2px;font-weight:500}
/* Score card */
.rs-score-card{grid-row:1/3;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:20px 16px;background:radial-gradient(ellipse at top,rgba(13,148,136,0.08) 0%,rgba(255,255,255,0) 70%),#ffffff}
.rs-ring-wrap{position:relative;width:140px;height:140px;flex-shrink:0}
.rs-ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.rs-pct{font-size:2.2rem;font-weight:900;color:#0f172a;line-height:1}
.rs-frac{font-size:0.72rem;color:#64748b;font-weight:600;margin-top:2px}
.rs-verdict{padding:5px 14px;border-radius:20px;font-size:0.65rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase}
.rs-pass{background:rgba(13,148,136,0.1);color:#0f766e;border:1px solid rgba(13,148,136,0.25)}
.rs-fail{background:rgba(239,68,68,0.08);color:#dc2626;border:1px solid rgba(239,68,68,0.2)}
.rs-kpis{width:100%;display:flex;flex-direction:column;gap:5px}
.rs-kpi{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9}
.rs-kpi-k{font-size:0.6rem;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em}
.rs-kpi-v{font-size:0.8rem;font-weight:800;color:#0f172a}
.rs-kpi-v.green{color:#0f766e}.rs-kpi-v.red{color:#dc2626}.rs-kpi-v.amber{color:#d97706}.rs-kpi-v.blue{color:#0d9488}
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
.rs-filter.active{border-color:#0d9488;color:#0f766e;background:rgba(13,148,136,0.08)}
.rs-qlist{flex:1;overflow-y:auto;padding:10px 14px;display:flex;flex-direction:column;gap:10px;background:#f0fdfa}
.rs-qcard{background:#ffffff;border-radius:12px;padding:14px 16px;border-left:3px solid transparent;box-shadow:0 1px 6px rgba(0,0,0,0.04)}
.rs-qcard.correct{border-left-color:#0d9488;background:#f0fdfa}
.rs-qcard.wrong{border-left-color:#ef4444;background:#fff8f8}
.rs-qcard.skipped{border-left-color:#d97706;background:#fffbeb}
.rs-q-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.rs-q-num{font-size:0.6rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em}
.rs-q-badge{font-size:0.55rem;font-weight:800;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:0.08em}
.rs-badge-c{background:rgba(13,148,136,0.1);color:#0f766e}
.rs-badge-w{background:rgba(239,68,68,0.1);color:#dc2626}
.rs-badge-s{background:rgba(217,119,6,0.1);color:#d97706}
.rs-q-text{font-size:0.82rem;font-weight:600;color:#1e293b;line-height:1.55;margin-bottom:10px}
.rs-opts{display:flex;flex-direction:column;gap:4px}
.rs-opt{display:flex;gap:8px;align-items:flex-start;padding:5px 8px;border-radius:7px;font-size:0.75rem;color:#64748b;background:#f8fafc;width:100%}
.rs-opt.oc{background:rgba(13,148,136,0.08);color:#0f766e}.rs-opt.ow{background:rgba(239,68,68,0.08);color:#dc2626}
.rs-opt-l{width:20px;height:20px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:0.62rem;font-weight:800;flex-shrink:0;background:#e2e8f0;color:#64748b}
.rs-opt-l.lc{background:#0d9488;color:#fff}.rs-opt-l.lw{background:#ef4444;color:#fff}
.rs-explain{margin-top:8px;padding:8px 10px;background:rgba(13,148,136,0.05);border-radius:8px;border-left:2px solid #0d9488}
.rs-explain-h{font-size:0.55rem;font-weight:800;color:#0d9488;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px}
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

const MOCK_HISTORY = [62,58,71,65,74,70,78,0].map((score,i)=>({ name:`E${i+1}`, score: i===7?undefined:score, avg:65 }));

const RING_R = 52;
const RING_C = 2*Math.PI*RING_R;

/* ── Component ──────────────────────────────────── */
export default function PremiumResultScreen({ questions, answers, subject, mode }: Props) {
  const [tab, setTab] = useState<'dash'|'review'>('dash');
  const [filter, setFilter] = useState<'all'|'correct'|'wrong'|'skipped'>('all');
  const [mounted, setMounted] = useState(false);
  useEffect(()=>setMounted(true),[]);

  const { correct, wrong, skipped, total } = calcStats(questions, answers);
  const pct = Math.round((correct/total)*100);
  const pass = pct >= 60;
  const subjectData = calcSubjects(questions, answers);
  const strongest = subjectData[0];
  const weakest   = subjectData[subjectData.length-1];
  const negMarks  = (wrong*0.25).toFixed(2);
  const adjScore  = (correct - wrong*0.25).toFixed(1);
  const fcpsPct   = pct >= 80 ? 'Top 10%' : pct >= 70 ? 'Top 25%' : pct >= 60 ? 'Top 40%' : 'Bottom 50%';

  const historyData = MOCK_HISTORY.map((d,i) => i===7 ? {...d, score: pct} : d);
  const dashAspect = (RING_C*(pct/100)).toFixed(1);

  const filteredQs = questions.map((q,i)=>({q,i,a:answers[i]})).filter(({q,i,a})=>{
    if(filter==='correct') return a===q.correct_answer;
    if(filter==='wrong')   return a && a!==q.correct_answer;
    if(filter==='skipped') return !a;
    return true;
  });

  if(!mounted) return null;

  return (
    <>
      <style>{S}</style>
      <div className="rs-root">

        {/* Header */}
        <header className="rs-header">
          <div className="rs-logo"><span>FCPS</span>Performance Report</div>
          <div className="rs-tabs">
            {(['dash','review'] as const).map(t=>(
              <button key={t} className={`rs-tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>
                {t==='dash'?'Analytics':'Question Review'}
              </button>
            ))}
          </div>
          <div className="rs-hbtns">
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
                      <circle cx={70} cy={70} r={RING_R} fill="none" stroke="rgba(13,148,136,0.1)" strokeWidth={10}/>
                      <motion.circle cx={70} cy={70} r={RING_R} fill="none"
                        stroke={pass?'#0d9488':'#ef4444'} strokeWidth={10} strokeLinecap="round"
                        initial={{strokeDasharray:`0 ${RING_C}`}}
                        animate={{strokeDasharray:`${dashAspect} ${RING_C}`}}
                        transition={{duration:1.4,ease:'easeOut'}}/>
                    </svg>
                    <div className="rs-ring-center">
                      <div className="rs-pct">{pct}%</div>
                      <div className="rs-frac">{correct}/{total}</div>
                    </div>
                  </div>

                  <div className={`rs-verdict ${pass?'rs-pass':'rs-fail'}`}>{pass?'PASS — ELIGIBLE':'FAIL — PRACTICE MORE'}</div>

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
                      {k:'Adjusted Score',v:`${adjScore} / ${total}`,cls:'blue'},
                      {k:'Negative Marks',v:`−${negMarks}`,cls:'red'},
                      {k:'FCPS Percentile',v:fcpsPct,cls:'blue'},
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
                            animate={{width:`${s.pct}%`}}
                            transition={{delay:0.2+idx*0.07,duration:0.8}}
                            style={{background: s===strongest?'#0d9488': s===weakest?'#ef4444': idx%2===0?'#14b8a6':'#0f766e'}}
                          />
                        </div>
                        <div className="rs-bar-pct">{s.pct}%</div>
                      </div>
                    ))}
                  </div>
                  {/* Topper comparison */}
                  <div style={{marginTop:12,padding:'8px 10px',background:'rgba(13,148,136,0.06)',borderRadius:9,border:'1px solid rgba(13,148,136,0.15)'}}>
                    <div className="rs-label" style={{marginBottom:4}}>Topper Benchmark</div>
                    <div style={{fontSize:'0.7rem',color:'#475569',lineHeight:1.5}}>
                      Top performers scored <strong style={{color:'#0f172a'}}>92%</strong> in {strongest?.name}.
                      Your score: <strong style={{color:'#0d9488'}}>{strongest?.pct}%</strong>.
                      {weakest && <> Focus next study block on <strong style={{color:'#d97706'}}>{weakest.name}</strong> ({weakest.pct}%).</>}
                    </div>
                  </div>
                </motion.div>

                {/* Bottom-right: Learning Curve */}
                <motion.div className="rs-card" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.25}} style={{display:'flex',flexDirection:'column'}}>
                  <div className="rs-label">Learning Curve — Last 8 Attempts</div>
                  <div style={{flex:1,marginTop:8}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData} margin={{top:4,right:8,left:-24,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,148,136,0.1)" vertical={false}/>
                        <XAxis dataKey="name" tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:10,fill:'#64748b'}} axisLine={false} tickLine={false} domain={[0,100]}/>
                        <Tooltip contentStyle={{background:'#ffffff',border:'1px solid rgba(13,148,136,0.2)',borderRadius:8,fontSize:'0.72rem',color:'#0f172a'}}/>
                        <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={2.5} dot={{r:3,fill:'#0d9488'}} activeDot={{r:5}}/>
                        <Line type="monotone" dataKey="avg" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{display:'flex',gap:12,marginTop:6}}>
                    {[{c:'#0d9488',l:'Your Score'},{c:'#94a3b8',l:'Cohort Avg (65%)'}].map(d=>(
                      <div key={d.l} style={{display:'flex',alignItems:'center',gap:5}}>
                        <div style={{width:16,height:2,background:d.c,borderRadius:2}}/>
                        <span style={{fontSize:'0.58rem',color:'#64748b',fontWeight:600}}>{d.l}</span>
                      </div>
                    ))}
                  </div>
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
