import ProfilesViewer from "@/app/components/ProfilesViewer";
import { readProfilesSync } from "@/lib/profiles";

export default function Page() {
  const profiles = readProfilesSync(); // Server Component: lädt JSON direkt vom FS
  return (
    <main style={{ padding: 20 }}>
      <h1>Kletterprofile (öffentliche Ansicht)</h1>
      <ProfilesViewer initialProfiles={profiles} />
    </main>
  );
}
