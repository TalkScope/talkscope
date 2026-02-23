"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Onboarding from "../_components/Onboarding";

type Org  = { id: string; name: string };
type Team = { id: string; name: string; organizationId: string };
type AgentRow = {
  id: string; name: string; email?: string | null;
  team?: { id: string; name: string; organization?: { id: string; name: string } } | null;
  conversationsCount?: number; scoresCount?: number;
};
type Score = {
  createdAt: string; windowSize: number;
  overallScore: number; communicationScore: number;
  conversionScore: number; riskScore: number; coachingPriority: number;
};
type BatchStatusResponse = {
  ok: boolean;
  job: { id: string; scope: string; refId: string; windowSize: number; status: string; percent: number; total: number; progress: number; error?: string | null; createdAt: string; updatedAt: string; };
  counts: { queued: number; running: number; done: number; failed: number; total: number };
  lastFailed: Array<{ agentId: string; agentName?: string | null; error?: string | null }>;
};

function fmt(n: any) { const x = Number(n); return Number.isFinite(x) ? x.toFixed(1) : "—"; }
function clip(s: string, max = 80) { const t = String(s ?? "").replace(/\s+/g," ").trim(); return t.length>max ? t.slice(0,max)+"…" : t; }
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function safeJson(res: Response) {
  const text = await res.text();
  try { return { ok: true, json: JSON.parse(text), text }; }
  catch { return { ok: false, json: null, text }; }
}
function initials(name: string) { return name.split(" ").map(w => w[0]??"").slice(0,2).join("").toUpperCase(); }
function scoreColor(v: number) { if(v>=80) return "var(--ts-success)"; if(v>=60) return "var(--ts-warn)"; return "var(--ts-danger)"; }
function riskColor(v: number)  { if(v>=70) return "var(--ts-danger)"; if(v>=45) return "var(--ts-warn)"; return "var(--ts-success)"; }

export default function DashboardPage() {
  const [orgs,setOrgs] = useState<Org[]>([]);
  const [teams,setTeams] = useState<Team[]>([]);
  const [selectedOrgId,setSelectedOrgId] = useState("");
  const [selectedTeamId,setSelectedTeamId] = useState("");
  const [agents,setAgents] = useState<AgentRow[]>([]);
  const [agentScores,setAgentScores] = useState<Record<string,Score|null>>({});
  const [scopeType,setScopeType] = useState<"team"|"org">("team");
  const [windowSize,setWindowSize] = useState(30);
  const [jobId,setJobId] = useState("");
  const [jobStatus,setJobStatus] = useState<BatchStatusResponse|null>(null);
  const [loadingScope,setLoadingScope] = useState(false);
  const [loadingMeta,setLoadingMeta] = useState(false);
  const [creatingJob,setCreatingJob] = useState(false);
  const [runningJob,setRunningJob] = useState(false);
  const [err,setErr] = useState<string|null>(null);
  const [info,setInfo] = useState<string|null>(null);
  const [batchOpen,setBatchOpen] = useState(false);
  const runTokenRef = useRef(0);

  const activeRefId = useMemo(() => scopeType==="org" ? selectedOrgId : selectedTeamId, [scopeType,selectedOrgId,selectedTeamId]);
  const totals = useMemo(() => ({ agents:agents.length, conversations:agents.reduce((s,a)=>s+(a.conversationsCount??0),0), scoreSnapshots:agents.reduce((s,a)=>s+(a.scoresCount??0),0) }), [agents]);
  const agentById = useMemo(() => { const m=new Map<string,AgentRow>(); agents.forEach(a=>m.set(a.id,a)); return m; }, [agents]);
  const rowsWithScore = useMemo(() => agents.map(a=>({agent:a,score:agentScores[a.id]??null})).filter(x=>x.score), [agents,agentScores]);
  const coachingQueue = useMemo(() => [...rowsWithScore].sort((a,b)=>Number(b.score!.coachingPriority)-Number(a.score!.coachingPriority)).slice(0,10), [rowsWithScore]);
  const highRisk      = useMemo(() => [...rowsWithScore].filter(x=>Number(x.score!.riskScore)>=60).sort((a,b)=>Number(b.score!.riskScore)-Number(a.score!.riskScore)).slice(0,8), [rowsWithScore]);
  const topPerformers = useMemo(() => [...rowsWithScore].sort((a,b)=>Number(b.score!.overallScore)-Number(a.score!.overallScore)).slice(0,8), [rowsWithScore]);
  const lowPerformers = useMemo(() => [...rowsWithScore].sort((a,b)=>Number(a.score!.overallScore)-Number(b.score!.overallScore)).slice(0,8), [rowsWithScore]);
  const avgScore = rowsWithScore.length ? rowsWithScore.reduce((s,x)=>s+Number(x.score!.overallScore),0)/rowsWithScore.length : null;
  const avgRisk  = rowsWithScore.length ? rowsWithScore.reduce((s,x)=>s+Number(x.score!.riskScore),0)/rowsWithScore.length : null;
  const progressPct    = jobStatus?.job?.percent ?? 0;
  const progressDone   = jobStatus?.counts?.done ?? 0;
  const progressQueued = jobStatus?.counts?.queued ?? 0;
  const progressFailed = jobStatus?.counts?.failed ?? 0;
  const isComplete     = jobStatus?.job?.status==="done" || progressPct===100;

  async function loadScope() {
    setLoadingScope(true); setErr(null);
    try {
      const r = await safeJson(await fetch("/api/meta/orgs",{cache:"no-store"}));
      if(!r.ok||!r.json?.ok) throw new Error(r.text||"orgs failed");
      const orgsList:Org[] = r.json.orgs??[];
      setOrgs(orgsList);
      let oid = selectedOrgId||orgsList[0]?.id||""; setSelectedOrgId(oid);
      if(oid){
        const tr = await safeJson(await fetch(`/api/meta/teams?orgId=${oid}`,{cache:"no-store"}));
        const tl:Team[] = tr.json?.teams??[]; setTeams(tl);
        const tid = selectedTeamId||tl[0]?.id||""; setSelectedTeamId(tid);
      }
    } catch(e:any){setErr(e?.message);} finally{setLoadingScope(false);}
  }

  async function loadAgentsAndScores() {
    setLoadingMeta(true); setErr(null);
    try {
      const r = await safeJson(await fetch("/api/meta/agents",{cache:"no-store"}));
      if(!r.ok||!r.json?.ok) throw new Error(r.text||"agents failed");
      const list:AgentRow[] = r.json.agents??[]; setAgents(list);
      const scores:Record<string,Score|null>={};
      const queue=[...list];
      async function worker(){ while(queue.length){ const a=queue.shift(); if(!a)break; try{ const p=await safeJson(await fetch(`/api/meta/agent?id=${a.id}`,{cache:"no-store"})); scores[a.id]=(p.ok&&p.json?.ok)?(p.json.lastScore??null):null; }catch{scores[a.id]=null;} } }
      await Promise.all(Array.from({length:Math.min(6,list.length)},()=>worker()));
      setAgentScores(scores);
    } catch(e:any){setErr(e?.message);} finally{setLoadingMeta(false);}
  }

  async function refreshJobStatus(jid:string) {
    if(!jid) return null;
    const r=await safeJson(await fetch(`/api/batch/score/status?jobId=${jid}`,{cache:"no-store"}));
    if(r.ok&&r.json?.ok) setJobStatus(r.json as BatchStatusResponse);
    return r.json as BatchStatusResponse|null;
  }

  async function createJob() {
    setCreatingJob(true); setErr(null);
    try {
      const r=await safeJson(await fetch("/api/batch/score/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({scope:scopeType,refId:activeRefId,windowSize})}));
      if(!r.ok||!r.json?.ok) throw new Error(r.text||"create failed");
      const jid=r.json.jobId; setJobId(jid); setInfo("Job created");
      await refreshJobStatus(jid); setBatchOpen(true);
    } catch(e:any){setErr(e?.message);} finally{setCreatingJob(false);}
  }

  async function runToCompletion() {
    if(!jobId) return;
    runTokenRef.current+=1; const token=runTokenRef.current;
    setRunningJob(true); setErr(null);
    try {
      for(let i=0;i<80;i++){
        if(runTokenRef.current!==token) break;
        const runRes=await fetch("/api/batch/score/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jobId,take:3})});
        const st=await refreshJobStatus(jobId);
        if(st?.job?.status==="done"||st?.job?.percent===100) break;
        if(!runRes.ok) throw new Error(`Worker ${runRes.status}`);
        await sleep(650);
      }
      setInfo("Scoring complete ✓"); await loadAgentsAndScores();
    } catch(e:any){setErr(e?.message);} finally{setRunningJob(false);}
  }

  useEffect(()=>{ loadScope(); loadAgentsAndScores(); },[]);
  useEffect(()=>{ const h=()=>{ loadAgentsAndScores(); loadScope(); if(jobId)refreshJobStatus(jobId); }; window.addEventListener("ts:refresh",h as any); return()=>window.removeEventListener("ts:refresh",h as any); },[jobId]);
  useEffect(()=>{
    if(!selectedOrgId){setTeams([]);setSelectedTeamId("");return;}
    safeJson(fetch(`/api/meta/teams?orgId=${selectedOrgId}`,{cache:"no-store"}) as any)
      .then(r=>{const l:Team[]=r.json?.teams??[];setTeams(l);if(!l.some(t=>t.id===selectedTeamId))setSelectedTeamId(l[0]?.id??"");})
      .catch(()=>{});
  },[selectedOrgId]);

  const isLoading = loadingMeta||loadingScope;

  // Show onboarding when no orgs exist and loading is done
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const showOnboarding = !isLoading && !onboardingDismissed && orgs.length === 0;

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={() => { setOnboardingDismissed(true); loadScope(); loadAgentsAndScores(); }} />
      )}
      <style>{`
        .ts-kpi-strip{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px;}
        @media(max-width:900px){.ts-kpi-strip{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:560px){.ts-kpi-strip{grid-template-columns:repeat(2,1fr);}}
        .ts-kpi-card{background:var(--ts-surface);border:1px solid var(--ts-border);border-radius:var(--ts-radius-lg);padding:18px 20px;transition:box-shadow 0.15s;}
        .ts-kpi-card:hover{box-shadow:var(--ts-shadow-md);}
        .ts-kpi-label{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--ts-muted);margin-bottom:8px;}
        .ts-kpi-val{font-size:30px;font-weight:900;letter-spacing:-0.04em;line-height:1;}
        .ts-kpi-sub{font-size:12px;color:var(--ts-muted);margin-top:6px;}
        .ts-tables-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px;}
        @media(max-width:860px){.ts-tables-grid{grid-template-columns:1fr;}}
        .ts-table-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--ts-border-soft);}
        .ts-table-head-title{font-size:15px;font-weight:800;}
        .ts-table-head-count{font-size:12px;font-weight:700;padding:2px 10px;border-radius:20px;background:var(--ts-bg-soft);border:1px solid var(--ts-border);color:var(--ts-muted);}
        .ts-dash-row{display:grid;align-items:center;gap:10px;padding:11px 20px;border-bottom:1px solid var(--ts-border-soft);transition:background 0.1s;cursor:pointer;}
        .ts-dash-row:hover{background:rgba(64,97,132,0.04);}
        .ts-dash-row:last-child{border-bottom:none;}
        .ts-coach-row{grid-template-columns:1fr 60px 60px 60px 20px;}
        .ts-risk-row{grid-template-columns:1fr 60px 60px 60px 20px;}
        .ts-top-row{grid-template-columns:1fr 60px 60px 60px 60px 20px;}
        .ts-low-row{grid-template-columns:1fr 60px 60px 60px 20px;}
        .ts-dash-row-agent{display:flex;align-items:center;gap:10px;overflow:hidden;}
        .ts-dash-avatar{width:32px;height:32px;border-radius:9px;flex-shrink:0;background:linear-gradient(135deg,rgba(64,97,132,0.15),rgba(64,97,132,0.4));border:1px solid rgba(64,97,132,0.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--ts-accent);}
        .ts-dash-agent-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ts-accent);}
        .ts-dash-agent-sub{font-size:11px;color:var(--ts-muted);margin-top:1px;}
        .ts-col-headers{display:grid;align-items:center;gap:10px;padding:8px 20px;background:var(--ts-bg-soft);border-bottom:1px solid var(--ts-border-soft);}
        .ts-col-h{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:var(--ts-muted);text-align:right;}
        .ts-col-h:first-child{text-align:left;}
        .ts-batch-panel{background:var(--ts-surface);border:1px solid var(--ts-border);border-radius:var(--ts-radius-lg);overflow:hidden;margin-bottom:24px;}
        .ts-batch-toggle{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;cursor:pointer;user-select:none;transition:background 0.1s;}
        .ts-batch-toggle:hover{background:rgba(64,97,132,0.03);}
        .ts-batch-body{padding:20px;border-top:1px solid var(--ts-border-soft);}
        .ts-batch-controls{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:20px;}
        .ts-batch-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
        @media(max-width:700px){.ts-batch-grid{grid-template-columns:1fr;}}
        .ts-batch-stat{background:var(--ts-bg-soft);border:1px solid var(--ts-border-soft);border-radius:var(--ts-radius-md);padding:14px 16px;}
        .ts-progress-bar{height:6px;background:var(--ts-border-soft);border-radius:3px;margin-top:10px;overflow:hidden;}
        .ts-progress-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--ts-accent),#5ba3d9);transition:width 0.4s ease;}
        .ts-skel{background:var(--ts-border-soft);border-radius:10px;animation:ts-pulse 1.4s ease-in-out infinite;}
        @keyframes ts-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .ts-empty{padding:28px 20px;text-align:center;color:var(--ts-muted);font-size:14px;}
        .ts-success-msg{padding:10px 14px;border-radius:var(--ts-radius-sm);background:rgba(31,122,58,0.08);border:1px solid rgba(31,122,58,0.2);color:var(--ts-success);font-size:13px;font-weight:600;margin-bottom:16px;}
      `}</style>

      <div className="ts-container">
        {/* Head */}
        <div className="ts-pagehead">
          <div>
            <div className="ts-title">Operations Dashboard</div>
            <div className="ts-subtitle">Coaching queue, risk signals, and performance overview</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Link href="/app/upload" className="ts-btn">+ Upload Data</Link>
            <button className="ts-btn ts-btn-primary" onClick={()=>{loadAgentsAndScores();loadScope();}} disabled={isLoading}>
              {isLoading?"Loading…":"Refresh"}
            </button>
          </div>
        </div>

        {err && <div className="ts-alert ts-alert-error" style={{marginBottom:16}}>{err}</div>}
        {info && !err && <div className="ts-success-msg">✓ {info}</div>}

        {/* KPI Strip */}
        <div className="ts-kpi-strip">
          {[
            {label:"Total Agents", val:totals.agents||"—", sub:`${totals.conversations} conversations`, color:undefined},
            {label:"Avg Score",    val:avgScore?avgScore.toFixed(1):"—", sub:`${rowsWithScore.length} scored`, color:avgScore?scoreColor(avgScore):undefined},
            {label:"High Risk",    val:highRisk.length||"0", sub:"risk ≥ 60", color:highRisk.length>0?"var(--ts-danger)":undefined},
            {label:"Urgent Coaching", val:coachingQueue.filter(x=>Number(x.score!.coachingPriority)>=70).length||"0", sub:"priority ≥ 70", color:coachingQueue.filter(x=>Number(x.score!.coachingPriority)>=70).length>0?"var(--ts-warn)":undefined},
            {label:"Avg Risk",     val:avgRisk?avgRisk.toFixed(1):"—", sub:"org-level signal", color:avgRisk?riskColor(avgRisk):undefined},
          ].map(k=>(
            <div key={k.label} className="ts-kpi-card">
              <div className="ts-kpi-label">{k.label}</div>
              <div className="ts-kpi-val" style={{color:k.color||"var(--ts-ink)"}}>{k.val}</div>
              <div className="ts-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Batch Panel */}
        <div className="ts-batch-panel">
          <div className="ts-batch-toggle" onClick={()=>setBatchOpen(o=>!o)}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontWeight:750,fontSize:15,display:"inline-flex",alignItems:"center",gap:6}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Batch Scoring Engine</span>
              {isComplete&&jobId&&<span style={{padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:"rgba(31,122,58,0.1)",border:"1px solid rgba(31,122,58,0.25)",color:"var(--ts-success)"}}>Done ✓</span>}
              {runningJob&&<span style={{padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:"rgba(184,106,0,0.1)",border:"1px solid rgba(184,106,0,0.25)",color:"var(--ts-warn)"}}>Running… {progressPct}%</span>}
            </div>
            <span style={{color:"var(--ts-muted)",fontSize:13}}>{batchOpen?"▲ Collapse":"▼ Expand"}</span>
          </div>

          {batchOpen&&(
            <div className="ts-batch-body">
              <div className="ts-batch-controls">
                {[
                  {label:"Organization", content:<select className="ts-select" value={selectedOrgId} onChange={e=>setSelectedOrgId(e.target.value)}><option value="">Select org</option>{orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>},
                  {label:"Team",         content:<select className="ts-select" value={selectedTeamId} onChange={e=>setSelectedTeamId(e.target.value)} disabled={!selectedOrgId}><option value="">Select team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>},
                  {label:"Scope",        content:<select className="ts-select" value={scopeType} onChange={e=>setScopeType(e.target.value as any)}><option value="team">Team</option><option value="org">Organization</option></select>},
                  {label:"Window",       content:<select className="ts-select" value={windowSize} onChange={e=>setWindowSize(Number(e.target.value))}>{[20,30,50].map(w=><option key={w} value={w}>Last {w}</option>)}</select>},
                ].map(({label,content})=>(
                  <div key={label}>
                    <div className="ts-card-title" style={{marginBottom:6}}>{label}</div>
                    {content}
                  </div>
                ))}
                <div style={{display:"flex",gap:8,alignSelf:"flex-end"}}>
                  <button className="ts-btn" onClick={createJob} disabled={creatingJob||!activeRefId}>{creatingJob?"Creating…":"Create Job"}</button>
                  <button className="ts-btn ts-btn-primary" onClick={runToCompletion} disabled={!jobId||runningJob}>{runningJob?`Running… ${progressPct}%`:isComplete?"Run Again":"Run to 100%"}</button>
                </div>
              </div>

              {jobId&&(
                <div className="ts-batch-grid">
                  <div className="ts-batch-stat">
                    <div className="ts-kpi-label">Progress</div>
                    <div style={{fontSize:28,fontWeight:900,letterSpacing:"-0.04em",color:isComplete?"var(--ts-success)":"var(--ts-accent)"}}>{progressPct}%</div>
                    <div className="ts-progress-bar"><div className="ts-progress-fill" style={{width:`${progressPct}%`}}/></div>
                    <div style={{marginTop:8,fontSize:12,color:"var(--ts-muted)"}}>{progressDone} done · {progressQueued} queued · <span style={{color:progressFailed>0?"var(--ts-danger)":"inherit"}}>{progressFailed} failed</span></div>
                  </div>
                  <div className="ts-batch-stat">
                    <div className="ts-kpi-label">Job ID</div>
                    <div style={{fontFamily:"ui-monospace,monospace",fontSize:11,color:"var(--ts-muted)",marginTop:6,wordBreak:"break-all"}}>{jobId}</div>
                    <div style={{marginTop:8,display:"flex",gap:8}}>
                      <button className="ts-btn" style={{fontSize:12,padding:"0 10px",height:28}} onClick={()=>refreshJobStatus(jobId)}>Refresh</button>
                      <button className="ts-btn" style={{fontSize:12,padding:"0 10px",height:28}} onClick={()=>{setJobId("");setJobStatus(null);}}>Clear</button>
                    </div>
                  </div>
                  <div className="ts-batch-stat">
                    <div className="ts-kpi-label">Last Failures</div>
                    {!jobStatus?.lastFailed?.length
                      ? <div style={{fontSize:13,color:"var(--ts-muted)",marginTop:6}}>No failures ✓</div>
                      : jobStatus.lastFailed.slice(0,4).map((f,i)=>(
                        <div key={i} style={{marginTop:8,fontSize:12}}>
                          <div style={{fontWeight:700}}>{f.agentName||f.agentId}</div>
                          <div style={{color:"var(--ts-danger)",fontSize:11}}>{clip(f.error||"failed")}</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tables */}
        {isLoading&&!rowsWithScore.length ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {[1,2,3,4].map(i=><div key={i} className="ts-skel" style={{height:280}}/>)}
          </div>
        ):(
          <div className="ts-tables-grid">
            {/* Coaching Queue */}
            <div className="ts-card">
              <div className="ts-table-head">
                <div><div className="ts-table-head-title" style={{display:"flex",alignItems:"center",gap:6}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>Coaching Queue</div><div style={{fontSize:12,color:"var(--ts-muted)",marginTop:2}}>Highest priority first</div></div>
                <span className="ts-table-head-count">{coachingQueue.length}</span>
              </div>
              <div className="ts-col-headers ts-coach-row">
                <div className="ts-col-h">Agent</div><div className="ts-col-h">Priority</div><div className="ts-col-h">Overall</div><div className="ts-col-h">Risk</div><div/>
              </div>
              {coachingQueue.length===0 ? <div className="ts-empty">No scores yet — run batch scoring first</div>
                : coachingQueue.map(x=>(
                  <Link key={x.agent.id} href={`/app/agents/${x.agent.id}`} style={{display:"contents",textDecoration:"none"}}>
                    <div className="ts-dash-row ts-coach-row">
                      <div className="ts-dash-row-agent"><div className="ts-dash-avatar">{initials(x.agent.name)}</div><div><div className="ts-dash-agent-name">{x.agent.name}</div><div className="ts-dash-agent-sub">{x.agent.team?.name}</div></div></div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:riskColor(Number(x.score!.coachingPriority))}}>{fmt(x.score!.coachingPriority)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:scoreColor(Number(x.score!.overallScore))}}>{fmt(x.score!.overallScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:riskColor(Number(x.score!.riskScore))}}>{fmt(x.score!.riskScore)}</div>
                      <div style={{color:"var(--ts-accent)",fontSize:12,textAlign:"right"}}>→</div>
                    </div>
                  </Link>
                ))
              }
            </div>

            {/* High Risk */}
            <div className="ts-card">
              <div className="ts-table-head">
                <div><div className="ts-table-head-title" style={{display:"flex",alignItems:"center",gap:6}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>High Risk</div><div style={{fontSize:12,color:"var(--ts-muted)",marginTop:2}}>Risk ≥ 60</div></div>
                <span className="ts-table-head-count" style={{color:highRisk.length>0?"var(--ts-danger)":undefined}}>{highRisk.length}</span>
              </div>
              <div className="ts-col-headers ts-risk-row">
                <div className="ts-col-h">Agent</div><div className="ts-col-h">Risk</div><div className="ts-col-h">Overall</div><div className="ts-col-h">Priority</div><div/>
              </div>
              {highRisk.length===0 ? <div className="ts-empty">No high-risk agents ✓</div>
                : highRisk.map(x=>(
                  <Link key={x.agent.id} href={`/app/agents/${x.agent.id}`} style={{display:"contents",textDecoration:"none"}}>
                    <div className="ts-dash-row ts-risk-row">
                      <div className="ts-dash-row-agent"><div className="ts-dash-avatar">{initials(x.agent.name)}</div><div><div className="ts-dash-agent-name">{x.agent.name}</div><div className="ts-dash-agent-sub">{x.agent.team?.name}</div></div></div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:"var(--ts-danger)"}}>{fmt(x.score!.riskScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:scoreColor(Number(x.score!.overallScore))}}>{fmt(x.score!.overallScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:riskColor(Number(x.score!.coachingPriority))}}>{fmt(x.score!.coachingPriority)}</div>
                      <div style={{color:"var(--ts-accent)",fontSize:12,textAlign:"right"}}>→</div>
                    </div>
                  </Link>
                ))
              }
            </div>

            {/* Top Performers */}
            <div className="ts-card">
              <div className="ts-table-head">
                <div><div className="ts-table-head-title" style={{display:"flex",alignItems:"center",gap:6}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>Top Performers</div><div style={{fontSize:12,color:"var(--ts-muted)",marginTop:2}}>Highest overall score</div></div>
                <span className="ts-table-head-count">{topPerformers.length}</span>
              </div>
              <div className="ts-col-headers ts-top-row">
                <div className="ts-col-h">Agent</div><div className="ts-col-h">Overall</div><div className="ts-col-h">Comm</div><div className="ts-col-h">Conv</div><div className="ts-col-h">Risk</div><div/>
              </div>
              {topPerformers.length===0 ? <div className="ts-empty">No scores yet</div>
                : topPerformers.map(x=>(
                  <Link key={x.agent.id} href={`/app/agents/${x.agent.id}`} style={{display:"contents",textDecoration:"none"}}>
                    <div className="ts-dash-row ts-top-row">
                      <div className="ts-dash-row-agent"><div className="ts-dash-avatar">{initials(x.agent.name)}</div><div><div className="ts-dash-agent-name">{x.agent.name}</div><div className="ts-dash-agent-sub">{x.agent.team?.name}</div></div></div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:scoreColor(Number(x.score!.overallScore))}}>{fmt(x.score!.overallScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:scoreColor(Number(x.score!.communicationScore))}}>{fmt(x.score!.communicationScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:scoreColor(Number(x.score!.conversionScore))}}>{fmt(x.score!.conversionScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:riskColor(Number(x.score!.riskScore))}}>{fmt(x.score!.riskScore)}</div>
                      <div style={{color:"var(--ts-accent)",fontSize:12,textAlign:"right"}}>→</div>
                    </div>
                  </Link>
                ))
              }
            </div>

            {/* Low Performers */}
            <div className="ts-card">
              <div className="ts-table-head">
                <div><div className="ts-table-head-title">📉 Need Attention</div><div style={{fontSize:12,color:"var(--ts-muted)",marginTop:2}}>Lowest overall score</div></div>
                <span className="ts-table-head-count">{lowPerformers.length}</span>
              </div>
              <div className="ts-col-headers ts-low-row">
                <div className="ts-col-h">Agent</div><div className="ts-col-h">Overall</div><div className="ts-col-h">Risk</div><div className="ts-col-h">Priority</div><div/>
              </div>
              {lowPerformers.length===0 ? <div className="ts-empty">No scores yet</div>
                : lowPerformers.map(x=>(
                  <Link key={x.agent.id} href={`/app/agents/${x.agent.id}`} style={{display:"contents",textDecoration:"none"}}>
                    <div className="ts-dash-row ts-low-row">
                      <div className="ts-dash-row-agent"><div className="ts-dash-avatar">{initials(x.agent.name)}</div><div><div className="ts-dash-agent-name">{x.agent.name}</div><div className="ts-dash-agent-sub">{x.agent.team?.name}</div></div></div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:scoreColor(Number(x.score!.overallScore))}}>{fmt(x.score!.overallScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:riskColor(Number(x.score!.riskScore))}}>{fmt(x.score!.riskScore)}</div>
                      <div style={{textAlign:"right",fontWeight:750,fontSize:14,color:riskColor(Number(x.score!.coachingPriority))}}>{fmt(x.score!.coachingPriority)}</div>
                      <div style={{color:"var(--ts-accent)",fontSize:12,textAlign:"right"}}>→</div>
                    </div>
                  </Link>
                ))
              }
            </div>
          </div>
        )}

        {/* Empty state */}
        {!rowsWithScore.length&&!isLoading&&(
          <div className="ts-card" style={{marginTop:24,textAlign:"center",padding:"40px 24px"}}>
            <div style={{fontSize:36,marginBottom:14}}>🚀</div>
            <div style={{fontWeight:750,fontSize:16,marginBottom:8}}>Ready to score your team?</div>
            <div className="ts-muted" style={{fontSize:14,marginBottom:24}}>Expand Batch Scoring Engine above, select scope and click Run to 100%.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button className="ts-btn ts-btn-primary" onClick={()=>setBatchOpen(true)}>Open Batch Engine</button>
              <Link href="/app/upload" className="ts-btn">Import Data First</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
