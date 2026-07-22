// ---------------------------------------------------------------------------
// products.js  —  a founder's plans/products (their pricing catalog).
//
// Each plan is just { name, baseUSD, interval, externalId }. saasevenly charges
// the LOCALIZED amount per visitor at checkout time, so the founder never has to
// create per-currency prices in their gateway. Backed by Supabase → async.
// ---------------------------------------------------------------------------
import { requireDb } from "./db";

export async function listProducts(tenantId) {
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM products WHERE tenant_id = ${tenantId}
    ORDER BY sort ASC, id ASC`;
  return rows.map(rowToProduct);
}

export async function getProduct(tenantId, productId) {
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM products WHERE id = ${productId} AND tenant_id = ${tenantId}`;
  return rows[0] ? rowToProduct(rows[0]) : null;
}

// Allowed billing intervals.
const INTERVALS = ["month", "quarter", "year"];
function normInterval(v) {
  return INTERVALS.includes(v) ? v : "month";
}

export async function createProduct(tenantId, { name, baseUSD, interval, externalId }) {
  const sql = requireDb();
  const max = await sql`SELECT MAX(sort) AS m FROM products WHERE tenant_id = ${tenantId}`;
  const sort = (max[0].m ?? -1) + 1;
  const rows = await sql`
    INSERT INTO products (tenant_id, name, base_usd, interval, external_id, sort)
    VALUES (
      ${tenantId},
      ${String(name || "Plan")},
      ${Number(baseUSD) || 0},
      ${normInterval(interval)},
      ${externalId ? String(externalId) : null},
      ${sort}
    )
    RETURNING *`;
  return rowToProduct(rows[0]);
}

export async function updateProduct(tenantId, productId, fields) {
  const cur = await getProduct(tenantId, productId);
  if (!cur) return null;
  const sql = requireDb();
  const rows = await sql`
    UPDATE products SET
      name = ${fields.name ?? cur.name},
      base_usd = ${fields.baseUSD === undefined ? cur.baseUSD : Number(fields.baseUSD) || 0},
      interval = ${INTERVALS.includes(fields.interval) ? fields.interval : cur.interval},
      external_id = ${fields.externalId === undefined ? cur.externalId : fields.externalId || null}
    WHERE id = ${productId} AND tenant_id = ${tenantId}
    RETURNING *`;
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export async function deleteProduct(tenantId, productId) {
  const sql = requireDb();
  await sql`DELETE FROM products WHERE id = ${productId} AND tenant_id = ${tenantId}`;
}

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    baseUSD: Number(row.base_usd),
    interval: row.interval,
    externalId: row.external_id,
    sort: row.sort,
  };
}
