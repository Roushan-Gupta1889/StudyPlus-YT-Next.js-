"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addContributor(formData: FormData) {
    const rawName = formData.get("name") as string;
    const amount = parseInt(formData.get("amount") as string);
    const message = formData.get("message") as string;
    const isAnonymous = formData.get("isAnonymous") === "on";

    const name = isAnonymous || !rawName.trim() ? "Anonymous" : rawName.trim();

    try {
        await prisma.contributor.create({
            data: {
                name,
                amount,
                message,
                isAnonymous,
            },
        });

        revalidatePath("/contributors");
        return { success: true };
    } catch (error) {
        console.error("Failed to add contributor:", error);
        return { success: false, error: "Failed to record contribution. Please try again." };
    }
}
