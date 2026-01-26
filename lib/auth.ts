import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Check if email is from IITM
function isIITMEmail(email: string): boolean {
    const iitmDomains = [
        '@iitm.ac.in',           // Faculty/Staff
        '@study.iitm.ac.in',     // General students
        '@ds.study.iitm.ac.in'   // BS degree students
    ];

    return iitmDomains.some(domain => email.toLowerCase().endsWith(domain));
}

export const authOptions: NextAuthOptions = {
    // No adapter needed for JWT sessions
    providers: [
        // Email/Password Provider
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    isIITMUser: user.isIITMUser
                };
            }
        }),

        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            // For OAuth providers, create or update user in database
            if (account?.provider === "google" && user.email) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email }
                    });

                    const isIITM = isIITMEmail(user.email);

                    if (existingUser) {
                        // Update existing user's IITM status and info if needed
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: {
                                isIITMUser: isIITM,
                                name: user.name || existingUser.name,
                                image: user.image || existingUser.image,
                            }
                        });
                        user.id = existingUser.id;
                    } else {
                        // Create new user for Google OAuth
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name || "User",
                                image: user.image,
                                isIITMUser: isIITM,
                                emailVerified: new Date(),
                            }
                        });
                        user.id = newUser.id;
                    }
                } catch (error) {
                    console.error("Error in signIn callback:", error);
                    return false;
                }
            }
            return true;
        },

        async jwt({ token, user, trigger, session }) {
            // Add user data to JWT token
            if (user) {
                token.id = user.id;
                token.isIITMUser = (user as any).isIITMUser || isIITMEmail(user.email || "");
            }

            // Handle session updates
            if (trigger === "update" && session) {
                token = { ...token, ...session };
            }

            return token;
        },

        async session({ session, token }) {
            // Add custom data to session
            if (session.user) {
                session.user.id = token.id as string;
                session.user.isIITMUser = token.isIITMUser as boolean;
            }
            return session;
        }
    },

    pages: {
        signIn: "/login",
        signOut: "/",
        error: "/login",
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,
};
