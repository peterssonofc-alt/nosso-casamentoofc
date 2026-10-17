// Nosso Casamento no Netlify: uma função atende a página e a API, com senha.
// Dados no Netlify Blobs (um registro por item, para dois usuários editarem ao mesmo tempo sem se atropelar).
import { getStore } from "@netlify/blobs";
import page from "./page.mjs";

const USER = process.env.APP_USER || "casal";
const PASS = process.env.APP_PASSWORD || "";
const store = () => getStore({ name: "casamento", consistency: "strong" });

const enc = encodeURIComponent, dec = decodeURIComponent;
const key = (c, id) => `d/${c}/${enc(id)}`;
const H = { "cache-control": "no-store", "x-robots-tag": "noindex" };
const json = (o, status = 200, extra = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json", ...H, ...extra } });

async function sha(s) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s))));
}
async function same(a, b) {
  const [x, y] = await Promise.all([sha(a), sha(b)]);
  let d = 0; for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}
async function authed(req) {
  const h = req.headers.get("authorization") || "";
  if (!h.startsWith("Basic ")) return false;
  const [u, ...p] = new TextDecoder().decode(Uint8Array.from(atob(h.slice(6)), c => c.charCodeAt(0))).split(":");
  const a = await same(u, USER), b = await same(p.join(":"), PASS);
  return a && b;
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const it = items[i++]; await fn(it); }
  }));
}
async function readAll(s) {
  const { blobs } = await s.list({ prefix: "d/" });
  const out = {};
  await pool(blobs, 40, async b => {
    const v = await s.get(b.key, { type: "json" });
    if (v == null) return;
    const [, c, id] = b.key.split("/");
    (out[c] = out[c] || {})[dec(id)] = v;
  });
  return out;
}
const bump = async s => { const t = crypto.randomUUID(); await s.set("meta/version", t); return t; };

export default async (req) => {
  const u = new URL(req.url);
  if (u.pathname === "/health") return new Response("ok");
  if (!PASS) return new Response("Defina a variável APP_PASSWORD no Netlify para liberar o acesso.", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  if (!(await authed(req))) {
    return new Response("Senha necessária.", { status: 401, headers: { "www-authenticate": 'Basic realm="Nosso Casamento", charset="UTF-8"', "content-type": "text/plain; charset=utf-8" } });
  }
  const s = store();
  try {
    if (req.method === "GET" && (u.pathname === "/" || u.pathname === "/index.html")) {
      return new Response(page, { headers: { "content-type": "text/html; charset=utf-8", ...H } });
    }
    if (req.method === "GET" && u.pathname === "/api/all") {
      const cur = (await s.get("meta/version", { type: "text" })) || "0";
      if (u.searchParams.get("v") === cur && cur !== "0") return json({ same: true });
      return json({ version: cur, data: await readAll(s) });
    }
    if (req.method === "POST" && u.pathname === "/api/write") {
      const { op, c, id, d } = await req.json();
      if (!/^[\w-]+$/.test(c) || !/^[\w.:@+~-]+$/.test(id)) return json({ error: "bad path" }, 400);
      const k = key(c, id);
      if (op === "set") await s.setJSON(k, d);
      else if (op === "update") await s.setJSON(k, { ...((await s.get(k, { type: "json" })) || {}), ...d });
      else if (op === "delete") await s.delete(k);
      else return json({ error: "bad op" }, 400);
      return json({ version: await bump(s) });
    }
    if (req.method === "GET" && u.pathname === "/api/backup") {
      const stamp = new Date().toISOString().slice(0, 10);
      return json(await readAll(s), 200, { "content-disposition": `attachment; filename="casamento-backup-${stamp}.json"` });
    }
    if (req.method === "POST" && u.pathname === "/api/restore") {
      const obj = await req.json();
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return json({ error: "formato inválido" }, 400);
      const { blobs } = await s.list({ prefix: "d/" });
      await pool(blobs, 30, b => s.delete(b.key));
      const jobs = [];
      for (const [c, docs] of Object.entries(obj)) for (const [id, d] of Object.entries(docs || {})) jobs.push([c, id, d]);
      await pool(jobs, 30, ([c, id, d]) => s.setJSON(key(c, id), d));
      await bump(s);
      return json({ ok: true, colecoes: Object.keys(obj).length, registros: jobs.length });
    }
    return new Response("Não encontrado", { status: 404 });
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
};

export const config = { path: "/*" };
