// app/page.js
export default async function Page() {
  const { data: profiles, error } = await supabaseServer
    .from("profiles")
    .select("*");

  // Wir zeigen die URL und die Anzahl der Profile an
  const dbUrl = process.env.SUPABASE_URL;
  const profileCount = profiles?.length || 0;

  return (
    <main style={{ padding: 20 }}>
      <div style={{ background: '#eee', padding: '10px', fontSize: '12px', marginBottom: '20px' }}>
        <p><strong>DB URL:</strong> {dbUrl}</p>
        <p><strong>Anzahl Profile:</strong> {profileCount}</p>
      </div>
      
      <h1>Kletterprofile (öffentlich)</h1>
      <ProfilesViewer initialProfiles={profiles ?? []} />
    </main>
  );
}