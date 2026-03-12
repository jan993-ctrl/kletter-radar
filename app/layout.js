import "./globals.css";

export const metadata = {
  title: "Kletter Radar",
  description: "Visuelle Kletterbewertung",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body style={layoutBody}>
        <div style={contentWrapper}>{children}</div>
      </body>
    </html>
  );
}

const layoutBody = {
  margin: 0,
  padding: 0,
  backgroundColor: "#f4f7f6",
  minHeight: "100vh",
  overflowX: "hidden",
};

const contentWrapper = {
  minHeight: "100vh",
};
