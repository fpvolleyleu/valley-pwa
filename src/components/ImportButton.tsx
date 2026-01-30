import React, { useRef, useState } from "react";
import { importFromExportJson, type ImportSummary } from "../lib/importValleyExport";

type Props = {
  className?: string;
  onImported?: (summary: ImportSummary) => void;
  reloadAfterImport?: boolean;
};

export function ImportButton({
  className,
  onImported,
  reloadAfterImport = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const onChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setMsg("");

    try {
      const text = await file.text();
      const summary = importFromExportJson(text);

      const lines = [
        `読み込み完了: ${summary.importedKeys.join(", ")}`,
        ...summary.stats.map((s) => {
          const p = s.players ?? "-";
          const m = s.matches ?? "-";
          const r = s.rallies ?? "-";
          return `- ${s.key}: players=${p}, matches=${m}, rallies=${r}`;
        }),
        summary.savedWeights ? "weights も保存しました" : "weights は未保存（無くてもOK）",
      ];
      setMsg(lines.join("\n"));

      onImported?.(summary);

      if (reloadAfterImport) window.location.reload();
    } catch (err) {
      const message = err instanceof Error ? err.message : "不明なエラー";
      setMsg(`読み込み失敗: ${message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={openPicker}
        disabled={busy}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: busy ? "#f5f5f5" : "#fff",
          cursor: busy ? "not-allowed" : "pointer",
          fontWeight: 700,
        }}
      >
        {busy ? "読み込み中…" : "データ読み込み（JSON）"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={onChange}
        style={{ display: "none" }}
      />

      {msg && (
        <pre
          style={{
            marginTop: 10,
            whiteSpace: "pre-wrap",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #eee",
            background: "#fafafa",
            fontSize: 12,
          }}
        >
          {msg}
        </pre>
      )}
    </div>
  );
}
