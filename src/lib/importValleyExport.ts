export type ImportSummary = {
  importedKeys: string[];
  savedWeights: boolean;
  stats: Array<{
    key: string;
    players?: number;
    matches?: number;
    rallies?: number;
  }>;
};

type AnyObj = Record<string, unknown>;

function isObject(v: unknown): v is AnyObj {
  return typeof v === "object" && v !== null;
}

function safeJsonStringify(value: unknown) {
  return JSON.stringify(value);
}

function safeSetItem(key: string, value: unknown) {
  localStorage.setItem(key, safeJsonStringify(value));
}

function safeGetItemParsed(key: string): unknown | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function extractDump(root: unknown): Record<string, unknown> | null {
  // 形式A: raw.localStorage.dump
  if (isObject(root)) {
    const raw = root["raw"];
    if (isObject(raw)) {
      const ls = raw["localStorage"];
      if (isObject(ls)) {
        const dump = ls["dump"];
        if (isObject(dump)) return dump as Record<string, unknown>;
      }
    }
  }

  // 形式B: dump 直下
  if (isObject(root) && isObject(root["dump"])) {
    return root["dump"] as Record<string, unknown>;
  }

  // 形式C: { "valleyPwa.db.v2": {...}, ... } 直下
  if (isObject(root) && Object.keys(root).some((k) => k.includes("db"))) {
    return root as Record<string, unknown>;
  }

  return null;
}

function extractWeights(root: unknown): unknown | null {
  if (isObject(root) && "weights" in root) return (root as AnyObj)["weights"] ?? null;
  return null;
}

function buildStatsForKey(key: string, value: unknown) {
  if (!isObject(value)) return { key };

  const players = Array.isArray((value as AnyObj)["players"])
    ? ((value as AnyObj)["players"] as unknown[]).length
    : undefined;
  const matches = Array.isArray((value as AnyObj)["matches"])
    ? ((value as AnyObj)["matches"] as unknown[]).length
    : undefined;
  const rallies = Array.isArray((value as AnyObj)["rallies"])
    ? ((value as AnyObj)["rallies"] as unknown[]).length
    : undefined;

  return { key, players, matches, rallies };
}

export function importFromExportJson(jsonText: string): ImportSummary {
  let root: unknown;
  try {
    root = JSON.parse(jsonText);
  } catch {
    throw new Error("JSONのパースに失敗しました（ファイルが壊れている/JSONではない可能性）");
  }

  const dump = extractDump(root);
  if (!dump) {
    throw new Error("対応していない形式です（raw.localStorage.dump か dump を含むJSONを読み込んでください）");
  }

  const keys = Object.keys(dump);
  if (keys.length === 0) {
    throw new Error("dump の中身が空です");
  }

  // 既存データをバックアップ（取り込み対象キーだけ）
  const backupKey = `valleyPwa.importBackup.${new Date().toISOString()}`;
  const backup: Record<string, unknown> = {};
  for (const k of keys) backup[k] = safeGetItemParsed(k);

  const prevWeights = safeGetItemParsed("valleyPwa.weights.v1");
  if (prevWeights !== null) backup["valleyPwa.weights.v1"] = prevWeights;

  safeSetItem(backupKey, backup);

  // 復元
  const importedKeys: string[] = [];
  for (const k of keys) {
    try {
      safeSetItem(k, dump[k]);
      importedKeys.push(k);
    } catch {
      throw new Error(`localStorage への保存に失敗: ${k}（容量不足の可能性）`);
    }
  }

  // weights もあれば保存（閲覧側で使うなら）
  let savedWeights = false;
  const weights = extractWeights(root);
  if (weights != null) {
    try {
      safeSetItem("valleyPwa.weights.v1", weights);
      savedWeights = true;
    } catch {
      savedWeights = false;
    }
  }

  const stats = importedKeys.map((k) => buildStatsForKey(k, dump[k]));
  safeSetItem("valleyPwa.lastImportedAt", { at: new Date().toISOString(), keys: importedKeys, backupKey });

  return { importedKeys, savedWeights, stats };
}
