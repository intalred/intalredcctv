"use client";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { downloadCSV } from "@/lib/export";
import { useEffect, useMemo, useState } from "react";

export default function ShiftPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [checks, setChecks] = useState<Record<string, any[]>>({});
  const [error, setError] = useState<string|null>(null);
  const today = useMemo(()=> new Date().toISOString().slice(0,10), []);

  const [form, setForm] = useState<any>({
    shift_date: today,
    shift: "AM",
    summary: ""
  });

  async function load() {
    setError(null);
    const { data: a } = await supabase.from("assets").select("id,code,name,criticality,status").eq("asset_type","CAMARA").order("code");
    setAssets(a || []);

    const { data: l, error: e1 } = await supabase.from("shift_logs").select("*").order("created_at", { ascending:false }).limit(25);
    if (e1) setError(e1.message);
    setLogs(l || []);

    if (l?.length) {
      const ids = l.map((x:any)=>x.id);
      const { data: c } = await supabase.from("shift_checks").select("*").in("shift_log_id", ids);
      const grouped: Record<string, any[]> = {};
      (c||[]).forEach((x:any)=>{ (grouped[x.shift_log_id] ||= []).push(x); });
      setChecks(grouped);
    } else {
      setChecks({});
    }
  }

  useEffect(()=>{ load(); }, []);

  async function createLog(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setError("No autenticado");
    const { data: inserted, error } = await supabase.from("shift_logs").insert({
      shift_date: form.shift_date,
      shift: form.shift,
      summary: form.summary,
      operator_id: u.user.id
    }).select("*").single();
    if (error) return setError(error.message);

    // Crear checklist por defecto: todas las cámaras ALTA + muestra 10 adicionales
    const high = assets.filter(a=>a.criticality==="ALTA");
    const rest = assets.filter(a=>a.criticality!=="ALTA").slice(0,10);
    const initial = [...high, ...rest].map(a=>({
      shift_log_id: inserted.id,
      asset_id: a.id,
      check_result: "OK",
      observation: null
    }));

    if (initial.length) {
      const { error: e2 } = await supabase.from("shift_checks").insert(initial);
      if (e2) return setError(e2.message);
    }

    setForm({ ...form, summary:"" });
    load();
  }

  function exportLatest() {
    if (!logs.length) return;
    const l = logs[0];
    const rows = (checks[l.id] || []).map((c:any)=>({
      shift_date: l.shift_date,
      shift: l.shift,
      asset_id: c.asset_id,
      check_result: c.check_result,
      observation: c.observation || ""
    }));
    downloadCSV(`bitacora_${l.shift_date}_${l.shift}.csv`, rows);
  }

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="h2">Nueva bitácora por turno</div>
            <div className="muted">Crea el registro y genera checklist inicial (cámaras críticas + muestra).</div>
            <hr />
            <form onSubmit={createLog} className="row">
              <div className="col">
                <label className="muted">Fecha</label>
                <input type="date" value={form.shift_date} onChange={(e)=>setForm({...form, shift_date:e.target.value})} />
              </div>
              <div className="col">
                <label className="muted">Turno</label>
                <select value={form.shift} onChange={(e)=>setForm({...form, shift:e.target.value})}>
                  <option>AM</option><option>PM</option><option>NOCHE</option>
                </select>
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Resumen / Novedades</label>
                <textarea value={form.summary} onChange={(e)=>setForm({...form, summary:e.target.value})} placeholder="Novedades relevantes, cámaras fuera, acciones..." required />
              </div>
              {error ? <div className="col" style={{minWidth:"100%"}}><div className="card" style={{borderColor:"#ffd1d1", background:"#fff5f5"}}>{error}</div></div> : null}
              <div className="col" style={{minWidth:"100%"}}>
                <button>Crear bitácora</button>
              </div>
            </form>
            <hr />
            <button className="secondary" onClick={exportLatest} disabled={!logs.length}>Exportar checklist último turno (CSV)</button>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="h2">Últimas bitácoras</div>
            <div className="muted">Consulta rápida para auditoría ISO (trazabilidad).</div>
            <hr />
            <table>
              <thead><tr><th>Fecha</th><th>Turno</th><th>Resumen</th><th>#Checks</th></tr></thead>
              <tbody>
                {logs.map((l:any)=>(
                  <tr key={l.id}>
                    <td>{l.shift_date}</td>
                    <td><span className="badge">{l.shift}</span></td>
                    <td>{(l.summary||"").slice(0,70)}{(l.summary||"").length>70?"…":""}</td>
                    <td>{(checks[l.id]||[]).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
