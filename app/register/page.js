"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client"; // Korrigierter Pfad
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabaseBrowser.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // Der Callback-Link, den der User in der E-Mail anklickt
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage("Fehler: " + error.message);
      setLoading(false);
    } else {
      setMessage("Erfolg! Check deine E-Mails zur Bestätigung. Danach kannst du dich einloggen.");
      setLoading(false);
      
      // Wir leiten nach der Registrierung meistens zum Login zurück, 
      // da der User erst seine Mail bestätigen muss.
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white text-black">
      <h1 className="text-2xl font-bold mb-2 text-black">🧗 Kletterer werden</h1>
      <p className="text-sm text-gray-600 mb-4">Erstelle ein Konto für dein Kletter-Radar.</p>
      
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
        <input 
          type="email" 
          placeholder="E-Mail" 
          className="p-2 border rounded bg-gray-50 text-black outline-none focus:border-blue-500"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Passwort" 
          className="p-2 border rounded bg-gray-50 text-black outline-none focus:border-blue-500"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? "Wird registriert..." : "Jetzt Registrieren"}
        </button>
      </form>

      {message && (
        <div className={`text-sm p-3 rounded mt-2 ${message.includes("Fehler") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}
      
      <button 
        onClick={() => router.push("/login")}
        className="text-sm text-blue-600 hover:underline mt-2"
      >
        Bereits ein Konto? Zum Login
      </button>
    </div>
  );
}