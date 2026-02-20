"use client";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

type Asset = {
  id: string;
  asset_type: string;
  code: string;
  name: string;
  location: string;
  zone: string;
  floor: string | null;
  criticality: string;
  status: string;
  ip_address: string | null;
};

export default function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    asset_type: "CAMARA",
    code: "",
    name: "",
    location: "",
    zone: "PARQUEADERO",
    floor: "S1",
    criticality: "ALTA",
    status: "OPERATIVO",
    ip_address: ""
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("assets").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    setItems((data as any) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createAsset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = { ...form, ip_address: form.ip_address || null, floor: form.floor || null };
    const { error } = await supabase.from("assets").insert(payload);
    if (error) return setError(error.message);
    setForm({ ...form, code:"", name:"", location:"", ip_address:"" });
    load();
  }

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="h2">Crear activo</div>
            <div className="muted">Inventario técnico (cámaras, NVR, switches, UPS).</div>
            <hr />
            <form onSubmit={createAsset} className="row">
              <div className="col">
                <label className="muted">Tipo</label>
                <select value={form.asset_type} onChange={(e)=>setForm({...form, asset_type:e.target.value})}>
                  <option>CAMARA</option><option>NVR</option><option>SWITCH</option><option>UPS</option><option>ENLACE</option><option>OTRO</option>
                </select>
              </div>
              <div className="col">
                <label className="muted">Código</label>
                <input value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} placeholder="CAM-S2-ENT-01" required />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Nombre</label>
                <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} placeholder="Entrada Vehicular S2 - LPR" required />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Ubicación</label>
                <input value={form.location} onChange={(e)=>setForm({...form, location:e.target.value})} placeholder="Parqueadero S2 - Acceso Norte" required />
              </div>
              <div className="col">
                <label className="muted">Zona</label>
                <select value={form.zone} onChange={(e)=>setForm({...form, zone:e.target.value})}>
                  <option>PARQUEADERO</option><option>ACCESOS</option><option>PASILLOS</option><option>PLAZA_COMIDAS</option><option>OTRA</option>
                </select>
              </div>
              <div className="col">
                <label className="muted">Piso</label>
                <select value={form.floor} onChange={(e)=>setForm({...form, floor:e.target.value})}>
                  <option>S1</option><option>S2</option><option>S3</option><option>S4</option><option value="">(N/A)</option>
                </select>
              </div>
              <div className="col">
                <label className="muted">Criticidad</label>
                <select value={form.criticality} onChange={(e)=>setForm({...form, criticality:e.target.value})}>
                  <option>ALTA</option><option>MEDIA</option><option>BAJA</option>
                </select>
              </div>
              <div className="col">
                <label className="muted">Estado</label>
                <select value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}>
                  <option>OPERATIVO</option><option>DEGRADADO</option><option>FUERA_SERVICIO</option><option>EN_MANTENIMIENTO</option>
                </select>
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">IP (opcional)</label>
                <input value={form.ip_address} onChange={(e)=>setForm({...form, ip_address:e.target.value})} placeholder="10.10.20.15" />
              </div>
              {error ? <div className="col" style={{minWidth:"100%"}}><div className="card" style={{borderColor:"#ffd1d1", background:"#fff5f5"}}>{error}</div></div> : null}
              <div className="col" style={{minWidth:"100%"}}>
                <button>Guardar activo</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="h2">Inventario</div>
            <div className="muted">{loading ? "Cargando..." : `${items.length} activos`}</div>
            <hr />
            <table>
              <thead>
                <tr>
                  <th>Código</th><th>Tipo</th><th>Ubicación</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td>{a.code}</td>
                    <td>{a.asset_type}</td>
                    <td>{a.floor ? `${a.floor} - ` : ""}{a.location}</td>
                    <td><span className="badge">{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="muted" style={{marginTop:10}}>
              Nota: Para edición/borrado, agrega acciones con permisos por rol (RLS).
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
