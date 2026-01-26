import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Detect IITM email
        const isIITM = isIITMEmail(email);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isIITMUser: isIITM
            },
            select: {
                id: true,
                name: true,
                email: true,
                isIITMUser: true
            }
        });

        return NextResponse.json(
            {
                message: "User created successfully",
                user,
                isIITMUser: isIITM
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
