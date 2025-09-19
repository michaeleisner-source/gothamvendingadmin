/*
New Location Workflow — Gotham Vending (Pro)
Route: /workflows/new-location

Simplified version that works with the existing database schema
*/

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

// ---------- Types ----------
export type PipelineStage = 'lead'|'surveyed'|'proposed'|'contracted'|'ordered'|'planogram'|'scheduled'|'installed'|'live'

interface LeadForm {
  name?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  location_type?: string
  estimated_foot_traffic?: number
  company?: string
  phone?: string
  email?: string
  follow_up_date?: string
  notes?: string
  contact_method?: string
  fit_score?: number
  status?: string
}

interface SurveyForm {
  visit_date?: string
  power_outlets_count?: number
  network_type?: string
  entrance_width_cm?: number
  elevator_access?: boolean
  parking?: boolean
  recommended_machine_type?: 'Snack' | 'Beverage' | 'Combo'
  recommended_machine_count?: number
  constraints?: string
  earliest_install_date?: string
}

interface ContractForm {
  commission_rate?: number
  service_level?: string
  placement_fee?: number
  term_months?: number
  target_install_date?: string
  status?: 'draft' | 'sent' | 'signed' | 'declined'
}

// ---------- Helpers ----------
function computeFitScore(input: LeadForm): number {
  const traffic = input.estimated_foot_traffic || 0
  const base = Math.min(100, (traffic / 25) + 40)
  return Math.max(0, Math.min(100, Math.round(base)))
}

// Debounce util
function debounce<F extends (...args: any[]) => void>(fn: F, delay = 500) {
  let t: any
  return (...args: Parameters<F>) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

// ---------- Main Component ----------
export default function NewLocationWorkflow() {
  console.log("Advanced NewLocationWorkflow component loaded!");
  
  // ids & stage
  const [leadId, setLeadId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [stage, setStage] = useState<PipelineStage>('lead')

  // forms
  const [lead, setLead] = useState<LeadForm>({ fit_score: 50, status: 'new' })
  const [survey, setSurvey] = useState<SurveyForm>({ recommended_machine_type: 'Combo', recommended_machine_count: 1 })
  const [contract, setContract] = useState<ContractForm>({ status: 'draft', term_months: 12, commission_rate: 10 })

  // ----- Resume via URL
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('leadId')
    if (!id) return
    ;(async () => {
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single()
      if (error || !data) return
      setLeadId(id)
      setLead({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        location_type: data.location_type,
        estimated_foot_traffic: data.estimated_foot_traffic,
        company: data.company,
        phone: data.phone,
        email: data.email,
        follow_up_date: data.follow_up_date,
        notes: data.notes,
        contact_method: data.contact_method,
        fit_score: data.fit_score,
        status: data.status,
      })
      // Set stage based on lead status or other criteria
      if (data.status === 'qualified') setStage('surveyed')
      else if (data.status === 'contacted') setStage('proposed') 
      else setStage('lead')
    })()
  }, [])

  // ----- Autosave helpers
  const ensureLead = useCallback(async () => {
    if (leadId) return leadId
    const { data, error } = await supabase.from('leads').insert({ 
      name: lead.name || 'New Lead',
      address: lead.address || 'Address TBD',
      city: lead.city || 'City TBD',
      state: lead.state || '',
      zip_code: lead.zip_code || '',
      location_type: lead.location_type || 'Office',
      estimated_foot_traffic: lead.estimated_foot_traffic || 0,
      company: lead.company || '',
      phone: lead.phone || '',
      email: lead.email || '',
      notes: lead.notes || '',
      contact_method: lead.contact_method || 'Email',
      fit_score: computeFitScore(lead),
      status: 'new'
    }).select('id').single()
    if (error) throw error
    setLeadId(data.id)
    return data.id as string
  }, [lead, leadId])

  const saveLeadPatch = useMemo(() => debounce(async (patch: Partial<LeadForm>) => {
    try {
      const id = await ensureLead()
      await supabase.from('leads').update({ 
        ...patch, 
        fit_score: computeFitScore({...lead, ...patch})
      }).eq('id', id)
    } catch (e) { /* swallow */ }
  }, 600), [ensureLead, lead])

  const setAndSaveLead = (patch: Partial<LeadForm>) => {
    setLead(prev => ({ ...prev, ...patch }))
    saveLeadPatch(patch)
  }

  // ----- AI Coach (local heuristic)
  function aiHints() {
    const hints: { title: string; detail?: string }[] = []
    const fit = computeFitScore(lead)
    if (!lead.name || !lead.address) hints.push({ title: 'Add property name & address to lock the lead.' })
    if ((lead.estimated_foot_traffic||0) < 50) hints.push({ title: 'Low foot traffic: consider beverage-only machine.', detail: 'Start with 1 compact combo machine; revisit after 30 days of sales.' })
    if ((lead.estimated_foot_traffic||0) >= 200) hints.push({ title: 'High traffic: consider multiple machines.', detail: 'One beverage-heavy + one snack/healthy mix near entrances.' })
    if (fit >= 70) hints.push({ title: 'Strong fit score — fast-track to proposal.' })
    return hints
  }

  // ----- Step requirements & progress
  const requirements: Record<PipelineStage, (() => boolean)[]> = {
    lead: [() => !!lead.name, () => !!lead.address, () => !!lead.phone],
    surveyed: [() => !!survey.visit_date],
    proposed: [() => contract.status !== 'declined'],
    contracted: [() => contract.status === 'signed'],
    ordered: [() => true],
    planogram: [() => true],
    scheduled: [() => true],
    installed: [() => true],
    live: [() => true],
  }
  
  const steps = [
    { key:'lead' as PipelineStage, label:'Lead Intake', blurb:'Capture basics and qualify.' },
    { key:'surveyed' as PipelineStage, label:'Site Survey', blurb:'Schedule + record on-site constraints.' },
    { key:'proposed' as PipelineStage, label:'Proposal', blurb:'Configure revenue split and SLA.' },
    { key:'contracted' as PipelineStage, label:'Contract', blurb:'Mark e-sign status; auto-create Location.' },
    { key:'ordered' as PipelineStage, label:'Machine Order', blurb:'Select vendor/model; set expected delivery.' },
    { key:'planogram' as PipelineStage, label:'Planogram', blurb:'Auto-generate mix; fine-tune slots.' },
    { key:'scheduled' as PipelineStage, label:'Delivery', blurb:'Book window + route.' },
    { key:'installed' as PipelineStage, label:'Install', blurb:'Assign machine and activate telemetry.' },
    { key:'live' as PipelineStage, label:'Go‑Live', blurb:'Create restock/cash schedules; monitor.' },
  ]
  const currentIndex = steps.findIndex(s => s.key === stage)
  const percent = Math.round(((currentIndex+1) / steps.length) * 100)

  // ----- Actions for each step
  async function nextFromLead() {
    await ensureLead(); setStage('surveyed')
  }
  async function saveSurvey() {
    setStage('proposed')
  }
  async function saveProposal() {
    if (contract.status === 'signed') {
      setStage('contracted')
    } else {
      setStage('proposed')
    }
  }

  // ----- UI pieces -----
  function LeftTimeline() {
    return (
      <aside className="space-y-2">
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Pipeline</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-sm font-semibold capitalize">{stage}</div>
            <div className="text-xs text-muted-foreground">{percent}%</div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2"><div className="bg-primary h-2 rounded-full" style={{width: `${percent}%`}}/></div>
        </div>
        <ol className="bg-card border rounded-2xl divide-y divide-border">
          {steps.map((s, idx) => {
            const done = idx < currentIndex
            const active = s.key === stage
            return (
              <li key={s.key} className={`p-3 cursor-pointer ${active ? 'bg-primary/10' : ''}`} onClick={() => setStage(s.key)}>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{idx+1}</div>
                  <div>
                    <div className="text-sm font-medium">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.blurb}</div>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </aside>
    )
  }

  function AiCoach() {
    const hints = aiHints()
    return (
      <aside className="space-y-3">
        <div className="bg-primary/10 border border-primary/40 rounded-2xl p-4">
          <div className="text-sm font-semibold">AI Coach</div>
          <ul className="mt-2 space-y-2 text-sm">
            {hints.map((h,i)=> <li key={i} className="leading-snug"><span className="font-medium">• {h.title}</span>{h.detail ? <> — <span className="text-muted-foreground">{h.detail}</span></> : null}</li>)}
            {hints.length===0 && <li className="text-muted-foreground">Looking good. Proceed to the next step.</li>}
          </ul>
        </div>
        <div className="bg-card border rounded-2xl p-4 text-sm">
          <div className="font-semibold">Next Best Action</div>
          <div className="mt-2 text-muted-foreground">
            {stage==='lead' && 'Schedule a site survey and confirm network power.'}
            {stage==='surveyed' && 'Draft proposal with a fair split and target install date.'}
            {stage==='proposed' && 'Get signature; then the Location record will be created.'}
            {stage==='contracted' && 'Select machine model and order date.'}
            {stage==='ordered' && 'Generate planogram from client base.'}
            {stage==='planogram' && 'Book delivery window and route.'}
            {stage==='scheduled' && 'Prepare install kit and activate telemetry on-site.'}
            {stage==='installed' && 'Run test vends and mark Go‑Live.'}
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-4 text-sm">
          <div className="font-semibold">Fit Score</div>
          <div className="mt-2 text-2xl font-bold">{Math.round(computeFitScore(lead))}/100</div>
        </div>
      </aside>
    )
  }

  // ---- Step UIs
  function StepLead() {
    const fit = computeFitScore(lead)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3">Basics</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="input" placeholder="Property Name" value={lead.name||''} onChange={e=>setAndSaveLead({name:e.target.value})}/>
              <input className="input" placeholder="Address" value={lead.address||''} onChange={e=>setAndSaveLead({address:e.target.value})}/>
              <input className="input" placeholder="City" value={lead.city||''} onChange={e=>setAndSaveLead({city:e.target.value})}/>
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="State" value={lead.state||''} onChange={e=>setAndSaveLead({state:e.target.value})}/>
                <input className="input" placeholder="ZIP" value={lead.zip_code||''} onChange={e=>setAndSaveLead({zip_code:e.target.value})}/>
              </div>
              <select className="input" value={lead.location_type||''} onChange={e=>setAndSaveLead({location_type:e.target.value})}>
                <option value="">Location Type</option>
                <option>Office</option><option>School</option><option>Hospital</option><option>Gym</option><option>Warehouse</option><option>Apartment</option><option>Mixed</option>
              </select>
              <input className="input" type="number" placeholder="Est. Foot Traffic / day" value={lead.estimated_foot_traffic||''} onChange={e=>setAndSaveLead({estimated_foot_traffic:Number(e.target.value)})}/>
            </div>
          </div>
          <div className="bg-card border rounded-2xl p-4">
            <div className="text-sm font-semibold mb-3">Contact</div>
            <div className="grid grid-cols-1 gap-3">
              <input className="input" placeholder="Company" value={lead.company||''} onChange={e=>setAndSaveLead({company:e.target.value})}/>
              <input className="input" placeholder="Phone" value={lead.phone||''} onChange={e=>setAndSaveLead({phone:e.target.value})}/>
              <input className="input" placeholder="Email" value={lead.email||''} onChange={e=>setAndSaveLead({email:e.target.value})}/>
              <input className="input" type="date" placeholder="Follow Up Date" value={lead.follow_up_date||''} onChange={e=>setAndSaveLead({follow_up_date:e.target.value})}/>
              <select className="input" value={lead.contact_method||''} onChange={e=>setAndSaveLead({contact_method:e.target.value})}>
                <option value="">Contact Method</option>
                <option>Email</option><option>Phone</option><option>In Person</option>
              </select>
            </div>
            <textarea className="input mt-3" placeholder="Notes" value={lead.notes||''} onChange={e=>setAndSaveLead({notes:e.target.value})}/>
            <div className="mt-3 text-sm">Fit Score: <span className="font-semibold">{fit}</span></div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Autosaved</div>
          <button className="btn-primary" onClick={nextFromLead}>Save & Continue</button>
        </div>
      </div>
    )
  }

  function StepSurvey() {
    return (
      <div className="space-y-4">
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3">Schedule & Constraints</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="input" type="date" value={survey.visit_date||''} onChange={e=>setSurvey({...survey, visit_date:e.target.value})}/>
            <select className="input" value={survey.network_type||''} onChange={e=>setSurvey({...survey, network_type:e.target.value})}><option value="">Network</option><option>Cellular</option><option>WiFi</option><option>None</option></select>
            <input className="input" type="number" placeholder="# Power Outlets" value={survey.power_outlets_count||''} onChange={e=>setSurvey({...survey, power_outlets_count:Number(e.target.value)})}/>
            <input className="input" type="number" placeholder="Entrance Width (cm)" value={survey.entrance_width_cm||''} onChange={e=>setSurvey({...survey, entrance_width_cm:Number(e.target.value)})}/>
            <label className="checkbox"><input type="checkbox" checked={!!survey.elevator_access} onChange={e=>setSurvey({...survey, elevator_access:e.target.checked})}/> Elevator Access</label>
            <label className="checkbox"><input type="checkbox" checked={!!survey.parking} onChange={e=>setSurvey({...survey, parking:e.target.checked})}/> Parking</label>
            <select className="input" value={survey.recommended_machine_type||'Combo'} onChange={e=>setSurvey({...survey, recommended_machine_type: e.target.value as any})}><option>Snack</option><option>Beverage</option><option>Combo</option></select>
            <input className="input" type="number" placeholder="# of Machines" value={survey.recommended_machine_count||''} onChange={e=>setSurvey({...survey, recommended_machine_count:Number(e.target.value)})}/>
            <input className="input" type="date" placeholder="Earliest Install" value={survey.earliest_install_date||''} onChange={e=>setSurvey({...survey, earliest_install_date:e.target.value})}/>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button className="btn-secondary" onClick={()=>setStage('lead')}>Back</button>
          <button className="btn-primary" onClick={saveSurvey}>Save & Continue</button>
        </div>
      </div>
    )
  }

  function StepProposal() {
    return (
      <div className="space-y-4">
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-sm font-semibold mb-3">Proposal Settings</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="input" type="number" placeholder="Commission %" value={contract.commission_rate||''} onChange={e=>setContract({...contract, commission_rate:Number(e.target.value)})}/>
            <input className="input" placeholder="Service Level (SLA)" value={contract.service_level||''} onChange={e=>setContract({...contract, service_level:e.target.value})}/>
            <input className="input" type="number" placeholder="Placement Fee" value={contract.placement_fee||''} onChange={e=>setContract({...contract, placement_fee:Number(e.target.value)})}/>
            <input className="input" type="number" placeholder="Term (months)" value={contract.term_months||''} onChange={e=>setContract({...contract, term_months:Number(e.target.value)})}/>
            <input className="input" type="date" placeholder="Target Install" value={contract.target_install_date||''} onChange={e=>setContract({...contract, target_install_date:e.target.value})}/>
            <select className="input" value={contract.status||'draft'} onChange={e=>setContract({...contract, status:e.target.value as any})}><option>draft</option><option>sent</option><option>signed</option><option>declined</option></select>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">On <span className="text-foreground font-semibold">signed</span>, a Location record will be created.</div>
        </div>
        <div className="flex items-center justify-between">
          <button className="btn-secondary" onClick={()=>setStage('surveyed')}>Back</button>
          <button className="btn-primary" onClick={saveProposal}>Save & Continue</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-6 text-foreground">
      <nav className="text-xs text-muted-foreground mb-3"><a className="underline" href="#/dashboard">Dashboard</a> <span className="mx-1">/</span> Workflows <span className="mx-1">/</span> New Location</nav>
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">New Location Workflow</h1>
          <div className="text-sm text-muted-foreground">Guide a prospect from initial lead to live machines. Progress is saved automatically. Resume via <code>?leadId=...</code>.</div>
        </div>
        <a href="#/workflows/pipeline" className="px-3 py-2 rounded-xl border border-border hover:bg-accent text-sm">Open Pipeline Kanban</a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-5">
        <LeftTimeline />

        <main>
          {stage==='lead' && <StepLead />}
          {stage==='surveyed' && <StepSurvey />}
          {stage==='proposed' && <StepProposal />}
          {stage!=='lead' && stage!=='surveyed' && stage!=='proposed' && (
            <div className="bg-card border rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Workflow Step: {stage}</h2>
              <p className="text-muted-foreground">Additional steps are being built...</p>
            </div>
          )}
        </main>

        <AiCoach />
      </div>

      <style>{`
        .input { 
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          width: 100%;
        }
        .input:focus {
          outline: none;
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsla(var(--ring), 0.2);
        }
        .input::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .btn-primary { 
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }
        .btn-primary:hover { 
          background: hsl(var(--primary) / 0.9); 
        }
        .btn-secondary { 
          background: transparent;
          color: hsl(var(--foreground));
          padding: 0.5rem 1rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
          cursor: pointer;
        }
        .btn-secondary:hover { 
          background: hsl(var(--accent)); 
        }
        .checkbox { 
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  )
}