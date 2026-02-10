"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send, MapPin, Clock, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Use sonner directly
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { sendContactEmail } from "@/app/actions/contact";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function Contact() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
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
    setIsSubmitting(true);
    try {
      const result = await sendContactEmail(values);

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

  const infoCards = [
    {
      icon: Mail,
      title: "Email Us",
      content: (
        <a
          href="mailto:hello@studyplusyt.com"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          studyplusyt@gmail.com
        </a>
      ),
    },
    {
      icon: Clock,
      title: "Response Time",
      content: <p className="text-muted-foreground">Usually within 24 hours</p>,
    },
    {
      icon: MapPin,
      title: "Location",
      content: <p className="text-muted-foreground">Remote-first, worldwide</p>,
    },
  ];

  return (
    <section ref={ref} id="contact" className="py-24 relative overflow-hidden">
      {/* Animated background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div
        className={`absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl transition-all duration-1000 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
      />
      <div
        className={`absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
      />

      <div className="container-wide relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Info */}
          <div className="space-y-8">
            <div
              className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Let's Connect
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Got Questions?<br />
                <span className="text-primary">We're Here to Help</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you have questions about features, need technical support, or want to share feedback — our team is ready to assist you.
              </p>
            </div>

            <div className="space-y-4">
              {infoCards.map((card, index) => (
                <div
                  key={card.title}
                  className={`flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-card transition-all duration-500 group ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    }`}
                  style={{ transitionDelay: isVisible ? `${200 + index * 100}ms` : "0ms" }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <card.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{card.title}</h4>
                    {card.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Form */}
          <div
            className={`relative transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
          >
            <div className={`absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl transition-opacity duration-700 ${isVisible ? "opacity-50" : "opacity-0"
              }`} />
            <div className="relative bg-card rounded-2xl border border-border p-8 md:p-10 shadow-xl hover:shadow-2xl transition-shadow duration-500">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">Send a Message</h3>
                <p className="text-muted-foreground">Fill out the form and we'll be in touch.</p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                  console.error("Form validation errors:", errors);
                  toast.error("Please check the form for errors");
                })} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} className="bg-background/50 border-border/50 focus:border-primary h-12" />
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
                            <Input placeholder="john@example.com" {...field} className="bg-background/50 border-border/50 focus:border-primary h-12" />
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
                          <Input placeholder="How can we help you?" {...field} className="bg-background/50 border-border/50 focus:border-primary h-12" />
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
                            className="bg-background/50 border-border/50 focus:border-primary resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold group"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Send Message
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
