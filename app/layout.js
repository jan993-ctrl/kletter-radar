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
        {/* Dezente Animation im oberen Bereich */}
        <div style={animationLayer}>
          <VisualGimmick size={70} showLabel={false} />
        </div>
        
        {/* Seiteninhalt */}
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
  backgroundColor: "#f4f7f6",
  minHeight: "100vh",
  position: "relative",
  overflowX: "hidden",
};

const animationLayer = {
  position: "fixed",
  top: "20px",        // Gleicher padding wie mainStyle
  left: "50%",
  transform: "translateX(-50%)",
  height: "80px",     // Gleiche Höhe wie der Header
  zIndex: 0,
  pointerEvents: "none",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  opacity: 0.35,
};

const contentWrapper = {
  position: "relative",
  zIndex: 1,
  backgroundColor: "transparent",
  minHeight: "100vh",
};