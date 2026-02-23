import { NextResponse } from "next/server";
import { createClient, supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const profileData = await req.json();
    const ADMIN_EMAIL = "janstoll1993@googlemail.com";
    const isAdmin = user.email === ADMIN_EMAIL;

    // Sicherheits-Check für normale User
    if (!isAdmin && profileData.user_id && profileData.user_id !== user.id) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const upsertData = {
      name: profileData.name,
      abilities: profileData.abilities || [5, 5, 5, 5, 5],
      styles: profileData.styles || [0],
      notes: profileData.notes || "",
      image_url: profileData.image_url || "",
      updated_at: new Date().toISOString(),
    };

    if (isAdmin) {
      // Admin identifiziert Profile über die UUID (id)
      upsertData.id = profileData.id;
      // Falls das Profil bereits einem User gehört, behalten wir die user_id bei
      if (profileData.user_id) upsertData.user_id = profileData.user_id;
    } else {
      // Normaler User wird über seine Login-ID verknüpft
      upsertData.user_id = user.id;
    }

    const { data, error: upsertErr } = await supabaseAdmin
      .from("profiles")
      .upsert(upsertData, { 
        onConflict: isAdmin ? 'id' : 'user_id' 
      })
      .select()
      .single();

    if (upsertErr) throw upsertErr;
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ADMIN_EMAIL = "janstoll1993@googlemail.com";

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Nur Admins dürfen löschen" }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from("profiles").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ message: "Gelöscht" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}