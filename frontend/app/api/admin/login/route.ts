import { NextResponse } from "next/server";
import crypto from "crypto";

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_COOKIE_SECRET;

  if (!adminEmail || !adminPassword || !secret) {
    return NextResponse.json(
      { error: "Configuração do admin ausente (.env.local)" },
      { status: 500 }
    );
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  // Token simples assinado (MVP)
  const payload = JSON.stringify({ email, role: "ADMIN", ts: Date.now() });
  const signature = sign(payload, secret);
  const token = Buffer.from(payload).toString("base64") + "." + signature;

  const res = NextResponse.json({ ok: true });

  res.cookies.set("bs_admin", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8h
  });

  return res;
}