// ---------------------------------------------------------------------------
// /api/products  —  manage the logged-in founder's plans.
//   GET                      list
//   POST   {name,baseUSD,interval,externalId}   create
//   PATCH  {id,...}          update
//   DELETE ?id=              remove
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getCurrentTenant } from "@/lib/auth";
import { listProducts, createProduct, updateProduct, deleteProduct } from "@/lib/products";

export async function GET() {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  return NextResponse.json({ products: await listProducts(tenant.id) });
}

export async function POST(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const product = await createProduct(tenant.id, body);
  return NextResponse.json({ ok: true, product });
}

export async function PATCH(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const product = await updateProduct(tenant.id, body.id, body);
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(request) {
  const tenant = await getCurrentTenant();
  if (!tenant) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  await deleteProduct(tenant.id, Number(id));
  return NextResponse.json({ ok: true });
}
