import "./globals.css";
import VisualGimmick from "@/components/VisualGimmick";

export const metadata = {
  title: "Kletter Radar",
  description: "Visuelle Kletterbewertung",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body style={layoutBody}>
        {/* Der fixierte Layer für die zentrierte, kleine Kugel oben */}
        <div style={animationLayer}>
          <VisualGimmick size={200} showLabel={false} />
        </div>
        
        {/* Der eigentliche Inhalt liegt darüber */}
        <div style={contentWrapper}>
          {children}
        </div>
      </body>
    </html>
  );
}

const layoutBody = {
  margin: 0,
  padding: 0,
  /* Dunkler Hintergrund passend zum Dark-Mode AI Look */
  backgroundColor: "#020408", 
  minHeight: "100vh",
  position: "relative",
  overflowX: "hidden",
  color: "#f8fafc", // Standard-Textfarbe auf Hell setzen
};

const animationLayer = {
  position: "fixed",
  top: "10px",     // Kleiner Abstand zum oberen Rand
  left: "50%",     // Horizontal in die Mitte
  transform: "translateX(-50%)", // Exakte Zentrierung
  zIndex: 0,       // Basis-Ebene
  pointerEvents: "none", // Klicks gehen durch zum Content
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  opacity: 0.7,    // Dezente Transparenz für den Header-Look
};

const contentWrapper = {
  position: "relative",
  zIndex: 1,       // Liegt definitiv ÜBER der Animation
  backgroundColor: "transparent", 
  minHeight: "100vh",
  paddingTop: "100px", // Genug Platz, damit der Inhalt nicht von der Kugel verdeckt wird
};