"use client";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { downloadCSV } from "@/lib/export";
import { useEffect, useState } from "react";

export default function AuditPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);

  const [auditForm, setAuditForm] = useState<any>({
    audit_date: new Date().toISOString().slice(0,10),
    scope: "Sistema CCTV San Martín (incluye Parqueadero S1–S4)",
    standard: "INTEGRADA",
    summary: ""
  });

  const [findingForm, setFindingForm] = useState<any>({
    audit_id: "",
    finding_type: "OBSERVACION",
    clause: "",
    description: "",
    risk_level: "MEDIO",
    owner: "",
    due_date: new Date(Date.now()+30*86400000).toISOString().slice(0,10)
  });

  async function load() {
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;

    const { data: p } = await supabase.from("profiles").select("user_id,full_name,role").order("full_name");
    const { data: a, error: e1 } = await supabase.from("iso_audits").select("*").order("audit_date", { ascending:false }).limit(20);
    if (e1) setError(e1.message);
    setAudits(a || []);

    const { data: f } = await supabase.from("iso_findings").select("*").order("created_at", { ascending:false }).limit(50);
    setFindings(f || []);

    // owners dropdown: store in state via window to keep it simple
    (window as any).__owners = (p || []).map((x:any)=>({ id:x.user_id, label:`${x.full_name} (${x.role})` }));
    if (!findingForm.owner && (p||[]).length) setFindingForm((s:any)=>({ ...s, owner: (p as any)[0].user_id }));
    if (!findingForm.audit_id && (a||[]).length) setFindingForm((s:any)=>({ ...s, audit_id: (a as any)[0].id }));
  }

  useEffect(()=>{ load(); }, []);

  async function createAudit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setError("No autenticado");
    const { error } = await supabase.from("iso_audits").insert({
      ...auditForm,
      lead_auditor: u.user.id
    });
    if (error) return setError(error.message);
    setAuditForm({ ...auditForm, summary:"" });
    load();
  }

  async function createFinding(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const { error } = await supabase.from("iso_findings").insert({
      ...findingForm,
      clause: findingForm.clause || null,
      owner: findingForm.owner
    });
    if (error) return setError(error.message);
    setFindingForm({ ...findingForm, clause:"", description:"" });
    load();
  }

  function exportFindings() {
    downloadCSV("hallazgos_iso.csv", findings.map(f=>({
      audit_id: f.audit_id,
      tipo: f.finding_type,
      clausula: f.clause || "",
      riesgo: f.risk_level,
      estado: f.status,
      vence: f.due_date,
      descripcion: f.description
    })));
  }

  const owners = (typeof window !== "undefined" ? (window as any).__owners : []) || [];

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="h2">Crear auditoría</div>
            <div className="muted">ISO 9001 / ISO 27001 / Integrada. Registro para revisión por la Dirección.</div>
            <hr />
            <form onSubmit={createAudit} className="row">
              <div className="col"><label className="muted">Fecha</label>
                <input type="date" value={auditForm.audit_date} onChange={(e)=>setAuditForm({...auditForm, audit_date:e.target.value})} />
              </div>
              <div className="col"><label className="muted">Norma</label>
                <select value={auditForm.standard} onChange={(e)=>setAuditForm({...auditForm, standard:e.target.value})}>
                  <option>INTEGRADA</option><option>ISO9001</option><option>ISO27001</option>
                </select>
              </div>
              <div className="col" style={{minWidth:"100%"}}><label className="muted">Alcance</label>
                <input value={auditForm.scope} onChange={(e)=>setAuditForm({...auditForm, scope:e.target.value})} />
              </div>
              <div className="col" style={{minWidth:"100%"}}><label className="muted">Resumen</label>
                <textarea value={auditForm.summary} onChange={(e)=>setAuditForm({...auditForm, summary:e.target.value})} required />
              </div>
              {error ? <div className="col" style={{minWidth:"100%"}}><div className="card" style={{borderColor:"#ffd1d1", background:"#fff5f5"}}>{error}</div></div> : null}
              <div className="col" style={{minWidth:"100%"}}><button>Guardar auditoría</button></div>
            </form>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="h2">Registrar hallazgo</div>
            <div className="muted">NC mayor/menor, observación u oportunidad. Base para acción correctiva (PHVA).</div>
            <hr />
            <form onSubmit={createFinding} className="row">
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Auditoría</label>
                <select value={findingForm.audit_id} onChange={(e)=>setFindingForm({...findingForm, audit_id:e.target.value})}>
                  {audits.map((a)=> <option key={a.id} value={a.id}>{a.audit_date} · {a.standard}</option>)}
                </select>
              </div>
              <div className="col">
                <label className="muted">Tipo</label>
                <select value={findingForm.finding_type} onChange={(e)=>setFindingForm({...findingForm, finding_type:e.target.value})}>
                  <option>NC_MAYOR</option><option>NC_MENOR</option><option>OBSERVACION</option><option>OPORTUNIDAD</option>
                </select>
              </div>
              <div className="col">
                <label className="muted">Riesgo</label>
                <select value={findingForm.risk_level} onChange={(e)=>setFindingForm({...findingForm, risk_level:e.target.value})}>
                  <option>ALTO</option><option>MEDIO</option><option>BAJO</option>
                </select>
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Cláusula (opcional)</label>
                <input value={findingForm.clause} onChange={(e)=>setFindingForm({...findingForm, clause:e.target.value})} placeholder="ISO 9001 9.1 / ISO 27001 A.5.15" />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Descripción</label>
                <textarea value={findingForm.description} onChange={(e)=>setFindingForm({...findingForm, description:e.target.value})} required />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Responsable</label>
                <select value={findingForm.owner} onChange={(e)=>setFindingForm({...findingForm, owner:e.target.value})}>
                  {owners.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
              <div className="col">
                <label className="muted">Vence</label>
                <input type="date" value={findingForm.due_date} onChange={(e)=>setFindingForm({...findingForm, due_date:e.target.value})} />
              </div>
              <div className="col" style={{minWidth:"100%"}}><button>Guardar hallazgo</button></div>
            </form>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div className="h2">Hallazgos recientes</div>
            <div className="muted">{findings.length} registrados</div>
          </div>
          <button className="secondary" onClick={exportFindings}>Exportar (CSV)</button>
        </div>
        <hr />
        <table>
          <thead><tr><th>Tipo</th><th>Riesgo</th><th>Cláusula</th><th>Descripción</th><th>Estado</th><th>Vence</th></tr></thead>
          <tbody>
            {findings.map((f)=>(
              <tr key={f.id}>
                <td><span className="badge">{f.finding_type}</span></td>
                <td><span className="badge">{f.risk_level}</span></td>
                <td>{f.clause || "—"}</td>
                <td>{(f.description||"").slice(0,90)}{(f.description||"").length>90?"…":""}</td>
                <td><span className="badge">{f.status}</span></td>
                <td>{f.due_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
