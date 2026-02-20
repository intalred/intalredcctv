"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return <Link className={`navlink ${active ? "active" : ""}`} href={href}>{label}</Link>;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return router.replace("/login");
      setEmail(data.user.email || "");
      const { data: p } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).single();
      setRole(p?.role || "");
    })();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <img src="/logo-intalred.png" alt="INTAL RED" style={{height:44}} />
          <div>
            <div className="h1">CCTV San Martín (ISO) · INTAL RED</div>
          <div className="muted">Inventario · Bitácora · Tickets · OT · Custodia (firma) · Auditoría · KPI/OKR</div>
            
          </div>
          
        </div>
        <div>
          <button className="secondary" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <nav>
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/assets" label="Inventario" />
          <NavLink href="/shift" label="Bitácora" />
          <NavLink href="/tickets" label="Tickets" />
          <NavLink href="/work-orders" label="OT Mantenimiento" />
          <NavLink href="/custody" label="Custodia" />
          <NavLink href="/audit" label="Auditoría ISO" />
        </nav>
      </div>

      <div style={{ marginTop: 14 }}>{children}</div>
    </div>
  );
}
