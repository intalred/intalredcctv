"use client";
import Shell from "@/components/Shell";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [kpi, setKpi] = useState<any>(null);
  const [okr, setOkr] = useState<any[]>([]);
  const [counts, setCounts] = useState<any>({ assets: 0, tickets_open: 0, wo_open: 0 });

  useEffect(() => {
    (async () => {
      const month = new Date(); month.setDate(1);
      const { data: k } = await supabase.from("kpi_snapshots").select("*").eq("period_month", month.toISOString().slice(0,10)).maybeSingle();
      setKpi(k || null);

      const { data: o } = await supabase.from("okrs").select("*").order("created_at", { ascending: false }).limit(5);
      setOkr(o || []);

      const { count: ac } = await supabase.from("assets").select("*", { count: "exact", head: true });
      const { count: tc } = await supabase.from("tickets").select("*", { count: "exact", head: true }).neq("status", "VERIFICADO");
      const { count: wc } = await supabase.from("work_orders").select("*", { count: "exact", head: true }).neq("status", "VERIFICADA");
      setCounts({ assets: ac || 0, tickets_open: tc || 0, wo_open: wc || 0 });
    })();
  }, []);

  return (
    <Shell>
      <div className="row">
        <div className="col">
          <div className="card">
            <div className="h2">KPIs del mes (snapshot)</div>
            <div className="muted">Carga desde <b>kpi_snapshots</b>. Si no hay snapshot del mes, verás “—”.</div>
            <hr />
            <div className="row">
              <div className="col">
                <span className="badge">Disponibilidad</span>
                <div className="kpi">{kpi ? `${kpi.availability_pct}%` : "—"}</div>
              </div>
              <div className="col">
                <span className="badge">% Cámaras operativas</span>
                <div className="kpi">{kpi ? `${kpi.cameras_operational_pct}%` : "—"}</div>
              </div>
              <div className="col">
                <span className="badge">MTTR (h)</span>
                <div className="kpi">{kpi ? `${kpi.mttr_hours}` : "—"}</div>
              </div>
              <div className="col">
                <span className="badge">Preventivo</span>
                <div className="kpi">{kpi ? `${kpi.preventive_compliance_pct}%` : "—"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="h2">Estado operativo</div>
            <div className="muted">Conteos en tiempo real (no snapshot).</div>
            <hr />
            <div className="row">
              <div className="col"><span className="badge">Activos</span><div className="kpi">{counts.assets}</div></div>
              <div className="col"><span className="badge">Tickets abiertos</span><div className="kpi">{counts.tickets_open}</div></div>
              <div className="col"><span className="badge">OT abiertas</span><div className="kpi">{counts.wo_open}</div></div>
            </div>
            <hr />
            <div className="h3">OKR recientes</div>
            <div className="muted">Se cargan desde <b>okrs</b>.</div>
            <div style={{ marginTop: 8 }}>
              {okr.length ? (
                <table>
                  <thead><tr><th>Trimestre</th><th>Objetivo</th><th>Progreso</th></tr></thead>
                  <tbody>
                    {okr.map((o)=> (
                      <tr key={o.id}>
                        <td>{o.quarter}</td>
                        <td>{o.objective}</td>
                        <td><span className="badge">{o.progress_pct}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="muted">— Sin OKR aún.</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="h2">Parqueadero S1–S4</div>
        <div className="muted">
          Recomendado en ISO: marcar criticidad ALTA en entradas/salidas, rampas, cajas de pago y accesos peatonales.
        </div>
      </div>
    </Shell>
  );
}
