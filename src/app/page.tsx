"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeModal = () => setActiveModal(null);
  const openModal = (id: string) => setActiveModal(id);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`nav ${isScrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo-link">
            <img
              src={isScrolled ? "/mereach.png" : "/mereach.png"}
              alt="MEREACH"
              className="nav-logo"
              style={{ filter: isScrolled ? "none" : "brightness(0) invert(1)" }}
            />
          </Link>
          <button
            className={`nav-menu-btn ${isMenuOpen ? "active" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`nav-dropdown ${isMenuOpen ? "active" : ""}`}>
            <a href="#propose" className="nav-dropdown-item">Teman MEREACH</a>
            <a href="#propose" className="nav-dropdown-item">Partner MEREACH</a>
            <a href="#events" className="nav-dropdown-item">Event Terdekat</a>
            <a href="#kuliah" className="nav-dropdown-item">Kuliah di MEREACH</a>
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", margin: "8px 0" }}></div>
            <Link
              href="/dashboard"
              className="nav-dropdown-item font-semibold text-accent-orange flex items-center"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 mr-1 text-accent-orange">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Login Team Mereach
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="hero">
        <div className="hero-grid"></div>
        <div className="hero-content">
          <h1 className="hero-title dominating">
            <span className="text-gradient-white">LIFE AFTER</span>
            <span className="text-gradient">MEREACH</span>
          </h1>
          <p className="hero-subtitle">
            Bantu mengubah hidup kamu <br className="hidden md:block" /> bebas finansial di usia muda
          </p>
        </div>
      </section>

      {/* Propose Section */}
      <section className="propose section" id="propose">
        <div className="container">
          <h2 className="propose-title text-primary-navy">Will you be my?</h2>
          <div className="propose-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => openModal("teman")}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Teman MEREACH
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => openModal("partner")}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Partner MEREACH
            </button>
          </div>
        </div>
      </section>

      {/* Auth Modal Integration - Concept Link */}
      <div className="text-center p-8 bg-surface-gray">
        <p className="text-secondary mb-4">Sistem Authentikasi Baru Sedang Dipersiapkan</p>
        <button
          onClick={() => signIn('email')}
          className="px-6 py-2 bg-primary-navy text-white rounded-lg hover:opacity-90 transition-all font-medium"
        >
          Test Magic Link Login (Resend)
        </button>
        <p className="text-xs text-light mt-2 italic">Memerlukan setup DNS record (SPF/DKIM)</p>
      </div>

      {/* Success/Error Modals and other sections will be migrated in subsequent steps */}

      {/* Footer */}
      <footer className="footer py-8 bg-white border-t border-border-color">
        <div className="container text-center">
          <img src="/mereach.png" alt="MEREACH" className="h-8 mx-auto mb-4" />
          <p className="text-secondary text-sm">© 2026 MEREACH. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
