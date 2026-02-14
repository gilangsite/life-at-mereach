"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Dashboard() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary-navy text-white">
                <p className="animate-pulse">Loading Dashboard...</p>
            </div>
        );
    }

    if (!session) {
        return null; // Handled by middleware
    }

    return (
        <div className="min-h-screen bg-surface-gray">
            <nav className="bg-primary-navy text-white p-4 shadow-lg">
                <div className="container flex justify-between items-center">
                    <Link href="/">
                        <img src="/mereach.png" alt="MEREACH" className="h-6 brightness-0 invert" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{session.user?.email}</span>
                        <button
                            onClick={() => signOut()}
                            className="text-xs bg-accent-orange px-3 py-1 rounded hover:bg-accent-orange-hover transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container py-12">
                <div className="bg-white rounded-xl shadow-premium p-8 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-primary-navy mb-2">Team Dashboard</h1>
                    <p className="text-secondary mb-8">Selamat datang kembali di pusat kendali MEREACH.</p>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-6 bg-surface-gray rounded-lg border border-border-color">
                            <h3 className="font-semibold mb-1">Partner Submissions</h3>
                            <p className="text-2xl font-bold text-accent-orange">0</p>
                        </div>
                        <div className="p-6 bg-surface-gray rounded-lg border border-border-color">
                            <h3 className="font-semibold mb-1">Teman MEREACH</h3>
                            <p className="text-2xl font-bold text-accent-orange">0</p>
                        </div>
                        <div className="p-6 bg-surface-gray rounded-lg border border-border-color">
                            <h3 className="font-semibold mb-1">Event Attendees</h3>
                            <p className="text-2xl font-bold text-accent-orange">0</p>
                        </div>
                    </div>

                    <div className="mt-12 p-12 text-center border-2 border-dashed border-border-color rounded-xl">
                        <p className="text-light italic">Penyelarasan dengan Google Sheets sedang disiapkan...</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
