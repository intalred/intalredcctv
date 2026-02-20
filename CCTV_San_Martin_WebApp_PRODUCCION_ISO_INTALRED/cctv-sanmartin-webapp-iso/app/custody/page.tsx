"use client";
import Shell from "@/components/Shell";
import SignaturePad from "@/components/SignaturePad";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function CustodyPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [signature, setSignature] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [form, setForm] = useState<any>({
    extraction_datetime: new Date().toISOString(),
    reason: "",
    from_datetime: new Date(Date.now() - 15*60*1000).toISOString(),
    to_datetime: new Date().toISOString(),
    camera_asset_id: "",
    export_format: "NATIVO+MP4",
    sha256_hash: "",
    storage_reference: "",
    authority_request_ref: "",
    delivered_to: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    const { data: a } = await supabase.from("assets").select("id,code,name").eq("asset_type","CAMARA").order("code");
    setAssets(a || []);
    const { data: r } = await supabase.from("custody_records").select("*").order("created_at", { ascending: false });
    setRecords(r || []);

    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const { data: p } = await supabase.from("profiles").select("full_name,role").eq("user_id", u.user.id).single();
      setFullName(p?.full_name || "");
      setRole(p?.role || "");
    }
  }

  useEffect(()=>{ load(); }, []);

  async function createRecordWithSignature(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setOk(null);
    if (!signature) return setError("Debes firmar digitalmente el acta.");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return setError("No autenticado");

    // 1) Insert custody record
    const payload = {
      extraction_datetime: form.extraction_datetime,
      extracted_by: u.user.id,
      reason: form.reason,
      from_datetime: form.from_datetime,
      to_datetime: form.to_datetime,
      camera_asset_id: form.camera_asset_id || null,
      export_format: form.export_format,
      sha256_hash: form.sha256_hash,
      storage_reference: form.storage_reference || null,
      authority_request_ref: form.authority_request_ref || null,
      delivered_to: form.delivered_to || null
    };

    const { data: inserted, error: e1 } = await supabase.from("custody_records").insert(payload).select("*").single();
    if (e1) return setError(e1.message);

    // 2) Insert signature acta
    const sigPayload = {
      custody_id: inserted.id,
      signed_by: u.user.id,
      signature_data_url: signature,
      signer_full_name: fullName || "—",
      signer_role: role || "—",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
    };

    const { error: e2 } = await supabase.from("acta_signatures").insert(sigPayload);
    if (e2) return setError(e2.message);

    setOk("Acta creada y firmada correctamente.");
    setSignature("");
    setForm({ ...form, reason:"", sha256_hash:"", storage_reference:"", authority_request_ref:"", delivered_to:"" });
    load();
  }

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="h2">Acta de extracción (sin subir video)</div>
            <div className="muted">Registro + hash + firma digital + trazabilidad.</div>
            <hr />
            <form onSubmit={createRecordWithSignature} className="row">
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Motivo</label>
                <textarea value={form.reason} onChange={(e)=>setForm({...form, reason:e.target.value})} required placeholder="Ej: Incidente parqueadero S3. Solicitud interna para investigación." />
              </div>
              <div className="col">
                <label className="muted">Cámara (opcional)</label>
                <select value={form.camera_asset_id} onChange={(e)=>setForm({...form, camera_asset_id:e.target.value})}>
                  <option value="">(Sin cámara)</option>
                  {assets.map((a)=> <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              <div className="col">
                <label className="muted">Formato exportación</label>
                <input value={form.export_format} onChange={(e)=>setForm({...form, export_format:e.target.value})} />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">SHA-256 (obligatorio)</label>
                <input value={form.sha256_hash} onChange={(e)=>setForm({...form, sha256_hash:e.target.value})} required placeholder="hash sha256 del archivo exportado" />
              </div>
              <div className="col" style={{minWidth:"100%"}}>
                <label className="muted">Referencia de almacenamiento (ruta / NVR / repositorio)</label>
                <input value={form.storage_reference} onChange={(e)=>setForm({...form, storage_reference:e.target.value})} placeholder="NVR01/EXPORTS/2026-02-19/INC-001" />
              </div>
              <div className="col">
                <label className="muted">Oficio/Radicado (si aplica)</label>
                <input value={form.authority_request_ref} onChange={(e)=>setForm({...form, authority_request_ref:e.target.value})} placeholder="RAD-2026-00123" />
              </div>
              <div className="col">
                <label className="muted">Entregado a (si aplica)</label>
                <input value={form.delivered_to} onChange={(e)=>setForm({...form, delivered_to:e.target.value})} placeholder="SIJIN / Fiscalía / Policía" />
              </div>

              <div className="col" style={{minWidth:"100%"}}>
                <SignaturePad onChange={setSignature} />
              </div>

              {error ? <div className="col" style={{minWidth:"100%"}}><div className="card" style={{borderColor:"#ffd1d1", background:"#fff5f5"}}>{error}</div></div> : null}
              {ok ? <div className="col" style={{minWidth:"100%"}}><div className="card" style={{borderColor:"#cdebd8", background:"#f2fff7"}}>{ok}</div></div> : null}

              <div className="col" style={{minWidth:"100%"}}>
                <button>Crear y firmar acta</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="h2">Registros de custodia</div>
            <div className="muted">{records.length} registros</div>
            <hr />
            <table>
              <thead><tr><th>Fecha</th><th>Motivo</th><th>Hash</th></tr></thead>
              <tbody>
                {records.map((r)=>(
                  <tr key={r.id}>
                    <td>{new Date(r.extraction_datetime).toLocaleString()}</td>
                    <td>{(r.reason || "").slice(0,60)}{(r.reason || "").length>60?"…":""}</td>
                    <td style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", fontSize:12}}>{(r.sha256_hash||"").slice(0,18)}…</td>
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
