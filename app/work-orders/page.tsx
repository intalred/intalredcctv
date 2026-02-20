"use client";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function WorkOrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    wo_type: "PREVENTIVO",
    scheduled_date: new Date().toISOString().slice(0,10),
    asset_id: "",
    checklist: ""
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: wos } = await supabase.from("work_orders").select("*").order("created_at", { ascending: false });
    const { data: a } = await supabase.from("assets").select("id,code,name").order("code", { ascending: true });
    setItems(wos || []);
    setAssets(a || []);
  }

  useEffect(()=>{ load(); }, []);

  async function createWO(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = { ...form, asset_id: form.asset_id || null };
    const { error } = await supabase.from("work_orders").insert(payload);
    if (error) return setError(error.message);
    setForm({ ...form, asset_id:"", checklist:"" });
    load();
  }

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="h2">Crear OT</div>
            <div className="muted">Mantenimiento preventivo/correctivo (sin evidencia de video).</div>
            <hr />
            <form onSubmit={createWO} className="row">
              <div className="col">
                <label className="muted">Tipo</label>
                <select value={form.wo_type} onChange={(e)=>setForm({...form, wo_type:e.target.value})}>
                  <option>PREVENTIVO</option><option>CORRECTIVO</option>
                </select>
              </div>
              <div className="col">
                <label className="muted">Fecha programada</label>
                <input type="date" value={form.scheduled_date} onChange={(e)=>setForm({...form, scheduled_date:e.target.value})} />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Activo (opcional)</label>
                <select value={form.asset_id} onChange={(e)=>setForm({...form, asset_id:e.target.value})}>
                  <option value="">(General)</option>
                  {assets.map((a)=> <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Checklist / Actividades</label>
                <textarea value={form.checklist} onChange={(e)=>setForm({...form, checklist:e.target.value})}
                  placeholder="- Limpieza domo
- Verificación IR
- Prueba grabación
- Revisión conectores" />
              </div>
              {error ? <div className="col" style={{minWidth:"100%"}}><div className="card" style={{borderColor:"#ffd1d1", background:"#fff5f5"}}>{error}</div></div> : null}
              <div className="col" style={{minWidth:"100%"}}><button>Crear OT</button></div>
            </form>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="h2">Órdenes de trabajo</div>
            <div className="muted">{items.length} registradas</div>
            <hr />
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Estado</th></tr></thead>
              <tbody>
                {items.map((w)=>(
                  <tr key={w.id}>
                    <td>{w.scheduled_date}</td>
                    <td>{w.wo_type}</td>
                    <td><span className="badge">{w.status}</span></td>
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
