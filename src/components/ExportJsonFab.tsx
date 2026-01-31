import { useMemo, useState } from "react";
import { downloadSnapshotJson, buildLocalStorageSnapshot } from "../utils/exportSnapshotJson";

export default function ExportJsonFab() {
  const [msg, setMsg] = useState<string | null>(null);

  const hasAnyKeys = useMemo(() => {
    const snap = buildLocalStorageSnapshot();
    return Object.keys(snap.keys ?? {}).length > 0;
  }, []);

  const onClick = () => {
    try {
      downloadSnapshotJson("volley-pwa-export");
      setMsg("JSONをダウンロードしました");
      window.setTimeout(() => setMsg(null), 1800);
    } catch {
      setMsg("JSONの書き出しに失敗しました");
      window.setTimeout(() => setMsg(null), 2200);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {msg && (
        <div
          style={{
            pointerEvents: "none",
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(0,0,0,0.55)",
            color: "white",
            fontSize: 12,
            maxWidth: 260,
          }}
        >
          {msg}
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        title="データ(JSON)をバックアップ"
        style={{
          pointerEvents: "auto",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 999,
          padding: "10px 14px",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          fontWeight: 700,
          letterSpacing: 0.5,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
        }}
      >
        JSON{hasAnyKeys ? "" : "（空）"}
      </button>
    </div>
  );
}
