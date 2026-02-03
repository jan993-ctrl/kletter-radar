// app/page.js (Server Component)
import ProfilesViewer from "@components/ProfilesViewer";
import { supabaseServer } from "@lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Page() {
  // Daten abrufen
  const { data: profiles, error } = await supabaseServer
    .from("profiles")
    .select("*")
    .order('id', { ascending: true });

  // Debug-Informationen sammeln
  const dbUrl = process.env.SUPABASE_URL || "URL nicht gefunden";
  const profileCount = profiles?.length || 0;

  if (error) {
    console.error("Public page load error:", error);
    return (
      <main style={{ padding: 20 }}>
        <h1>Kletterprofile (öffentlich)</h1>
        <p>Fehler beim Laden der Profile: {error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      {/* Gelbe Debug-Box: Nur solange wir das Sync-Problem suchen */}
      <div style={{ 
        background: '#fff3cd', 
        border: '1px solid #ffeeba', 
        padding: '10px', 
        marginBottom: '20px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>DEBUG-INFO:</strong><br />
        Verbunden mit DB: <span style={{color: 'red'}}>{dbUrl}</span><br />
        Gefundene Profile in dieser DB: <strong>{profileCount}</strong>
      </div>

      <h1>Kletterprofile (öffentlich)</h1>
      
      <ProfilesViewer initialProfiles={profiles ?? []} />
      
      {/* Ein kleiner Hinweis, falls die Liste leer ist */}
      {profiles?.length === 0 && <p>Keine Profile in dieser Datenbank gefunden.</p>}
    </main>
  );
}