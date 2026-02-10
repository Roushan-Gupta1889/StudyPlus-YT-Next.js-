"use server";

import { z } from "zod";
import nodemailer from "nodemailer";

const contactFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export async function sendContactEmail(data: ContactFormData) {
    const result = contactFormSchema.safeParse(data);

    if (!result.success) {
        console.error("Validation Error:", result.error);
        return { success: false, error: "Invalid form data" };
    }

    const { name, email, subject, message } = result.data;

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        console.log("Verifying SMTP connection...");
        await transporter.verify();
        console.log("SMTP connection verified.");

        await transporter.sendMail({
            from: `"StudyPlus Contact" <${process.env.EMAIL_USER}>`,
            to: "studyplusyt@gmail.com",
            replyTo: email || undefined,
            subject: `📩 ${subject}`,
            text: `
Name: ${name}
Email: ${email || "Not provided"}

Message:
${message}
      `,
        });

        return { success: true };
    } catch (err: any) {
        console.error("MAIL ERROR:", err);
        return { success: false, error: err.message || "Failed to send email" };
    }
}
