// Helpers
export const formatRM = (n: number | string | null | undefined) => {
  const v = Number(n ?? 0);
  return `RM${v.toFixed(2)}`;
};

export const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-MY", { year: "numeric", month: "short", day: "2-digit" });
};

export const formatDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-MY", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export const maskName = (name?: string | null) => {
  if (!name) return "—";
  return name.split(" ").map((p) => (p.length <= 2 ? p : p[0] + "*".repeat(Math.max(1, p.length - 2)) + p[p.length - 1])).join(" ");
};

export const maskIc = (ic?: string | null) => {
  if (!ic) return "—";
  if (ic.length < 6) return "******";
  return ic.slice(0, 4) + "-**-****";
};

export const generateReportRef = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `VC-${yyyy}${mm}${dd}-${rand}`;
};

export const generateApiKey = () => {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(10))).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `vc_live_${rand}`;
};
export const generateApiSecret = () => {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sec_${rand}`;
};
