import { NextResponse } from "next/server";
import { createClient, getSupabaseAdmin } from "@/lib/supabase/server";
import {
  hasExpectedArrayLengths,
  needsAbilityMigration,
  normalizeAbilities,
  normalizeStyles,
} from "@/lib/utils/profile-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("profiles")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;

    const profiles = data ?? [];
    const migratedProfiles = await Promise.all(
      profiles.map(async (profile) => {
        const normalizedAbilities = normalizeAbilities(profile.abilities);
        const normalizedStyles = normalizeStyles(profile.styles);
        const requiresMigration = needsAbilityMigration(profile.abilities)
          || !Array.isArray(profile.styles)
          || profile.styles.length !== normalizedStyles.length;

        if (requiresMigration && profile.id) {
          await getSupabaseAdmin()
            .from("profiles")
            .update({ abilities: normalizedAbilities, styles: normalizedStyles, updated_at: new Date().toISOString() })
            .eq("id", profile.id);
        }

        return {
          ...profile,
          abilities: normalizedAbilities,
          styles: normalizedStyles,
        };
      })
    );

    return NextResponse.json(migratedProfiles);
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

    const { abilitiesOk, stylesOk } = hasExpectedArrayLengths(profileData);
    if (!abilitiesOk || !stylesOk) {
      return NextResponse.json(
        { error: "Ungültiges Schema: abilities/styles haben nicht die erwartete Länge." },
        { status: 400 }
      );
    }

    const upsertData = {
      name: profileData.name,
      abilities: normalizeAbilities(profileData.abilities),
      styles: normalizeStyles(profileData.styles),
      notes: profileData.notes || "",
      image_url: profileData.image_url || "",
      gym_id: null,
      updated_at: new Date().toISOString(),
    };

    if (profileData.gym_id) {
      const { data: gym, error: gymError } = await getSupabaseAdmin()
        .from("gyms")
        .select("id")
        .eq("id", profileData.gym_id)
        .maybeSingle();

      if (gymError) throw gymError;
      if (!gym) {
        return NextResponse.json({ error: "Ungültige Halle ausgewählt" }, { status: 400 });
      }

      upsertData.gym_id = gym.id;
    }

    if (isAdmin) {
      // Admin identifiziert Profile über die UUID (id)
      upsertData.id = profileData.id;
      // Falls das Profil bereits einem User gehört, behalten wir die user_id bei
      if (profileData.user_id) upsertData.user_id = profileData.user_id;
    } else {
      // Normaler User wird über seine Login-ID verknüpft
      upsertData.user_id = user.id;
    }

    const { data, error: upsertErr } = await getSupabaseAdmin()
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

    const { error } = await getSupabaseAdmin().from("profiles").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ message: "Gelöscht" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
