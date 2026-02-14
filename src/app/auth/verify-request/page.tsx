"use client";

import Link from "next/link";

export default function VerifyRequest() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-navy relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-orange rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl relative z-10 mx-4 text-center">
                <div className="mb-6">
                    <div className="w-20 h-20 bg-accent-orange/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-orange/30">
                        <svg className="w-10 h-10 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Periksa Email Kamu</h1>
                    <p className="text-white/60 text-sm">
                        Tautan masuk telah dikirim ke alamat email kamu. Silakan klik tautan tersebut untuk masuk ke dashboard.
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <Link href="/auth/signin" className="text-accent-orange hover:text-white transition-colors text-sm font-semibold">
                        Coba email lain
                    </Link>
                </div>
            </div>
        </div>
    );
}
