// app/api/profiles/route.js

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic"; // <--- Diese Zeile hinzufügen

// GET -> public: alle Profile lesen
export async function GET() {
  console.log("DEBUG: Verbinde mit URL:", process.env.SUPABASE_URL);
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error("GET /api/profiles error:", error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST -> admin: Profile speichern (Supabase Auth)
export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userData, error: userErr } =
      await supabaseServer.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await req.json();

    const { error: upsertErr } = await supabaseServer
      .from("profiles")
      .upsert(
        {
          id: profile.id,
          name: profile.name,
          abilities: profile.abilities,
          styles: profile.styles,
          notes: profile.notes,
        },
        { onConflict: "id" }
      );

    if (upsertErr) {
      console.error("Upsert error:", upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    const { data: all, error: allErr } =
      await supabaseServer.from("profiles").select("*");

    if (allErr) {
      return NextResponse.json({ error: allErr.message }, { status: 500 });
    }

    return NextResponse.json(all);
  } catch (err) {
    console.error("POST /api/profiles error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
