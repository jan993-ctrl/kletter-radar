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
  backgroundColor: "#020408", 
  minHeight: "100vh",
  position: "relative",
  overflowX: "hidden",
  color: "#f8fafc",
};

const animationLayer = {
  position: "fixed",
  top: "10px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 2,       // ← Geändert: jetzt ÜBER dem Content
  pointerEvents: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  opacity: 0.7,
};

const contentWrapper = {
  position: "relative",
  zIndex: 1,
  backgroundColor: "transparent", 
  minHeight: "100vh",
  paddingTop: "100px",
};
