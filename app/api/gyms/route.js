import { NextResponse } from "next/server";
import { createClient, getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "janstoll1993@googlemail.com";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("gyms")
      .select("id,name,city,created_at")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Nur Admins dürfen Hallen erstellen" }, { status: 403 });
    }

    const payload = await req.json();
    const name = payload?.name?.trim();
    const city = payload?.city?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: "Hallenname ist erforderlich" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("gyms")
      .insert({ name, city })
      .select("id,name,city,created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
