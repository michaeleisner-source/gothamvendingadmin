import React, { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export default function NewLocationWorkflow() {
  console.log("Advanced NewLocationWorkflow component loaded!");
  
  const [stage, setStage] = useState<'lead'|'survey'|'contract'>('lead')
  const [lead, setLead] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    company: '',
    phone: '',
    email: '',
    estimated_foot_traffic: 0,
    notes: ''
  })

  const steps = [
    { key: 'lead', label: 'Lead Intake', blurb: 'Capture basics and qualify.' },
    { key: 'survey', label: 'Site Survey', blurb: 'Schedule + record constraints.' },
    { key: 'contract', label: 'Contract', blurb: 'Finalize agreement terms.' }
  ]

  const currentIndex = steps.findIndex(s => s.key === stage)
  const percent = Math.round(((currentIndex + 1) / steps.length) * 100)

  async function saveLead() {
    const { data, error } = await supabase.from('leads').insert({
      name: lead.name || 'New Lead',
      address: lead.address || 'Address TBD',
      city: lead.city || 'City TBD',
      state: lead.state,
      zip_code: lead.zip_code,
      location_type: 'Office',
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      estimated_foot_traffic: lead.estimated_foot_traffic,
      notes: lead.notes,
      status: 'new'
    }).select('id').single()
    if (!error) setStage('survey')
  }

  // Timeline sidebar
  function LeftTimeline() {
    return (
      <aside className="space-y-2">
        <div className="bg-card border rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Pipeline</div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-sm font-semibold capitalize">{stage}</div>
            <div className="text-xs text-muted-foreground">{percent}%</div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div className="bg-primary h-2 rounded-full" style={{width: `${percent}%`}}/>
          </div>
        </div>
        <ol className="bg-card border rounded-2xl divide-y divide-border">
          {steps.map((s, idx) => {
            const done = idx < currentIndex
            const active = s.key === stage
            return (
              <li key={s.key} className={`p-3 cursor-pointer ${active ? 'bg-primary/10' : ''}`} onClick={() => setStage(s.key as any)}>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    done ? 'bg-primary text-primary-foreground' : 
                    active ? 'bg-primary text-primary-foreground' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {idx+1}
                  </div>
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

  // AI Coach sidebar
  function AiCoach() {
    const fitScore = Math.min(100, (lead.estimated_foot_traffic / 10) + 40)
    return (
      <aside className="space-y-3">
        <div className="bg-primary/10 border border-primary/40 rounded-2xl p-4">
          <div className="text-sm font-semibold">AI Coach</div>
          <ul className="mt-2 space-y-2 text-sm">
            {!lead.name && <li className="leading-snug"><span className="font-medium">• Add property name to lock the lead.</span></li>}
            {lead.estimated_foot_traffic < 50 && <li className="leading-snug"><span className="font-medium">• Low traffic: consider beverage-only machine.</span></li>}
            {lead.estimated_foot_traffic >= 200 && <li className="leading-snug"><span className="font-medium">• High traffic: consider multiple machines.</span></li>}
            {fitScore >= 70 && <li className="leading-snug"><span className="font-medium">• Strong fit score — proceed quickly.</span></li>}
            {(!lead.name || !lead.address) ? null : <li className="text-muted-foreground">Looking good. Proceed to the next step.</li>}
          </ul>
        </div>
        <div className="bg-card border rounded-2xl p-4 text-sm">
          <div className="font-semibold">Fit Score</div>
          <div className="mt-2 text-2xl font-bold">{Math.round(fitScore)}/100</div>
        </div>
      </aside>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 py-6 text-foreground">
      <nav className="text-xs text-muted-foreground mb-3">
        <a className="underline" href="#/dashboard">Dashboard</a> 
        <span className="mx-1">/</span> Workflows 
        <span className="mx-1">/</span> New Location
      </nav>
      
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">New Location Workflow</h1>
          <div className="text-sm text-muted-foreground">
            Guide a prospect from initial lead to live machines with AI coaching.
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-5">
        <LeftTimeline />

        <main>
          {stage === 'lead' && (
            <div className="space-y-4">
              <div className="bg-card border rounded-2xl p-4">
                <div className="text-sm font-semibold mb-3">Lead Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    className="input" 
                    placeholder="Property Name" 
                    value={lead.name} 
                    onChange={e => setLead({...lead, name: e.target.value})}
                  />
                  <input 
                    className="input" 
                    placeholder="Address" 
                    value={lead.address} 
                    onChange={e => setLead({...lead, address: e.target.value})}
                  />
                  <input 
                    className="input" 
                    placeholder="City" 
                    value={lead.city} 
                    onChange={e => setLead({...lead, city: e.target.value})}
                  />
                  <input 
                    className="input" 
                    placeholder="State" 
                    value={lead.state} 
                    onChange={e => setLead({...lead, state: e.target.value})}
                  />
                  <input 
                    className="input" 
                    placeholder="ZIP Code" 
                    value={lead.zip_code} 
                    onChange={e => setLead({...lead, zip_code: e.target.value})}
                  />
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="Daily Traffic" 
                    value={lead.estimated_foot_traffic} 
                    onChange={e => setLead({...lead, estimated_foot_traffic: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button className="btn-primary" onClick={saveLead}>
                  Save & Continue
                </button>
              </div>
            </div>
          )}
          
          {stage !== 'lead' && (
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
      `}</style>
    </div>
  )
}