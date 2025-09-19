import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// ============ Types ============
export type PipelineStage =
  | 'lead'
  | 'surveyed'
  | 'proposed'
  | 'contracted'
  | 'ordered'
  | 'planogram'
  | 'scheduled'
  | 'installed'
  | 'live'

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
  revenue_split?: number
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
  status?: 'draft' | 'sent' | 'signed' | 'declined'
}

interface OrderForm {
  vendor?: string
  model?: string
  quantity?: number
  order_date?: string
  expected_delivery_date?: string
  notes?: string
}

interface PlanogramForm {
  name?: string
  rows?: number
  cols?: number
}

interface DeliveryForm {
  window_start?: string
  window_end?: string
  assigned_route_date?: string
  driver_id?: string
}

interface InstallForm {
  serial_number?: string
  telemetry_device_id?: string
  installed_at?: string
  activated_at?: string
  initial_fill_qty?: number
  cash_float?: number
}

// ============ Utility functions ============
function computeFitScore(input: LeadForm): number {
  const traffic = input.estimated_foot_traffic || 0
  const base = Math.min(100, traffic / 10)
  return Math.max(0, Math.min(100, base))
}

// ============ Small UI helpers ============
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-foreground">{title}</h2>
      {children}
    </div>
  )
}

function StepHeader({ steps, current }: { steps: { key: string; label: string }[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-3 mb-6">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-2 ${
            i <= current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>{i+1}</div>
          <span className={`text-sm ${i <= current ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
          {i < steps.length - 1 && <span className="mx-3 text-muted-foreground">›</span>}
        </li>
      ))}
    </ol>
  )
}

function SaveBar({ onBack, onNext, isLast, disabled }: { onBack?: () => void; onNext: () => void; isLast?: boolean; disabled?: boolean }) {
  return (
    <div className="sticky bottom-0 bg-background/80 backdrop-blur border-t border-border py-3 mt-6">
      <div className="max-w-6xl mx-auto px-2 flex justify-between">
        <button 
          onClick={onBack} 
          className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-accent" 
          disabled={!onBack}
        >
          Back
        </button>
        <button 
          onClick={onNext} 
          disabled={disabled} 
          className={`px-4 py-2 rounded-xl font-semibold ${
            disabled 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
        >
          {isLast ? 'Finish' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}

// ============ Main Component ============
export default function NewLocationWorkflow() {
  console.log('NewLocationWorkflow component loaded!')
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [locationId, setLocationId] = useState<string | null>(null)
  const [machineOrderId, setMachineOrderId] = useState<string | null>(null)
  const [machineId, setMachineId] = useState<string | null>(null)
  const [planogramId, setPlanogramId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Forms state
  const [lead, setLead] = useState<LeadForm>({ status: 'new' })
  const [survey, setSurvey] = useState<SurveyForm>({ recommended_machine_type: 'Combo', recommended_machine_count: 1 })
  const [contract, setContract] = useState<ContractForm>({ status: 'draft', term_months: 12, commission_rate: 10 })
  const [order, setOrder] = useState<OrderForm>({ quantity: 1 })
  const [planogram, setPlanogram] = useState<PlanogramForm>({ name: 'Default Planogram', rows: 6, cols: 6 })
  const [delivery, setDelivery] = useState<DeliveryForm>({})
  const [install, setInstall] = useState<InstallForm>({})

  const steps = useMemo(() => ([
    { key: 'lead', label: 'Lead Intake' },
    { key: 'surveyed', label: 'Site Survey' },
    { key: 'proposed', label: 'Proposal & Contract' },
    { key: 'ordered', label: 'Machine Order' },
    { key: 'planogram', label: 'Planogram & Inventory' },
    { key: 'scheduled', label: 'Schedule Delivery' },
    { key: 'installed', label: 'Install & Activate' },
    { key: 'live', label: 'Go‑Live & Monitoring' },
  ]), [])

  // Resume via URL ?leadId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('leadId')
    if (id) {
      setLeadId(id)
      // Load lead data
      supabase.from('leads').select('*').eq('id', id).single().then(({ data, error }) => {
        if (error || !data) return
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
          revenue_split: data.revenue_split,
          status: data.status,
        })
      })
    }
  }, [])

  // -------- STEP HANDLERS --------
  async function saveLead() {
    setLoading(true)
    try {
      const payload = { 
        name: lead.name || 'New Lead',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        zip_code: lead.zip_code || '',
        location_type: lead.location_type || 'Office',
        estimated_foot_traffic: lead.estimated_foot_traffic || 0,
        company: lead.company || '',
        phone: lead.phone || '',
        email: lead.email || '',
        notes: lead.notes || '',
        status: 'new'
      }
      let res
      if (leadId) {
        res = await supabase.from('leads').update(payload).eq('id', leadId).select('id').single()
      } else {
        res = await supabase.from('leads').insert(payload).select('id').single()
      }
      if (res.error) throw res.error
      const id = res.data.id
      setLeadId(id)
      setCurrentStep(1)
      toast({ title: "Lead saved successfully" })
    } catch (e: any) {
      toast({ title: "Error saving lead", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function saveSurvey() {
    if (!leadId) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase.from('site_surveys').insert({ 
        ...survey, 
        lead_id: leadId,
        org_id: null // Will be set by RLS/trigger
      })
      if (error) throw error
      setCurrentStep(2)
      toast({ title: "Site survey saved successfully" })
    } catch (e: any) { 
      toast({ title: "Error saving survey", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function saveContract() {
    if (!leadId) return
    setLoading(true)
    try {
      // Get current user to set org_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create contract with all required fields 
      const contractData = {
        title: 'Vending Services Agreement',
        body_html: '<p>Standard vending services agreement</p>',
        location_id: locationId,
        org_id: null, // Will be set by trigger
        revenue_share_pct: contract.commission_rate || 10,
        term_months: contract.term_months || 12,
        status: contract.status || 'draft'
      }
      const { data, error } = await supabase.from('contracts').insert(contractData).select('id').single()
      if (error) throw error

      if (contract.status === 'signed') {
        // Create Location from Lead
        const locPayload = {
          name: lead.name || 'New Location',
          address: lead.address || '',
          city: lead.city || '',
          state: lead.state || '',
          zip_code: lead.zip_code || '',
          location_type: lead.location_type || '',
          contact_name: lead.name || '',
        }
        const { data: locRow, error: e2 } = await supabase.from('locations').insert(locPayload).select('id').single()
        if (e2) throw e2
        setLocationId(locRow.id)
      }
      setCurrentStep(3)
      toast({ title: "Contract saved successfully" })
    } catch (e: any) { 
      toast({ title: "Error saving contract", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function saveOrder() {
    if (!leadId || !locationId) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('machine_orders').insert({ ...order, lead_id: leadId, location_id: locationId }).select('id').single()
      if (error) throw error
      setMachineOrderId(data.id)
      setCurrentStep(4)
      toast({ title: "Machine order saved successfully" })
    } catch (e: any) { 
      toast({ title: "Error saving order", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function savePlanogram() {
    if (!locationId) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const rows = planogram.rows ?? 6
      const cols = planogram.cols ?? 6
      const { data: p, error } = await supabase.from('planograms').insert({
        location_id: locationId,
        name: planogram.name ?? 'Default Planogram',
        rows, cols,
        org_id: null // Will be set by RLS/trigger
      }).select('id').single()
      if (error) throw error
      setPlanogramId(p.id)

      // Generate basic planogram items
      const items = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          items.push({
            planogram_id: p.id,
            row_idx: r,
            col_idx: c,
            product_name: `Slot ${String.fromCharCode(65 + r)}${c + 1}`,
            facings: 1,
            capacity: 10,
            par_level: 5,
          })
        }
      }

      // Insert items in chunks
      const chunk = 50
      for (let i = 0; i < items.length; i += chunk) {
        const { error: e } = await supabase.from('planogram_items').insert(items.slice(i, i + chunk))
        if (e) throw e
      }

      setCurrentStep(5)
      toast({ title: "Planogram saved successfully" })
    } catch (e: any) { 
      toast({ title: "Error saving planogram", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function saveDelivery() {
    if (!locationId || !machineOrderId) return
    setLoading(true)
    try {
      const payload = {
        machine_order_id: machineOrderId,
        location_id: locationId,
        window_start: delivery.window_start || null,
        window_end: delivery.window_end || null,
        assigned_route_date: delivery.assigned_route_date || null,
        driver_id: delivery.driver_id || null,
        status: 'scheduled'
      }
      const { error } = await supabase.from('deliveries').insert(payload)
      if (error) throw error
      setCurrentStep(6)
      toast({ title: "Delivery scheduled successfully" })
    } catch (e: any) { 
      toast({ title: "Error scheduling delivery", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function saveInstall() {
    if (!locationId) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // create machine
      const machineData = {
        location_id: locationId,
        name: install.serial_number || 'New Machine',
        status: 'installed',
        install_date: new Date().toISOString().split('T')[0],
        machine_model: order.model || 'Standard',
        serial_number: install.serial_number || 'SERIAL001',
        org_id: null // Will be set by RLS/trigger
      }
      const { data: m, error: e1 } = await supabase.from('machines').insert(machineData).select('id').single()
      if (e1) throw e1
      setMachineId(m.id)

      // assignment/activation - using correct field names for machine_assignments table  
      const { error: e2 } = await supabase.from('machine_assignments').insert({
        machine_id: m.id,
        location_id: locationId,
        installed_at: install.installed_at ? install.installed_at : new Date().toISOString(),
        activated_at: install.activated_at ? install.activated_at : new Date().toISOString(),
        initial_fill_qty: install.initial_fill_qty || 0,
        cash_float: install.cash_float || 0,
        org_id: null // Will be set by RLS/trigger
      })
      if (e2) throw e2

      // create default service schedules
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const nextTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      
      const { error: e3 } = await supabase.from('restock_tasks').insert({ 
        machine_id: m.id, 
        next_visit: nextWeek.toISOString().split('T')[0], 
        cadence_days: 7,
        org_id: null // Will be set by RLS/trigger
      })
      if (e3) throw e3
      
      const { error: e4 } = await supabase.from('cash_collection_schedule').insert({ 
        machine_id: m.id, 
        next_collection: nextTwoWeeks.toISOString().split('T')[0], 
        cadence_days: 14,
        org_id: null // Will be set by RLS/trigger
      })
      if (e4) throw e4

      setCurrentStep(7)
      toast({ title: "Installation completed successfully" })
    } catch (e: any) { 
      toast({ title: "Error completing installation", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  async function finishGoLive() {
    setLoading(true)
    try {
      // Update lead status to converted
      if (leadId) {
        await supabase.from('leads').update({ status: 'converted' }).eq('id', leadId)
      }
      toast({ 
        title: "Go-Live complete!", 
        description: "This location will now appear in your operational dashboards."
      })
    } catch (e: any) { 
      toast({ title: "Error completing go-live", description: e.message, variant: "destructive" })
    } finally { setLoading(false) }
  }

  // -------- Renderers for each step --------
  function LeadStep() {
    return (
      <Section title="Step 1 — Lead Intake">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="input" placeholder="Lead Name" value={lead.name||''} onChange={e=>setLead({...lead, name:e.target.value})}/>
          <input className="input" placeholder="Address" value={lead.address||''} onChange={e=>setLead({...lead, address:e.target.value})}/>
          <div className="grid grid-cols-3 gap-2">
            <input className="input" placeholder="City" value={lead.city||''} onChange={e=>setLead({...lead, city:e.target.value})}/>
            <input className="input" placeholder="State" value={lead.state||''} onChange={e=>setLead({...lead, state:e.target.value})}/>
            <input className="input" placeholder="ZIP" value={lead.zip_code||''} onChange={e=>setLead({...lead, zip_code:e.target.value})}/>
          </div>
          <select className="input" value={lead.location_type||''} onChange={e=>setLead({...lead, location_type:e.target.value})}>
            <option value="">Location Type</option>
            <option>Office</option>
            <option>School</option>
            <option>Hospital</option>
            <option>Gym</option>
            <option>Warehouse</option>
            <option>Apartment</option>
            <option>Mixed</option>
          </select>
          <input className="input" type="number" placeholder="Est. Foot Traffic" value={lead.estimated_foot_traffic||''} onChange={e=>setLead({...lead, estimated_foot_traffic:Number(e.target.value)})}/>
          <input className="input" placeholder="Company" value={lead.company||''} onChange={e=>setLead({...lead, company:e.target.value})}/>
          <input className="input" placeholder="Contact Phone" value={lead.phone||''} onChange={e=>setLead({...lead, phone:e.target.value})}/>
          <input className="input" placeholder="Contact Email" value={lead.email||''} onChange={e=>setLead({...lead, email:e.target.value})}/>
          <input className="input" type="date" placeholder="Follow Up Date" value={lead.follow_up_date||''} onChange={e=>setLead({...lead, follow_up_date:e.target.value})}/>
          <input className="input" type="number" step="0.01" placeholder="Revenue Split %" value={lead.revenue_split||''} onChange={e=>setLead({...lead, revenue_split:Number(e.target.value)})}/>
        </div>
        <textarea 
          className="input mt-4" 
          placeholder="Additional Notes"
          value={lead.notes||''} 
          onChange={e=>setLead({...lead, notes:e.target.value})}
        />
        <div className="mt-4 text-sm text-muted-foreground">
          Fit Score: <strong>{computeFitScore(lead)}%</strong>
        </div>
      </Section>
    )
  }

  function SurveyStep() {
    return (
      <Section title="Step 2 — Site Survey">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            className="input" 
            type="date" 
            placeholder="Visit Date"
            value={survey.visit_date||''} 
            onChange={e=>setSurvey({...survey, visit_date:e.target.value})}
          />
          <input 
            className="input" 
            type="number" 
            placeholder="Power Outlets Count"
            value={survey.power_outlets_count||''} 
            onChange={e=>setSurvey({...survey, power_outlets_count:Number(e.target.value)})}
          />
          <select 
            className="input"
            value={survey.network_type||''} 
            onChange={e=>setSurvey({...survey, network_type:e.target.value})}
          >
            <option value="">Network Type</option>
            <option>WiFi</option>
            <option>Ethernet</option>
            <option>Cellular</option>
            <option>None</option>
          </select>
          <input 
            className="input" 
            type="number" 
            placeholder="Entrance Width (cm)"
            value={survey.entrance_width_cm||''} 
            onChange={e=>setSurvey({...survey, entrance_width_cm:Number(e.target.value)})}
          />
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={!!survey.elevator_access} 
              onChange={e=>setSurvey({...survey, elevator_access:e.target.checked})}
            />
            <span>Elevator Access</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={!!survey.parking} 
              onChange={e=>setSurvey({...survey, parking:e.target.checked})}
            />
            <span>Parking Available</span>
          </label>
          <select 
            className="input"
            value={survey.recommended_machine_type||'Combo'} 
            onChange={e=>setSurvey({...survey, recommended_machine_type: e.target.value as any})}
          >
            <option>Snack</option>
            <option>Beverage</option>
            <option>Combo</option>
          </select>
          <input 
            className="input" 
            type="number" 
            placeholder="Recommended Machine Count"
            value={survey.recommended_machine_count||''} 
            onChange={e=>setSurvey({...survey, recommended_machine_count:Number(e.target.value)})}
          />
          <input 
            className="input" 
            type="date" 
            placeholder="Earliest Install Date"
            value={survey.earliest_install_date||''} 
            onChange={e=>setSurvey({...survey, earliest_install_date:e.target.value})}
          />
        </div>
        <textarea 
          className="input mt-4" 
          placeholder="Site Constraints & Notes"
          value={survey.constraints||''} 
          onChange={e=>setSurvey({...survey, constraints:e.target.value})}
        />
      </Section>
    )
  }

  function ContractStep() {
    return (
      <Section title="Step 3 — Proposal & Contract">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="input" 
            type="number" 
            placeholder="Commission Rate (%)"
            value={contract.commission_rate||''} 
            onChange={e=>setContract({...contract, commission_rate:Number(e.target.value)})}
          />
          <input 
            className="input" 
            placeholder="Service Level Agreement"
            value={contract.service_level||''} 
            onChange={e=>setContract({...contract, service_level:e.target.value})}
          />
          <input 
            className="input" 
            type="number" 
            placeholder="Placement Fee"
            value={contract.placement_fee||''} 
            onChange={e=>setContract({...contract, placement_fee:Number(e.target.value)})}
          />
          <input 
            className="input" 
            type="number" 
            placeholder="Term (months)"
            value={contract.term_months||''} 
            onChange={e=>setContract({...contract, term_months:Number(e.target.value)})}
          />
          <select 
            className="input"
            value={contract.status||'draft'} 
            onChange={e=>setContract({...contract, status:e.target.value as any})}
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        {contract.status === 'signed' && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-xl text-green-800">
            Contract signed! Location record will be created automatically.
          </div>
        )}
      </Section>
    )
  }

  function OrderStep() {
    return (
      <Section title="Step 4 — Machine Order">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            className="input" 
            placeholder="Vendor"
            value={order.vendor||''} 
            onChange={e=>setOrder({...order, vendor:e.target.value})}
          />
          <input 
            className="input" 
            placeholder="Machine Model"
            value={order.model||''} 
            onChange={e=>setOrder({...order, model:e.target.value})}
          />
          <input 
            className="input" 
            type="number" 
            placeholder="Quantity"
            value={order.quantity||''} 
            onChange={e=>setOrder({...order, quantity:Number(e.target.value)})}
          />
          <input 
            className="input" 
            type="date" 
            placeholder="Order Date"
            value={order.order_date||''} 
            onChange={e=>setOrder({...order, order_date:e.target.value})}
          />
          <input 
            className="input" 
            type="date" 
            placeholder="Expected Delivery"
            value={order.expected_delivery_date||''} 
            onChange={e=>setOrder({...order, expected_delivery_date:e.target.value})}
          />
        </div>
        <textarea 
          className="input mt-4" 
          placeholder="Order Notes"
          value={order.notes||''} 
          onChange={e=>setOrder({...order, notes:e.target.value})}
        />
      </Section>
    )
  }

  function PlanogramStep() {
    return (
      <Section title="Step 5 — Planogram & Inventory">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            className="input" 
            placeholder="Planogram Name"
            value={planogram.name||''} 
            onChange={e=>setPlanogram({...planogram, name:e.target.value})}
          />
          <input 
            className="input" 
            type="number" 
            placeholder="Rows"
            value={planogram.rows||''} 
            onChange={e=>setPlanogram({...planogram, rows:Number(e.target.value)})}
          />
          <input 
            className="input" 
            type="number" 
            placeholder="Columns"
            value={planogram.cols||''} 
            onChange={e=>setPlanogram({...planogram, cols:Number(e.target.value)})}
          />
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            A {planogram.rows || 6} × {planogram.cols || 6} planogram will be generated with {(planogram.rows || 6) * (planogram.cols || 6)} slots.
          </p>
        </div>
      </Section>
    )
  }

  function DeliveryStep() {
    return (
      <Section title="Step 6 — Schedule Delivery">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="input" 
            type="datetime-local" 
            placeholder="Delivery Window Start"
            value={delivery.window_start||''} 
            onChange={e=>setDelivery({...delivery, window_start:e.target.value})}
          />
          <input 
            className="input" 
            type="datetime-local" 
            placeholder="Delivery Window End"
            value={delivery.window_end||''} 
            onChange={e=>setDelivery({...delivery, window_end:e.target.value})}
          />
          <input 
            className="input" 
            type="date" 
            placeholder="Assigned Route Date"
            value={delivery.assigned_route_date||''} 
            onChange={e=>setDelivery({...delivery, assigned_route_date:e.target.value})}
          />
          <input 
            className="input" 
            placeholder="Driver ID"
            value={delivery.driver_id||''} 
            onChange={e=>setDelivery({...delivery, driver_id:e.target.value})}
          />
        </div>
      </Section>
    )
  }

  function InstallStep() {
    return (
      <Section title="Step 7 — Install & Activate">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            className="input" 
            placeholder="Serial Number"
            value={install.serial_number||''} 
            onChange={e=>setInstall({...install, serial_number:e.target.value})}
          />
          <input 
            className="input" 
            placeholder="Telemetry Device ID"
            value={install.telemetry_device_id||''} 
            onChange={e=>setInstall({...install, telemetry_device_id:e.target.value})}
          />
          <input 
            className="input" 
            type="datetime-local" 
            placeholder="Installed At"
            value={install.installed_at||''} 
            onChange={e=>setInstall({...install, installed_at:e.target.value})}
          />
          <input 
            className="input" 
            type="datetime-local" 
            placeholder="Activated At"
            value={install.activated_at||''} 
            onChange={e=>setInstall({...install, activated_at:e.target.value})}
          />
          <input 
            className="input" 
            type="number" 
            placeholder="Initial Fill Quantity"
            value={install.initial_fill_qty||''} 
            onChange={e=>setInstall({...install, initial_fill_qty:Number(e.target.value)})}
          />
          <input 
            className="input" 
            type="number" 
            step="0.01"
            placeholder="Cash Float"
            value={install.cash_float||''} 
            onChange={e=>setInstall({...install, cash_float:Number(e.target.value)})}
          />
        </div>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-800">
            Installation will create restock and cash collection schedules automatically.
          </p>
        </div>
      </Section>
    )
  }

  function GoLiveStep() {
    return (
      <Section title="Step 8 — Go‑Live & Monitoring">
        <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🎉 Ready to Go Live!
          </h3>
          <p className="text-green-700 mb-4">
            All setup steps are complete. The machine is ready for operation.
          </p>
          <ul className="text-sm text-green-600 space-y-1 mb-6">
            <li>✓ Machine installed and activated</li>
            <li>✓ Planogram configured</li>
            <li>✓ Restock schedule created</li>
            <li>✓ Cash collection schedule created</li>
          </ul>
        </div>
      </Section>
    )
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return lead.name && lead.address && lead.city
      case 1: return survey.visit_date
      case 2: return contract.status
      case 3: return order.model && order.quantity
      case 4: return planogram.name && planogram.rows && planogram.cols
      case 5: return delivery.window_start && delivery.window_end
      case 6: return install.serial_number
      default: return true
    }
  }

  const handleNext = () => {
    switch (currentStep) {
      case 0: saveLead(); break
      case 1: saveSurvey(); break
      case 2: saveContract(); break
      case 3: saveOrder(); break
      case 4: savePlanogram(); break
      case 5: saveDelivery(); break
      case 6: saveInstall(); break
      case 7: finishGoLive(); break
    }
  }

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">New Location Workflow</h1>
          <p className="text-muted-foreground">
            Guide a prospect from initial lead to live vending machine operation.
          </p>
        </div>

        <StepHeader steps={steps} current={currentStep} />

        <div className="min-h-[600px]">
          {currentStep === 0 && <LeadStep />}
          {currentStep === 1 && <SurveyStep />}
          {currentStep === 2 && <ContractStep />}
          {currentStep === 3 && <OrderStep />}
          {currentStep === 4 && <PlanogramStep />}
          {currentStep === 5 && <DeliveryStep />}
          {currentStep === 6 && <InstallStep />}
          {currentStep === 7 && <GoLiveStep />}
        </div>

        <SaveBar 
          onBack={currentStep > 0 ? handleBack : undefined}
          onNext={handleNext}
          isLast={currentStep === 7}
          disabled={!canProceed() || loading}
        />
      </div>

      <style>{`
        .input { 
          @apply bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted-foreground w-full focus:outline-none focus:ring-2 focus:ring-ring; 
        }
      `}</style>
    </div>
  )
}