export type ExportSnapshotV1 = {
  format: "localStorage-snapshot-v1";
  exportedAt: string;
  keys: Record<string, unknown>;
  meta: {
    timezoneOffsetMinutes: number;
    userAgent?: string;
  };
};

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value; // JSONじゃなければ文字列のまま
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function defaultFilename(prefix = "volley-pwa-export"): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const ss = pad2(d.getSeconds());
  return `${prefix}-${y}${m}${day}-${hh}${mm}${ss}.json`;
}

export function buildLocalStorageSnapshot(): ExportSnapshotV1 {
  const keys: Record<string, unknown> = {};

  // 互換性重視：valleyPwa.* を主対象、volleyPwa.* があれば一緒に
  const prefixes = ["valleyPwa.", "volleyPwa."];

  // localStorage が使えない環境対策（例：一部ブラウザ設定）
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      const hit = prefixes.some((p) => k.startsWith(p));
      if (!hit) continue;

      const v = localStorage.getItem(k);
      if (v === null) continue;
      keys[k] = safeJsonParse(v);
    }
  } catch (e) {
    // ここでは例外を投げず、空のkeysで返す（UI側でメッセージを出す）
    return {
      format: "localStorage-snapshot-v1",
      exportedAt: new Date().toISOString(),
      keys: {},
      meta: {
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
    };
  }

  return {
    format: "localStorage-snapshot-v1",
    exportedAt: new Date().toISOString(),
    keys,
    meta: {
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    },
  };
}

export function downloadSnapshotJson(prefix = "volley-pwa-export"): void {
  const snapshot = buildLocalStorageSnapshot();
  const json = JSON.stringify(snapshot, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFilename(prefix);
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
