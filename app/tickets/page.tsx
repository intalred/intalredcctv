"use client";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function TicketsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    ticket_type: "FALLA_TECNICA",
    priority: "P2",
    title: "",
    description: "",
    asset_id: ""
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data: t } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    const { data: a } = await supabase.from("assets").select("id,code,name").order("code", { ascending: true });
    setItems(t || []);
    setAssets(a || []);
  }

  useEffect(() => { load(); }, []);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setError("No autenticado");
    const payload = {
      ...form,
      asset_id: form.asset_id || null,
      reported_by: u.user.id,
      sla_minutes: form.priority === "P1" ? 120 : form.priority === "P2" ? 240 : 480
    };
    const { error } = await supabase.from("tickets").insert(payload);
    if (error) return setError(error.message);
    setForm({ ...form, title:"", description:"", asset_id:"" });
    load();
  }

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="h2">Crear ticket</div>
            <div className="muted">Falla técnica / incidente / accidente. SLA automático según prioridad.</div>
            <hr />
            <form onSubmit={createTicket} className="row">
              <div className="col">
                <label className="muted">Tipo</label>
                <select value={form.ticket_type} onChange={(e)=>setForm({...form, ticket_type:e.target.value})}>
                  <option>FALLA_TECNICA</option><option>INCIDENTE_SEGURIDAD</option><option>ACCIDENTE</option><option>OTRO</option>
                </select>
              </div>
              <div className="col">
                <label className="muted">Prioridad</label>
                <select value={form.priority} onChange={(e)=>setForm({...form, priority:e.target.value})}>
                  <option>P1</option><option>P2</option><option>P3</option>
                </select>
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Título</label>
                <input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required placeholder="Cámara S3 rampa sur sin señal" />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Descripción</label>
                <textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} required />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Activo (opcional)</label>
                <select value={form.asset_id} onChange={(e)=>setForm({...form, asset_id:e.target.value})}>
                  <option value="">(Sin activo)</option>
                  {assets.map((a)=> <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              {error ? <div className="col" style={{minWidth:"100%"}}><div className="card" style={{borderColor:"#ffd1d1", background:"#fff5f5"}}>{error}</div></div> : null}
              <div className="col" style={{minWidth:"100%"}}><button>Crear ticket</button></div>
            </form>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="h2">Tickets</div>
            <div className="muted">{items.length} registrados</div>
            <hr />
            <table>
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Título</th><th>Estado</th></tr></thead>
              <tbody>
                {items.map((t)=>(
                  <tr key={t.id}>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>{t.ticket_type}</td>
                    <td>{t.title}</td>
                    <td><span className="badge">{t.status}</span></td>
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
