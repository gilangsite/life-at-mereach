"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

// ⚠️  Ganti dengan URL Web App Google Apps Script kamu setelah deploy
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID_HERE/exec";

// Info rekening pembayaran
const PAYMENT_INFO = {
  bank: "Bank BCA",
  noRek: "715 084 2829",
  atasNama: "Annisa Rahmalia Agustina",
  nominal: "Rp 50.000",
};

// Event details
const EVENT_INFO = {
  nama: "Warisan Berkah: Ngabuburit Asuransi Syariah Untuk Masa Depan Keluarga",
  tempat: "Sudirman 7.8, Jl. Jenderal Sudirman No.Kav. 7-8, Jakarta 10220",
  hari: "Selasa, 10 Maret 2026",
  waktu: "16.00 WIB – Menjelang Magrib",
};

interface FormData {
  nama: string;
  email: string;
  whatsapp: string;
  domisili: string;
  status: string;
  pekerjaan: string;
  income: string;
  sumber: string;
  namaReferral: string;
}

export default function WarisanBerkahPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nama: "",
    email: "",
    whatsapp: "",
    domisili: "",
    status: "",
    pekerjaan: "",
    income: "",
    sumber: "",
    namaReferral: "",
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (!isSubmitting) setShowPaymentModal(false);
      }
    };
    if (showPaymentModal) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [showPaymentModal, isSubmitting]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 5MB.");
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setErrorMsg("");
  };

  const handleOpenPaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    const required: (keyof FormData)[] = [
      "nama", "email", "whatsapp", "domisili", "status", "pekerjaan", "income", "sumber",
    ];
    for (const key of required) {
      if (!formData[key]) {
        setErrorMsg(`Mohon lengkapi field: ${key === "namaReferral" ? "Nama Pengundang" : key.charAt(0).toUpperCase() + key.slice(1)}`);
        return;
      }
    }
    if (formData.sumber === "Referral" && !formData.namaReferral) {
      setErrorMsg("Mohon isi nama pengundang untuk referral.");
      return;
    }
    setErrorMsg("");
    setShowPaymentModal(true);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
    });

  const handleFinalSubmit = async () => {
    if (!proofFile) {
      setErrorMsg("Mohon upload bukti transfer terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const base64File = await fileToBase64(proofFile);

      const payload = {
        ...formData,
        fileName: proofFile.name,
        fileType: proofFile.type,
        fileBase64: base64File,
        eventNama: EVENT_INFO.nama,
        eventTempat: EVENT_INFO.tempat,
        eventHari: EVENT_INFO.hari,
        eventWaktu: EVENT_INFO.waktu,
      };

      const response = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload),
        mode: "no-cors",
      });

      // no-cors mode returns opaque response, assume success
      setIsSuccess(true);
      setShowPaymentModal(false);
    } catch (err) {
      setErrorMsg("Terjadi kesalahan saat mengirim data. Mohon coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (isSuccess) {
    return (
      <div style={styles.successPage}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>🎉</div>
          <h1 style={styles.successTitle}>Pendaftaran Berhasil!</h1>
          <p style={styles.successSubtitle}>
            Halo <strong>{formData.nama}</strong>, terima kasih telah mendaftar!
          </p>
          <div style={styles.successInfo}>
            <p>📅 <strong>{EVENT_INFO.hari}</strong></p>
            <p>⏰ <strong>{EVENT_INFO.waktu}</strong></p>
            <p>📍 <strong>{EVENT_INFO.tempat}</strong></p>
          </div>
          <p style={styles.successNote}>
            Kami telah mengirimkan email konfirmasi & undangan ke <strong>{formData.email}</strong>. Cek inbox (atau spam) kamu ya!
          </p>
          <Link href="/" style={styles.backBtn}>← Kembali ke Beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Navigation */}
      <nav style={{ ...styles.nav, ...(isScrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <Link href="/">
            <img
              src="/mereach.png"
              alt="MEREACH"
              style={{
                height: 32,
                filter: isScrolled ? "none" : "brightness(0) invert(1)",
                transition: "filter 0.25s ease",
              }}
            />
          </Link>
          <Link href="/" style={isScrolled ? styles.navLinkDark : styles.navLinkLight}>
            ← Beranda
          </Link>
        </div>
      </nav>

      {/* Hero Poster */}
      <div style={styles.heroSection}>
        <div style={styles.heroOverlay} />
        <div style={styles.posterWrapper}>
          <Image
            src="/poster-webinar.png"
            alt="Warisan Berkah - Ngabuburit Asuransi Syariah"
            width={500}
            height={700}
            style={styles.posterImg}
            priority
          />
        </div>
        <div style={styles.heroTextBlock}>
          <div style={styles.heroBadge}>🕌 Ngabuburit Edition</div>
          <h1 style={styles.heroTitle}>Warisan Berkah</h1>
          <p style={styles.heroSubtitle}>
            Ngabuburit Asuransi Syariah Untuk Masa Depan Keluarga
          </p>
          <div style={styles.eventMetaGrid}>
            <div style={styles.eventMetaItem}>
              <span style={styles.metaIcon}>📍</span>
              <span>{EVENT_INFO.tempat}</span>
            </div>
            <div style={styles.eventMetaItem}>
              <span style={styles.metaIcon}>📅</span>
              <span>{EVENT_INFO.hari}</span>
            </div>
            <div style={styles.eventMetaItem}>
              <span style={styles.metaIcon}>⏰</span>
              <span>{EVENT_INFO.waktu}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Benefit Section */}
        <section style={styles.benefitSection}>
          <h2 style={styles.sectionTitle}>🎁 Benefit Peserta — Ngabuburit Edition</h2>
          <div style={styles.ticketBadge}>
            💰 Harga Tiket: <strong>Rp 50.000</strong>
          </div>
          <div style={styles.benefitGrid}>
            {[
              { icon: "🍽️", text: "Konsumsi Berbuka Puasa Bersama" },
              { icon: "🕌", text: "Ceramah Ustadz Devin Halim Wijaya" },
              { icon: "👨‍💼", text: "Konsultasi Finansial Personal GRATIS" },
              { icon: "🎁", text: "Goodie Bag + E-book + Merchandise Allianz" },
              { icon: "📜", text: "Certificate Kehadiran" },
            ].map((b, i) => (
              <div key={i} style={styles.benefitCard}>
                <span style={styles.benefitIcon}>{b.icon}</span>
                <span style={styles.benefitText}>{b.text}</span>
              </div>
            ))}
          </div>
          <div style={styles.bonusBanner}>
            <div style={styles.bonusTitle}>🔥 BONUS untuk yang Submit Aplikasi</div>
            <div style={styles.bonusText}>
              💰 <strong>Diskon 10%</strong> dari kontribusi bulan pertama asuransi syariah
            </div>
          </div>
        </section>

        {/* Registration Form */}
        <section style={styles.formSection}>
          <h2 style={styles.sectionTitle}>📋 Form Pendaftaran</h2>
          <p style={styles.formSubtitle}>
            Isi data berikut untuk mendaftar. Konfirmasi akan dikirim ke email kamu.
          </p>

          <form onSubmit={handleOpenPaymentModal} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Lengkap *</label>
                <input
                  id="reg-nama"
                  name="nama"
                  type="text"
                  placeholder="Contoh: Ahmad Fauzi"
                  value={formData.nama}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="email@kamu.com"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>No. WhatsApp *</label>
                <input
                  id="reg-whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="081234567890"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Domisili *</label>
                <input
                  id="reg-domisili"
                  name="domisili"
                  type="text"
                  placeholder="Contoh: Jakarta Selatan"
                  value={formData.domisili}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status *</label>
                <select
                  id="reg-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">-- Pilih Status --</option>
                  <option value="Sudah Berkeluarga">Sudah Berkeluarga</option>
                  <option value="Belum Berkeluarga">Belum Berkeluarga</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pekerjaan *</label>
                <input
                  id="reg-pekerjaan"
                  name="pekerjaan"
                  type="text"
                  placeholder="Contoh: Karyawan Swasta"
                  value={formData.pekerjaan}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Income / Penghasilan *</label>
                <select
                  id="reg-income"
                  name="income"
                  value={formData.income}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">-- Pilih Rentang --</option>
                  <option value="<10 Juta">&lt; 10 Juta</option>
                  <option value="10-20 Juta">10 – 20 Juta</option>
                  <option value=">20 Juta">&gt; 20 Juta</option>
                  <option value="Tidak Menjawab">Tidak Menjawab</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mengetahui Info dari *</label>
                <select
                  id="reg-sumber"
                  name="sumber"
                  value={formData.sumber}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">-- Pilih Sumber --</option>
                  <option value="Instagram">Instagram</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Referral">Referral (diundang seseorang)</option>
                </select>
              </div>
            </div>

            {formData.sumber === "Referral" && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Nama Pengundang *</label>
                <input
                  id="reg-referral"
                  name="namaReferral"
                  type="text"
                  placeholder="Siapa yang mengundangmu?"
                  value={formData.namaReferral}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            )}

            {errorMsg && !showPaymentModal && (
              <div style={styles.errorBanner}>{errorMsg}</div>
            )}

            <button type="submit" id="btn-daftar" style={styles.submitBtn}>
              🎟️ Daftar Event — Rp 50.000
            </button>
          </form>
        </section>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <img src="/mereach.png" alt="MEREACH" style={{ height: 28, marginBottom: 12 }} />
        <p style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
          © 2026 MEREACH. All rights reserved.
        </p>
      </footer>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={styles.modalBackdrop}>
          <div ref={modalRef} style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>💳 Pembayaran Tiket</h2>
              <button
                onClick={() => { if (!isSubmitting) setShowPaymentModal(false); }}
                style={styles.modalClose}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.paymentBanner}>
                <span>Event ini berbayar sebesar</span>
                <strong style={styles.paymentAmountBig}>Rp 50.000</strong>
              </div>

              <p style={{ marginBottom: 8, fontSize: "0.9rem", color: "#64748B" }}>
                Silakan transfer ke rekening berikut:
              </p>

              <div style={styles.rekCard}>
                <div style={styles.rekRow}>
                  <span style={styles.rekLabel}>Bank</span>
                  <strong style={styles.rekValue}>{PAYMENT_INFO.bank}</strong>
                </div>
                <div style={styles.rekDivider} />
                <div style={styles.rekRow}>
                  <span style={styles.rekLabel}>No. Rekening</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ ...styles.rekValue, letterSpacing: 2, fontSize: "1.1rem" }}>
                      {PAYMENT_INFO.noRek}
                    </strong>
                    <button
                      onClick={() => copyToClipboard(PAYMENT_INFO.noRek.replace(/ /g, ""))}
                      style={styles.copyBtn}
                      title="Salin nomor rekening"
                    >
                      {copyFeedback ? "✅" : "📋"}
                    </button>
                  </div>
                </div>
                <div style={styles.rekDivider} />
                <div style={styles.rekRow}>
                  <span style={styles.rekLabel}>Atas Nama</span>
                  <strong style={styles.rekValue}>{PAYMENT_INFO.atasNama}</strong>
                </div>
              </div>

              {/* File Upload */}
              <div style={styles.uploadSection}>
                <p style={styles.uploadLabel}>
                  📸 Upload Bukti Transfer <span style={{ color: "#ef4444" }}>*</span>
                </p>
                <div
                  style={styles.uploadDropzone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {proofPreview ? (
                    <div style={{ textAlign: "center" }}>
                      <img
                        src={proofPreview}
                        alt="Preview bukti transfer"
                        style={styles.uploadPreview}
                      />
                      <p style={{ fontSize: "0.78rem", color: "#64748B", marginTop: 6 }}>
                        {proofFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", color: "#94A3B8" }}>
                      <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>📁</div>
                      <p style={{ fontSize: "0.88rem" }}>Klik atau drag foto bukti transfer</p>
                      <p style={{ fontSize: "0.75rem", marginTop: 4 }}>JPG, PNG, PDF — maks. 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="bukti-transfer"
                />
                {proofPreview && (
                  <button
                    onClick={() => { setProofFile(null); setProofPreview(null); }}
                    style={styles.removeFileBtn}
                  >
                    Ganti File
                  </button>
                )}
              </div>

              {errorMsg && <div style={styles.errorBanner}>{errorMsg}</div>}

              <button
                id="btn-konfirmasi"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !proofFile}
                style={{
                  ...styles.confirmBtn,
                  ...(isSubmitting || !proofFile ? styles.confirmBtnDisabled : {}),
                }}
              >
                {isSubmitting ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={styles.spinner} />
                    Mengirim Data...
                  </span>
                ) : (
                  "✅ Konfirmasi Pendaftaran"
                )}
              </button>
              <p style={styles.modalNote}>
                Setelah konfirmasi, undangan & detail event akan dikirim ke email kamu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── STYLES ─────────────────── */
const ORANGE = "#ff751f";
const NAVY = "#0F1724";
const SURFACE = "#F7F7F8";

const styles: { [key: string]: React.CSSProperties } = {
  pageWrapper: {
    minHeight: "100vh",
    fontFamily: "Inter, -apple-system, sans-serif",
    backgroundColor: "#ffffff",
    color: NAVY,
  },

  /* Nav */
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 72,
    zIndex: 1000,
    transition: "all 0.25s ease",
    background: "transparent",
  },
  navScrolled: {
    background: "rgba(255,255,255,0.9)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(15,23,36,0.06)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  navInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navLinkLight: {
    color: "rgba(255,255,255,0.85)",
    fontSize: "0.875rem",
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.2s",
  },
  navLinkDark: {
    color: NAVY,
    fontSize: "0.875rem",
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.2s",
  },

  /* Hero */
  heroSection: {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${NAVY} 0%, #1a2a1a 50%, #0a1a0a 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 60,
    padding: "100px 24px 60px",
    position: "relative",
    overflow: "hidden",
    flexWrap: "wrap",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: `
      radial-gradient(circle at 10% 40%, rgba(255,117,31,0.12) 0%, transparent 45%),
      radial-gradient(circle at 90% 60%, rgba(34,197,94,0.08) 0%, transparent 45%)
    `,
    pointerEvents: "none",
  },
  posterWrapper: {
    position: "relative",
    zIndex: 2,
    borderRadius: 20,
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
    flexShrink: 0,
  },
  posterImg: {
    width: 340,
    height: "auto",
    display: "block",
    maxWidth: "100%",
  },
  heroTextBlock: {
    position: "relative",
    zIndex: 2,
    maxWidth: 520,
    color: "#ffffff",
  },
  heroBadge: {
    display: "inline-block",
    background: "rgba(255,117,31,0.2)",
    border: "1px solid rgba(255,117,31,0.4)",
    borderRadius: 999,
    padding: "6px 16px",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#ff9149",
    marginBottom: 20,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
    fontWeight: 800,
    lineHeight: 1.05,
    marginBottom: 12,
    background: "linear-gradient(135deg, #ffffff 0%, #ffd4b2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSubtitle: {
    fontSize: "clamp(1rem, 2vw, 1.25rem)",
    color: "rgba(255,255,255,0.7)",
    lineHeight: 1.5,
    marginBottom: 32,
    fontWeight: 400,
  },
  eventMetaGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  eventMetaItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    fontSize: "0.92rem",
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.4,
  },
  metaIcon: {
    fontSize: "1.1rem",
    flexShrink: 0,
    marginTop: 1,
  },

  /* Main content */
  mainContent: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "60px 24px 80px",
  },

  /* Benefit */
  benefitSection: {
    marginBottom: 64,
  },
  sectionTitle: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: 700,
    color: NAVY,
    marginBottom: 20,
  },
  ticketBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: `linear-gradient(135deg, ${ORANGE}, #ff9149)`,
    color: "#fff",
    fontWeight: 600,
    borderRadius: 12,
    padding: "12px 24px",
    fontSize: "1.1rem",
    marginBottom: 28,
    boxShadow: "0 8px 24px rgba(255,117,31,0.3)",
  },
  benefitGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
    marginBottom: 28,
  },
  benefitCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: SURFACE,
    borderRadius: 14,
    padding: "14px 18px",
    border: "1px solid rgba(15,23,36,0.06)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  benefitIcon: {
    fontSize: "1.5rem",
    flexShrink: 0,
  },
  benefitText: {
    fontSize: "0.88rem",
    fontWeight: 500,
    color: NAVY,
    lineHeight: 1.3,
  },
  bonusBanner: {
    background: `linear-gradient(135deg, ${NAVY} 0%, #1a2a3a 100%)`,
    borderRadius: 16,
    padding: "20px 24px",
    color: "#fff",
    border: "1px solid rgba(255,117,31,0.2)",
  },
  bonusTitle: {
    fontWeight: 700,
    fontSize: "1rem",
    marginBottom: 6,
    color: "#ff9149",
  },
  bonusText: {
    fontSize: "0.92rem",
    color: "rgba(255,255,255,0.85)",
  },

  /* Form */
  formSection: {
    background: "#fff",
    borderRadius: 24,
    border: "1px solid rgba(15,23,36,0.08)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.06)",
    padding: "40px 36px",
  },
  formSubtitle: {
    fontSize: "0.92rem",
    color: "#64748B",
    marginBottom: 32,
    marginTop: -8,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: NAVY,
  },
  input: {
    padding: "12px 16px",
    border: "1.5px solid rgba(15,23,36,0.12)",
    borderRadius: 10,
    fontSize: "0.9rem",
    color: NAVY,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
    background: "#fafafa",
  },
  select: {
    padding: "12px 16px",
    border: "1.5px solid rgba(15,23,36,0.12)",
    borderRadius: 10,
    fontSize: "0.9rem",
    color: NAVY,
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
    background: "#fafafa",
    cursor: "pointer",
    appearance: "auto",
  },
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: "0.88rem",
    color: "#dc2626",
    fontWeight: 500,
  },
  submitBtn: {
    marginTop: 8,
    padding: "18px 32px",
    background: `linear-gradient(135deg, ${ORANGE} 0%, #ff9149 100%)`,
    color: "#fff",
    fontWeight: 700,
    fontSize: "1.05rem",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(255,117,31,0.3)",
    transition: "transform 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
    letterSpacing: "0.01em",
  },

  /* Footer */
  footer: {
    background: SURFACE,
    borderTop: "1px solid rgba(15,23,36,0.06)",
    padding: "40px 24px",
    textAlign: "center",
  },

  /* Modal */
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modal: {
    background: "#ffffff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 40px 100px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 28px 0",
  },
  modalTitle: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: NAVY,
    margin: 0,
  },
  modalClose: {
    background: SURFACE,
    border: "none",
    borderRadius: 999,
    width: 36,
    height: 36,
    cursor: "pointer",
    fontSize: "1rem",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
  },
  modalBody: {
    padding: "20px 28px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  paymentBanner: {
    background: `linear-gradient(135deg, ${ORANGE} 0%, #ff9149 100%)`,
    borderRadius: 14,
    padding: "16px 20px",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.9rem",
  },
  paymentAmountBig: {
    fontSize: "1.4rem",
    fontWeight: 800,
  },
  rekCard: {
    background: SURFACE,
    borderRadius: 14,
    padding: "16px 20px",
    border: "1px solid rgba(15,23,36,0.08)",
  },
  rekRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 0",
  },
  rekLabel: {
    fontSize: "0.82rem",
    color: "#64748B",
    fontWeight: 500,
  },
  rekValue: {
    fontSize: "0.92rem",
    color: NAVY,
    fontWeight: 600,
  },
  rekDivider: {
    height: 1,
    background: "rgba(15,23,36,0.07)",
    margin: "4px 0",
  },
  copyBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "2px 4px",
  },
  uploadSection: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  uploadLabel: {
    fontSize: "0.88rem",
    fontWeight: 600,
    color: NAVY,
    margin: 0,
  },
  uploadDropzone: {
    border: "2px dashed rgba(15,23,36,0.15)",
    borderRadius: 14,
    padding: "28px 20px",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
    background: SURFACE,
    minHeight: 120,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadPreview: {
    maxWidth: "100%",
    maxHeight: 180,
    borderRadius: 10,
    objectFit: "contain",
  },
  removeFileBtn: {
    alignSelf: "flex-start",
    background: "transparent",
    border: "1px solid rgba(15,23,36,0.15)",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: "0.8rem",
    color: "#64748B",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  confirmBtn: {
    padding: "16px 24px",
    background: `linear-gradient(135deg, ${ORANGE} 0%, #ff9149 100%)`,
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    border: "none",
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(255,117,31,0.3)",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
  confirmBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(255,255,255,0.4)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  modalNote: {
    fontSize: "0.78rem",
    color: "#94A3B8",
    textAlign: "center",
    margin: 0,
    lineHeight: 1.5,
  },

  /* Success */
  successPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `linear-gradient(160deg, ${NAVY} 0%, #0a1a0a 100%)`,
    padding: 24,
  },
  successCard: {
    background: "#fff",
    borderRadius: 28,
    padding: "48px 40px",
    maxWidth: 500,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
  },
  successIcon: {
    fontSize: "4rem",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    color: NAVY,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: "1rem",
    color: "#64748B",
    marginBottom: 24,
  },
  successInfo: {
    background: SURFACE,
    borderRadius: 14,
    padding: "16px 20px",
    textAlign: "left",
    fontSize: "0.9rem",
    lineHeight: 1.8,
    marginBottom: 20,
    border: "1px solid rgba(15,23,36,0.07)",
    color: NAVY,
  },
  successNote: {
    fontSize: "0.88rem",
    color: "#64748B",
    lineHeight: 1.6,
    marginBottom: 28,
  },
  backBtn: {
    display: "inline-block",
    padding: "14px 28px",
    background: `linear-gradient(135deg, ${ORANGE} 0%, #ff9149 100%)`,
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
    borderRadius: 12,
    fontSize: "0.95rem",
    boxShadow: "0 8px 24px rgba(255,117,31,0.3)",
  },
};
