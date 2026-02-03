// app/page.js (Server Component)
import { supabaseServer } from "@lib/supabase-server";
import ProfilesViewer from "@components/ProfilesViewer";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Daten abrufen
  const { data: profiles, error } = await supabaseServer
    .from("profiles")
    .select("*")
    .order('id', { ascending: true });

  if (error) {
    console.error("Fehler beim Laden der Profile:", error);
    return (
      <main style={{ padding: 20 }}>
        <h1>Kletterprofile (öffentlich)</h1>
        <p>Fehler beim Laden der Profile. Bitte versuche es später erneut.</p>
      </main>
    );
  }

return (
    <main style={{ padding: 20 }}>
      <h1>Kletterprofile (öffentlich)</h1>
      <ProfilesViewer initialProfiles={profiles ?? []} />
    </main>
  );
}