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
        {/* Die Animation wird global im Hintergrund gerendert */}
        <VisualGimmick />
        
        {/* Der children-Inhalt (deine Seiten) liegt darüber */}
        <div style={contentWrapper}>
          {children}
        </div>
      </body>
    </html>
  );
}

// Styles direkt im Layout für maximale Kontrolle
const layoutBody = {
  margin: 0,
  padding: 0,
  backgroundColor: "#f8fafc", // Ein sauberes, helles Grau-Blau
  minHeight: "100vh",
  position: "relative",
  overflowX: "hidden", // Verhindert Scrollen durch die Animation
};

const contentWrapper = {
  position: "relative",
  zIndex: 1, // Sicherstellen, dass Buttons etc. über der Animation liegen
};