"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { usernameToEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const email = usernameToEmail(username);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <div className="h1">Ingreso</div>
        <div className="muted">Usuario tipo operador (ej: operador1) + contraseña</div>
        <hr />
        <form onSubmit={onSubmit} className="row">
          <div className="col" style={{ minWidth: "100%" }}>
            <label className="muted">Usuario</label>
            <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="operador1" />
          </div>
          <div className="col" style={{ minWidth: "100%" }}>
            <label className="muted">Contraseña</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error ? <div className="col" style={{ minWidth: "100%" }}><div className="card" style={{borderColor:"#ffd1d1", background:"#fff5f5"}}><b>Error:</b> {error}</div></div> : null}
          <div className="col" style={{ minWidth: "100%" }}>
            <button disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</button>
          </div>
        </form>
        <hr />
        <div className="muted small">
          Admin: crea usuarios en Supabase Auth con email {`{usuario}@sanmartin.local`} y asigna rol en <b>profiles</b>.
        </div>
      </div>
    </div>
  );
}
