import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TermsPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-32 pb-20">
                <div className="container-wide max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
                    <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                        <p>Last updated: {new Date().toLocaleDateString()}</p>

                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Agreement to Terms</h2>
                            <p>
                                By accessing our website, specific services accessible via StudyPlus YT, you agree to be bound by these Terms of Service,
                                all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                                If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Use License</h2>
                            <p>
                                Permission is granted to temporarily download one copy of the materials (information or software) on StudyPlus YT's website for personal,
                                non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-4">
                                <li>modify or copy the materials;</li>
                                <li>use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
                                <li>attempt to decompile or reverse engineer any software contained on StudyPlus YT's website;</li>
                                <li>remove any copyright or other proprietary notations from the materials; or</li>
                                <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-4">3. YouTube Terms of Service</h2>
                            <p>
                                Our service interacts with YouTube. By using StudyPlus YT, you are also agreeing to be bound by the YouTube Terms of Service,
                                which can be found at <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.youtube.com/t/terms</a>.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Disclaimer</h2>
                            <p>
                                The materials on StudyPlus YT's website are provided on an 'as is' basis. StudyPlus YT makes no warranties, expressed or implied,
                                and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability,
                                fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
