"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/cleaning", label: "Cleaning" },
  { href: "/laundry", label: "Laundry" },
  { href: "/library", label: "Conference Room" },
  { href: "/classroom", label: "Classroom" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="site-nav">
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "active" : ""}
        >
          {link.label}
        </a>
      ))}
      <a
        href="/manager"
        className={`nav-manager ${pathname === "/manager" ? "active" : ""}`}
      >
        Manager Login
      </a>
    </nav>
  );
}
