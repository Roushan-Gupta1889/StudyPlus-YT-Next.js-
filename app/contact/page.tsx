"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Mail, Clock, MapPin, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { sendContactEmail } from "@/app/actions/contact";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log("Client: Form submitted", values);
        setIsSubmitting(true);
        try {
            console.log("Client: Calling server action...");
            const result = await sendContactEmail(values);
            console.log("Client: Server action result:", result);

            if (result.success) {
                toast.success("Message sent successfully!", {
                    description: "We'll get back to you as soon as possible.",
                });
                form.reset();
            } else {
                toast.error("Something went wrong.", {
                    description: result.error || "Please try again later.",
                });
            }
        } catch (error) {
            toast.error("Error sending message", {
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="container-wide max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-16 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            Let's Connect
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
                            Got Questions? <br />
                            <span className="text-primary">We're Here to Help</span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Whether you have questions about features, need technical support, or want to share feedback — our team is ready to assist you.
                        </p>

                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
                        {/* Left Column: Contact Info Cards */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                                        <p className="text-muted-foreground text-sm mb-2">For general inquiries and support</p>
                                        <a href="mailto:hello@studyplusyt.com" className="text-foreground font-medium hover:text-primary transition-colors">
                                            studyplusyt@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Response Time</h3>
                                        <p className="text-muted-foreground text-sm mb-2">Our team is available Mon-Fri</p>
                                        <p className="text-foreground font-medium">
                                            Usually within 24 hours
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">Location</h3>
                                        <p className="text-muted-foreground text-sm mb-2">Our headquarters</p>
                                        <p className="text-foreground font-medium">
                                            Remote-first, worldwide
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Contact Form */}
                        <div className="p-8 rounded-3xl bg-card border border-border shadow-elevated relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="relative">
                                <h2 className="text-2xl font-bold mb-2">Send a Message</h2>
                                <p className="text-muted-foreground mb-8">
                                    Fill out the form below and we'll be in touch shortly.
                                </p>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                                        console.error("Form validation errors:", errors);
                                        toast.error("Please check the form for errors");
                                    })} className="space-y-6">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="John Doe" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="john@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="subject"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Subject</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="How can we help you?" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Message</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Tell us more about your inquiry..."
                                                            className="min-h-[150px] resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            size="lg"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
