"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  // flipPhase: 'idle' | 'out' | 'in'
  const [flipPhase, setFlipPhase] = useState("idle");
  const isChecking = false;
  const router = useRouter();

  const ADMIN_EMAIL = "janstoll1993@googlemail.com";

  // Flip-Animation: erst rausdrehen, dann Inhalt wechseln & reindrehen
  const handleFlip = () => {
    if (flipPhase !== "idle") return;
    setMessage("");
    setFlipPhase("out");

    setTimeout(() => {
      // Inhalt wechseln & Felder leeren
      setIsSignUp((prev) => !prev);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFlipPhase("in");
    }, 280);

    setTimeout(() => {
      setFlipPhase("idle");
    }, 560);
  };

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
        setMessage("Fehler: " + error.message);
        setLoading(false);
      } else if (data?.user) {
        router.refresh();
        setTimeout(() => {
          const target = data.user.email === ADMIN_EMAIL ? "/admin" : "/profile";
          window.location.replace(target);
        }, 600);
      }
    } catch (err) {
      setMessage("Ein Systemfehler ist aufgetreten.");
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (password !== confirmPassword) {
      setMessage("Fehler: Die Passwörter stimmen nicht überein.");
      return;
    }

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
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Keyframes für Flip-Animation */}
      <style>{`
        @keyframes flipOut {
          0%   { transform: perspective(1000px) rotateY(0deg);   opacity: 1; }
          100% { transform: perspective(1000px) rotateY(90deg);  opacity: 0; }
        }
        @keyframes flipIn {
          0%   { transform: perspective(1000px) rotateY(-90deg); opacity: 0; }
          100% { transform: perspective(1000px) rotateY(0deg);   opacity: 1; }
        }
        .flip-out {
          animation: flipOut 0.28s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        .flip-in {
          animation: flipIn 0.28s cubic-bezier(0, 0, 0.6, 1) forwards;
        }
      `}</style>

      <div style={pageWrapper}>
        <div
          style={loginCard}
          className={
            flipPhase === "out" ? "flip-out"
            : flipPhase === "in"  ? "flip-in"
            : ""
          }
        >
          {/* Zurück-Button oben rechts */}
          <button
            type="button"
            onClick={() => router.push("/")}
            style={backButtonStyle}
          >
            ← Home
          </button>

          <div style={headerSection}>
            <div style={iconCircle}>🧗</div>
            <h1 style={titleStyle}>Kletter-Quartett</h1>
            <p style={subtitleStyle}>
              {isSignUp ? "Neues Konto anlegen" : "Bereit für die nächste Route?"}
            </p>
          </div>

          <form
            onSubmit={isSignUp ? handleSignUp : handleSignIn}
            style={formStyle}
          >
            <div style={inputGroup}>
              <label style={labelStyle}>E-Mail Adresse</label>
              <input
                type="email"
                placeholder="name@beispiel.de"
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div style={inputGroup}>
              <label style={labelStyle}>Passwort</label>
              <input
                type="password"
                placeholder="••••••••"
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
              />
            </div>

            {/* Passwort bestätigen – nur im Registrierungs-Modus */}
            {isSignUp && (
              <div style={inputGroup}>
                <label style={labelStyle}>Passwort bestätigen</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  style={inputStyle}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            <div style={buttonContainer}>
              <button
                type="submit"
                disabled={loading}
                style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}
              >
                {loading
                  ? "Wird geladen..."
                  : isSignUp
                  ? "Registrieren"
                  : "Einloggen"}
              </button>

              <button
                type="button"
                onClick={handleFlip}
                disabled={loading || flipPhase !== "idle"}
                style={secondaryBtn}
              >
                {isSignUp ? "Zurück zum Login" : "Konto erstellen"}
              </button>
            </div>
          </form>

          {message && (
            <div
              style={{
                ...messageBox,
                backgroundColor: message.includes("Fehler") ? "#fff5f5" : "#f0f9ff",
                color: message.includes("Fehler") ? "#c53030" : "#007bff",
                border: `1px solid ${
                  message.includes("Fehler") ? "#feb2b2" : "#bee3f8"
                }`,
              }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// STYLES
const pageWrapper = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  padding: "20px",
};

const loginCard = {
  position: "relative",
  width: "100%",
  maxWidth: "420px",
  backgroundColor: "#ffffff",
  padding: "40px",
  borderRadius: "24px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  textAlign: "center",
};

const backButtonStyle = {
  position: "absolute",
  top: "20px",
  right: "20px",
  background: "none",
  border: "none",
  color: "#888",
  fontSize: "0.85rem",
  cursor: "pointer",
  fontWeight: "500",
};

const headerSection = {
  marginBottom: "30px",
};

const iconCircle = {
  fontSize: "2.5rem",
  marginBottom: "10px",
  display: "inline-block",
};

const titleStyle = {
  fontSize: "1.8rem",
  fontWeight: "800",
  color: "#1a202c",
  margin: "0 0 5px 0",
  letterSpacing: "-0.5px",
};

const subtitleStyle = {
  color: "#718096",
  fontSize: "0.95rem",
  margin: 0,
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const inputGroup = {
  textAlign: "left",
};

const labelStyle = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#4a5568",
  marginBottom: "6px",
  marginLeft: "4px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "2px solid #edf2f7",
  backgroundColor: "#f7fafc",
  fontSize: "1rem",
  outline: "none",
  transition: "border-color 0.2s ease",
  color: "#2d3748",
  boxSizing: "border-box",
};

const buttonContainer = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "10px",
};

const primaryBtn = {
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  backgroundColor: "#007bff",
  color: "white",
  fontSize: "1rem",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(0,123,255,0.3)",
  transition: "transform 0.1s active",
};

const secondaryBtn = {
  padding: "12px",
  borderRadius: "12px",
  border: "2px solid #edf2f7",
  backgroundColor: "transparent",
  color: "#4a5568",
  fontSize: "0.95rem",
  fontWeight: "600",
  cursor: "pointer",
};

const messageBox = {
  marginTop: "25px",
  padding: "12px",
  borderRadius: "12px",
  fontSize: "0.85rem",
  lineHeight: "1.4",
};