"use client";
import { useEffect, useRef, useState } from "react";

export default function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, []);

  function pos(e: any) {
    const canvas = canvasRef.current!;
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { x, y };
  }

  function start(e: any) {
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
  }

  function move(e: any) {
    if (!drawing) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    setDrawing(false);
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div>
      <div className="muted">Firma digital (trazo en pantalla). Se guarda como PNG base64.</div>
      <div style={{ marginTop: 8, borderRadius: 14, border: "1px solid #d8dbe3", overflow: "hidden", background: "#fff" }}>
        <canvas
          ref={canvasRef}
          width={520}
          height={180}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
          style={{ width: "100%", display: "block" }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="button" className="secondary" onClick={clear}>Limpiar firma</button>
      </div>
    </div>
  );
}
