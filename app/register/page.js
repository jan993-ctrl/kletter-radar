"use client";
import { useState } from "react";
import { supabaseBrowser } from "@lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    const { data, error } = await supabaseBrowser.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      alert("Fehler: " + error.message);
    } else {
      alert("Check deine E-Mails zur Bestätigung!");
      router.push("/admin"); // Schickt den User zum Login/Profil
    }
  };

  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>Kletterer werden</h1>
      <form onSubmit={handleRegister} style={{ display: "inline-block", textAlign: "left" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>E-Mail:</label><br/>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Passwort:</label><br/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" style={btnStyle}>Registrieren</button>
      </form>
    </main>
  );
}

const btnStyle = { padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" };