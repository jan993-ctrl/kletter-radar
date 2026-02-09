"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@lib/supabase-browser";

const GRADES = [
  "1a", "1b", "1c", "2a", "2b", "2c", "3a", "3b", "3c", 
  "4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", 
  "7a", "7b", "7c", "8a", "8b", "8c", "9a"
];

const ABILITY_LABELS = ["Kraft", "Beweglichkeit", "Mental", "Ausdauer", "Technik"];

export default function MyPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) {
        window.location.href = "/admin";
        return;
      }

      let { data } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', user.id) 
        .single();

      if (!data) {
        setProfile({ 
          id: user.id, 
          name: user.email.split('@')[0], 
          abilities: [5, 5, 5, 0, 0], 
          styles: [12], 
          image_url: ""
        });
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !profile) return;
    
    setUploading(true);
    // Name ist immer gleich -> User-ID
    const fileName = `avatar-${profile.id}`;
    
    try {
      // 1. Upload mit { upsert: true } -> erlaubt das Überschreiben
      const { error: uploadError } = await supabaseBrowser.storage
        .from('profiles')
        .upload(fileName, file, {
          upsert: true // WICHTIG: Erlaubt das Ersetzen der Datei
        });
      
      if (uploadError) throw uploadError;
      
      // 2. Die öffentliche URL generieren
      const { data: urlData } = supabaseBrowser.storage
        .from('profiles')
        .getPublicUrl(fileName);
      
      // Cache-Buster (?t=...): Verhindert, dass der Browser das alte Bild anzeigt
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // 3. Sofort in der Datenbank speichern
      const { error: dbError } = await supabaseBrowser
        .from('profiles')
        .update({ image_url: publicUrl })
        .eq('id', profile.id);

      if (dbError) throw dbError;

      // 4. UI aktualisieren
      setProfile({ ...profile, image_url: publicUrl });
      alert("Bild aktualisiert!");

    } catch (err) {
      console.error(err);
      alert("Fehler: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const { error } = await supabaseBrowser
      .from('profiles')
      .upsert(profile);

    if (!error) {
      alert("Profil erfolgreich gespeichert!");
      window.location.href = "/";
    } else {
      alert("Fehler: " + error.message);
    }
  };

  if (loading) return <div style={{ textAlign: "center", marginTop: "50px" }}>Lade...</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif", paddingBottom: "100px" }}>
      <button onClick={() => window.location.href = "/"} style={backBtnStyle}>← Abbrechen</button>
      
      <h1>Profil bearbeiten</h1>

      <div style={sectionStyle}>
        <h3>Dein Foto</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={avatarPreviewStyle}>
             {profile.image_url ? (
               <img src={profile.image_url} style={imgStyle} alt="Vorschau" />
             ) : (
               <span style={{ fontSize: "2rem" }}>👤</span>
             )}
          </div>
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
        </div>
      </div>

      <div style={sectionStyle}>
        <h3>Dein Name</h3>
        <input 
          value={profile.name} 
          onChange={e => setProfile({...profile, name: e.target.value})} 
          style={inputStyle}
        />
      </div>

      <div style={sectionStyle}>
        <h3>Skills (0-10)</h3>
        {ABILITY_LABELS.map((label, i) => (
          <div key={label} style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{label}</span>
              <b>{profile.abilities[i]}</b>
            </div>
            <input 
              type="range" min="0" max="10" 
              value={profile.abilities[i]} 
              onChange={e => {
                const newAbilities = [...profile.abilities];
                newAbilities[i] = parseInt(e.target.value);
                setProfile({...profile, abilities: newAbilities});
              }}
              style={{ width: "100%" }}
            />
          </div>
        ))}
      </div>

      <div style={sectionStyle}>
        <h3>Bester Onsight Grad</h3>
        <div style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", color: "#28a745" }}>
           {GRADES[profile.styles[0]] || "1a"}
        </div>
        <input 
          type="range" min="0" max="24" 
          value={profile.styles[0]} 
          onChange={e => {
            setProfile({...profile, styles: [parseInt(e.target.value)]});
          }}
          style={{ width: "100%" }}
        />
      </div>

      <button onClick={handleSave} style={saveBtnStyle} disabled={uploading}>
        {uploading ? "Wird geladen..." : "Änderungen speichern"}
      </button>
    </div>
  );
}

// Styles (nur die wichtigsten)
const sectionStyle = { backgroundColor: "#fff", padding: "20px", borderRadius: "15px", marginBottom: "20px", border: "1px solid #eee" };
const backBtnStyle = { background: "none", border: "none", color: "#666", cursor: "pointer", marginBottom: "10px" };
const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" };
const saveBtnStyle = { position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: "560px", padding: "16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" };
const avatarPreviewStyle = { width: "70px", height: "70px", borderRadius: "50%", backgroundColor: "#f0f0f0", overflow: "hidden", border: "2px solid #eee", display: "flex", justifyContent: "center", alignItems: "center" };
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" };