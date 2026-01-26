import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Comparison } from "@/components/landing/Comparison";
import { Features } from "@/components/landing/Features";
import { AppPreview } from "@/components/landing/AppPreview";
import { WhyStudyPlus } from "@/components/landing/WhyStudyPlus";
import { Testimonials } from "@/components/landing/Testimonials";
import { Contact } from "@/components/landing/Contact";
import { CTA } from "@/components/landing/CTA";
import { InstallPrompt } from "@/components/landing/InstallPrompt";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Comparison />
        <Features />
        <AppPreview />
        <WhyStudyPlus />
        <Testimonials />
        <Contact />
        <CTA />
      </main>
      <Footer />
      <InstallPrompt />
    </div>
  );
}
