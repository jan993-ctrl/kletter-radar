import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px", fontFamily: "sans-serif" }}>
      <h1>Hoppla! 🧗</h1>
      <p>Bei der Anmeldung ist etwas schiefgelaufen.</p>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>
        Der Link ist eventuell abgelaufen oder wurde bereits verwendet.
      </p>
      <Link href="/login">
        <button style={{ 
          padding: "10px 20px", 
          backgroundColor: "#007bff", 
          color: "white", 
          border: "none", 
          borderRadius: "5px", 
          cursor: "pointer" 
        }}>
          Zurück zum Login
        </button>
      </Link>
    </div>
  );
}