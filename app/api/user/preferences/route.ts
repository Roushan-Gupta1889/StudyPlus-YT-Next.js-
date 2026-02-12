import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/user/preferences - Get user preferences
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let preferences = await prisma.userPreferences.findUnique({
            where: { userId: user.id },
        });

        // Create default preferences if none exist
        if (!preferences) {
            preferences = await prisma.userPreferences.create({
                data: {
                    userId: user.id,
                },
            });
        }

        return NextResponse.json(preferences);
    } catch (error) {
        console.error("[USER_PREFERENCES_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

// PATCH /api/user/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { dailyReminders, weeklyReports, newFeatures } = body;

        // Validate boolean fields
        const updates: any = {};
        if (typeof dailyReminders === "boolean") updates.dailyReminders = dailyReminders;
        if (typeof weeklyReports === "boolean") updates.weeklyReports = weeklyReports;
        if (typeof newFeatures === "boolean") updates.newFeatures = newFeatures;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No valid preferences provided" }, { status: 400 });
        }

        const preferences = await prisma.userPreferences.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                ...updates,
            },
            update: updates,
        });

        return NextResponse.json(preferences);
    } catch (error) {
        console.error("[USER_PREFERENCES_PATCH]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
