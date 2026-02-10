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

      console.log("Eingeloggter User ID:", user.id);

      let { data, error } = await supabaseBrowser
        .from('profiles')
        .select('*')
        .eq('id', user.id) 
        .single();

      if (error || !data) {
        console.log("Kein Profil gefunden, erstelle lokales Backup...");
        setProfile({ 
          id: user.id, 
          name: user.email.split('@')[0], 
          abilities: [5, 5, 5, 0, 0], 
          styles: [12], 
          image_url: ""
        });
      } else {
        console.log("Profil geladen:", data);
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
    const fileName = `avatar-${profile.id}`;
    
    try {
      // 1. Storage Upload
      const { error: uploadError } = await supabaseBrowser.storage
        .from('profiles')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // 2. URL generieren
      const { data: urlData } = supabaseBrowser.storage
        .from('profiles')
        .getPublicUrl(fileName);
      
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // --- DEBUG LOGS ---
      console.log("Versuche in DB zu speichern...");
      console.log("Ziel-URL:", publicUrl);
      console.log("Ziel-ID:", profile.id);

      // 3. Datenbank Update (Wir nutzen .select() um zu sehen ob eine Zeile betroffen ist)
      const { data: updateResult, error: dbError } = await supabaseBrowser
        .from('profiles')
        .update({ image_url: publicUrl })
        .eq('id', profile.id)
        .select();

      if (dbError) throw dbError;
      
      console.log("DB Update Resultat:", updateResult);

      if (updateResult.length === 0) {
        console.error("Warnung: Keine Zeile in der DB wurde aktualisiert. Existiert die ID?");
      }

      // 4. UI State aktualisieren
      setProfile(prev => ({ ...prev, image_url: publicUrl }));
      alert("Bild erfolgreich hochgeladen!");

    } catch (err) {
      console.error("Fehler im Upload-Prozess:", err);
      alert("Fehler: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    console.log("Speichere gesamtes Profil:", profile);
    
    // Wir nutzen update statt upsert, um sicherzugehen, dass wir nur die eigene ID treffen
    const { id, ...updateData } = profile;
    const { error } = await supabaseBrowser
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      alert("Profil erfolgreich gespeichert!");
      window.location.href = "/";
    } else {
      console.error("Fehler beim Speichern des Profils:", error);
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
        {uploading && <p style={{ color: "blue", fontSize: "0.8rem" }}>Bild wird verarbeitet...</p>}
      </div>

      <div style={sectionStyle}>
        <h3>Dein Name</h3>
        <input 
          value={profile.name || ""} 
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

// Styles
const sectionStyle = { backgroundColor: "#fff", padding: "20px", borderRadius: "15px", marginBottom: "20px", border: "1px solid #eee" };
const backBtnStyle = { background: "none", border: "none", color: "#666", cursor: "pointer", marginBottom: "10px" };
const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd" };
const saveBtnStyle = { position: "fixed", bottom: "20px", left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: "560px", padding: "16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" };
const avatarPreviewStyle = { width: "70px", height: "70px", borderRadius: "50%", backgroundColor: "#f0f0f0", overflow: "hidden", border: "2px solid #eee", display: "flex", justifyContent: "center", alignItems: "center" };
const imgStyle = { width: "100%", height: "100%", objectFit: "cover" };