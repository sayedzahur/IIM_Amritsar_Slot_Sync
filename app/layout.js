import "./globals.css";
import NavLinks from "./components/NavLinks";

export const metadata = {
  title: "IIM Amritsar Campus Portal",
  description: "Cleaning, laundry, library and classroom slot booking for IIM Amritsar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            <img src="/logo.png" alt="IIM Amritsar logo" className="brand-logo" />
            <span className="brand-text">
              <span className="brand-hindi">भारतीय प्रबंध संस्थान अमृतसर</span>
              <span className="brand-english">Campus Services Portal</span>
            </span>
          </a>
          <NavLinks />
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <span>IIM Amritsar &middot; Campus Services Portal &middot; Prototype</span>
        </footer>
      </body>
    </html>
  );
}
