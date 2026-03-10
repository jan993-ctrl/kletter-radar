"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isChecking = false;
  const router = useRouter();

  const ADMIN_EMAIL = "janstoll1993@googlemail.com";

  const handleSignIn = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Login Fehler:", error.message);
        setMessage("Fehler: " + error.message);
        setLoading(false);
      } else if (data?.user) {
        console.log("Login erfolgreich, synchronisiere...");
        setMessage("Erfolgreich! Leite weiter...");

        // Refresh löscht den alten Cache
        router.refresh();

        // Wir warten 600ms, damit der Cookie sicher im Browser-Speicher landet
        setTimeout(() => {
          const target = data.user.email === ADMIN_EMAIL ? "/admin" : "/profile";

          // REPLACE ist hier der Schlüssel. Es verhindert das Zurückspringen.
          window.location.replace(target);
        }, 600);
      }
    } catch (err) {
      console.error("Unerwarteter Fehler:", err);
      setMessage("Ein Systemfehler ist aufgetreten.");
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setMessage("");
    const { error } = await supabaseBrowser.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage("Fehler: " + error.message);
    } else {
      setMessage("Check deine E-Mails! Bestätige den Link, dann logge dich hier ein.");
    }
    setLoading(false);
  };

  if (isChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-black">Initialisierung...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white text-black">
      <h1 className="text-2xl font-bold mb-2 text-black">🧗 Kletter-Quartett</h1>
      <p className="text-sm text-gray-600 mb-4">Melde dich an, um dein Profil zu verwalten.</p>
      <button
        type="button"
        onClick={() => router.push("/")}
        style={{ padding: "8px 15px", cursor: "pointer", borderRadius: 4, border: "1px solid #ccc", backgroundColor: "white", color: "black", alignSelf: "flex-start" }}
      >
        ← Zurück zur Startseite
      </button>
      
      <div className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="E-Mail" 
          className="p-2 border rounded bg-gray-50 text-black outline-none focus:border-blue-500"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          autoComplete="email"
        />
        <input 
          type="password" 
          placeholder="Passwort" 
          className="p-2 border rounded bg-gray-50 text-black outline-none focus:border-blue-500"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          autoComplete="current-password"
        />
        
        <div className="flex gap-2 mt-2">
          <button 
            type="button"
            onClick={handleSignIn} 
            disabled={loading} 
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded flex-1 font-medium disabled:opacity-50 transition-all"
          >
            {loading ? "Lädt..." : "Login"}
          </button>
          <button 
            type="button"
            onClick={handleSignUp} 
            disabled={loading} 
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded flex-1 font-medium disabled:opacity-50 transition-all"
          >
            Registrieren
          </button>
        </div>
      </div>

      {message && (
        <div className={`text-sm p-3 rounded mt-2 ${message.includes("Fehler") ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
          {message}
        </div>
      )}
    </div>
  );
}
