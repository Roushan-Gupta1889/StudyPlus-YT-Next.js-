import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users - Paginated user list for admin
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify admin role
        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        if (!adminUser || (adminUser as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Parse query params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 20;
        const skip = (page - 1) * limit;
        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "all"; // all, iitm, admin

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (filter === "iitm") {
            where.isIITMUser = true;
        } else if (filter === "admin") {
            where.role = "ADMIN";
        }

        // Fetch users with counts
        const [users, totalCount] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    isIITMUser: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: {
                            videos: true,
                            notes: true,
                            playlists: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({
            users: users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                image: u.image,
                isIITMUser: u.isIITMUser,
                role: (u as any).role || "USER",
                createdAt: u.createdAt,
                videosCount: u._count.videos,
                notesCount: u._count.notes,
                playlistsCount: u._count.playlists,
            })),
            totalCount,
            page,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (error) {
        console.error("[ADMIN_USERS_GET]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
