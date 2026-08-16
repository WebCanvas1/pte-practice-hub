export interface ExtractedCandidate {
  prompt: string;
  options: string[];
  answer: string;
  location: string;
  warnings: string[];
}
export function normalizeImportText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function csvRows(text: string) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const out: string[] = [];
      let value = "",
        quoted = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i]!;
        if (c === '"' && line[i + 1] === '"') {
          value += '"';
          i++;
        } else if (c === '"') quoted = !quoted;
        else if (c === "," && !quoted) {
          out.push(value.trim());
          value = "";
        } else value += c;
      }
      out.push(value.trim());
      return out;
    });
}
function pdfText(bytes: Uint8Array) {
  const raw = new TextDecoder("latin1").decode(bytes);
  return [...raw.matchAll(/\(([^()]*(?:\\.[^()]*)*)\)\s*Tj/g)]
    .map((match) => match[1]!.replace(/\\([()\\])/g, "$1"))
    .join("\n");
}
export function extractImportCandidates(
  fileName: string,
  bytes: ArrayBuffer,
): ExtractedCandidate[] {
  const ext = fileName.split(".").pop()!.toLowerCase();
  let text = "";
  const warnings: string[] = [];
  if (ext === "txt" || ext === "csv") text = new TextDecoder().decode(bytes);
  else if (ext === "pdf") {
    text = pdfText(new Uint8Array(bytes));
    if (!text)
      warnings.push("PDF contains no directly extractable text; OCR/manual correction required.");
  } else {
    warnings.push(
      `${ext.toUpperCase()} extraction requires the configured AI/media provider; metadata was retained for review.`,
    );
    text = `Imported asset: ${fileName}`;
  }
  if (ext === "csv") {
    const rows = csvRows(text);
    const header = rows.shift()?.map((v) => normalizeImportText(v)) ?? [];
    return rows
      .map((row, index) => {
        const get = (...names: string[]) => {
          const i = header.findIndex((h) => names.includes(h));
          return i >= 0 ? (row[i] ?? "") : "";
        };
        const options = [
          get("option a", "option_a"),
          get("option b", "option_b"),
          get("option c", "option_c"),
          get("option d", "option_d"),
        ].filter(Boolean);
        return {
          prompt: get("prompt", "question", "text") || row[0] || "",
          options,
          answer: get("answer", "correct answer", "correct_answer"),
          location: `row ${index + 2}`,
          warnings: [...warnings],
        };
      })
      .filter((row) => row.prompt);
  }
  return text
    .split(/\n\s*\n|(?=\n(?:Q(?:uestion)?\s*\d+[:.)]))/i)
    .map((prompt, index) => ({
      prompt: prompt.trim(),
      options: [],
      answer: "",
      location: ext === "pdf" ? `page/location ${index + 1}` : `block ${index + 1}`,
      warnings: [...warnings],
    }))
    .filter((row) => row.prompt.length > 10);
}
export function importTextSimilarity(a: string, b: string) {
  if (a === b) return 1;
  const aa = new Set(a.split(" ")),
    bb = new Set(b.split(" "));
  const both = [...aa].filter((x) => bb.has(x)).length;
  return both / Math.max(1, new Set([...aa, ...bb]).size);
}
