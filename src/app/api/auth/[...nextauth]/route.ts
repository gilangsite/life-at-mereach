import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { resend } from "@/lib/resend";

export const authOptions = {
    providers: [
        EmailProvider({
            server: {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            },
            from: process.env.EMAIL_FROM,
            async sendVerificationRequest({ identifier: email, url, provider }) {
                const { from } = provider;
                try {
                    await resend.emails.send({
                        from: from as string,
                        to: email,
                        subject: `Verify your login to MEREACH`,
                        html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #ff751f;">MEREACH</h2>
                <p>Hello,</p>
                <p>Click the button below to sign in to your MEREACH dashboard.</p>
                <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #ff751f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Sign In</a>
                <p style="font-size: 12px; color: #666; margin-top: 20px;">If you did not request this email, you can safely ignore it.</p>
              </div>
            `,
                    });
                } catch (error) {
                    console.error("SEND_VERIFICATION_EMAIL_ERROR", error);
                    throw new Error("SEND_VERIFICATION_EMAIL_ERROR");
                }
            },
        }),
    ],
    pages: {
        signIn: "/auth/signin",
        verifyRequest: "/auth/verify-request",
    },
    callbacks: {
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
    },
};

export default NextAuth(authOptions);
