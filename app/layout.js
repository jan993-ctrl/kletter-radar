export const metadata = {
    title: "Kletter Radar",
    description: "Visuelle Kletterbewertung",
  };
  
  export default function RootLayout({ children }) {
    return (
      <html lang="de">
        <body>{children}</body>
      </html>
    );
  }
  