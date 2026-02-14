"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await signIn("email", { email, callbackUrl: "/dashboard" });
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-navy relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-orange rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl relative z-10 mx-4">
                <div className="text-center mb-8">
                    <Link href="/">
                        <img src="/mereach.png" alt="MEREACH" className="h-8 mx-auto mb-6 brightness-0 invert" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white mb-2">Team Login</h1>
                    <p className="text-white/60 text-sm">Masukkan email tim kamu untuk menerima magic link.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nama@mereach.com"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-accent-orange transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-accent-orange hover:bg-accent-orange-hover text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "Mengirim Lint..." : "Kirim Magic Link"}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <Link href="/" className="text-white/40 hover:text-white transition-colors text-xs inline-flex items-center gap-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
