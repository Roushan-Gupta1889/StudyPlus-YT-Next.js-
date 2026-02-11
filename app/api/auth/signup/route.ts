import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiter: 5 signup attempts per IP every 15 minutes
const limiter = rateLimit({
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 500, // Max 500 IPs tracked
});

// Check if email is from IITM
function isIITMEmail(email: string): boolean {
    const iitmDomains = [
        '@iitm.ac.in',           // Faculty/Staff
        '@study.iitm.ac.in',     // General students
        '@ds.study.iitm.ac.in'   // BS degree students
    ];

    return iitmDomains.some(domain => email.toLowerCase().endsWith(domain));
}

// Server-side password validation
function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
        return {
            valid: false,
            error: "Password must be at least 8 characters long"
        };
    }

    // Future: Add more complexity requirements
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character

    return { valid: true };
}

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const ip = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown';

        try {
            await limiter.check(5, ip); // 5 requests per IP
        } catch {
            return NextResponse.json(
                { error: "Too many signup attempts. Please try again later." },
                { status: 429 }
            );
        }

        const { name, email, password } = await req.json();

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Server-side password validation
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                { error: passwordValidation.error },
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
