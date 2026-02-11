"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Loader2, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addContributor } from "@/app/actions/contribute";

interface ContributeModalProps {
    children: React.ReactNode;
    amount?: string;
}

export function ContributeModal({ children, amount }: ContributeModalProps) {
    const upiId = "Q145033639@ybl"; // Placeholder UPI ID
    const [step, setStep] = useState<"qr" | "details" | "success">("qr");
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [customAmount, setCustomAmount] = useState("");

    // Parse amount string to number if present (remove ₹ and commas)
    const initialAmount = amount ? parseInt(amount.replace(/[^0-9]/g, "")) : 0;

    const handleCopy = () => {
        navigator.clipboard.writeText(upiId);
        toast.success("UPI ID copied to clipboard!");
    };

    const handlePaymentDone = () => {
        setStep("details");
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        // If no fixed amount was passed, use the custom amount input
        if (!initialAmount) {
            const custom = formData.get("customAmount");
            if (!custom) {
                toast.error("Please enter the amount you paid");
                setIsLoading(false);
                return; // Changed to return early
            }
            formData.append("amount", custom.toString());
        } else {
            formData.append("amount", initialAmount.toString());
        }

        const result = await addContributor(formData);

        if (result.success) {
            setStep("success");
            toast.success("Thank you for your contribution!");
        } else {
            toast.error(result.error || "Something went wrong");
        }
        setIsLoading(false);
    };

    const resetModal = () => {
        setStep("qr");
        setCustomAmount("");
    };

    return (
        <Dialog onOpenChange={(open) => !open && resetModal()}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {step === "qr" && "Contribute via UPI"}
                        {step === "details" && "Enter Contribution Details"}
                        {step === "success" && "Thank You!"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "qr" && (
                            <>
                                Scan the QR code or copy the UPI ID to support us.
                                {amount && <span className="block mt-2 font-medium text-foreground">Amount: {amount}</span>}
                            </>
                        )}
                        {step === "details" && "Please provide your details so we can update the leaderboard."}
                        {step === "success" && "Your contribution has been recorded."}
                    </DialogDescription>
                </DialogHeader>

                {step === "qr" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-center p-6 border-2 border-dashed border-muted rounded-lg bg-muted/20">
                            <div className="text-center space-y-2">
                                <div className="relative w-48 h-48 mx-auto">
                                    <Image
                                        src="/assets/QR-scan.png"
                                        alt="Payment QR Code"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">Scan with any UPI App<br />(GPay, PhonePe, Paytm)</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <span className="font-mono text-sm">{upiId}</span>
                                    <Button size="icon" variant="ghost" onClick={handleCopy} className="h-8 w-8 hover:bg-background">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Button className="w-full" onClick={handlePaymentDone}>
                            I have made the payment
                        </Button>
                    </div>
                )}

                {step === "details" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!initialAmount && (
                            <div className="space-y-2">
                                <Label htmlFor="customAmount">Amount Paid (₹)</Label>
                                <Input
                                    id="customAmount"
                                    name="customAmount"
                                    type="number"
                                    placeholder="e.g 500"
                                    required
                                    min="1"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Name (Optional)</Label>
                            <Input id="name" name="name" placeholder="Your Name" />
                            <p className="text-xs text-muted-foreground">Leave empty to remain anonymous</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message (Optional)</Label>
                            <Textarea id="message" name="message" placeholder="Say something nice..." />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox id="isAnonymous" name="isAnonymous" />
                            <Label
                                htmlFor="isAnonymous"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Hide my name on leaderboard
                            </Label>
                        </div>

                        {/* Hidden input for fixed amount if present */}
                        {initialAmount > 0 && <input type="hidden" name="amount" value={initialAmount} />}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Submit Details"
                            )}
                        </Button>
                    </form>
                )}

                {step === "success" && (
                    <div className="text-center py-6 space-y-4">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mx-auto">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-medium">Payment Verified!</h3>
                        <p className="text-muted-foreground">
                            Your contribution has been added to the leaderboard. <br />
                            Thank you for supporting StudyPlus YT.
                        </p>
                        <Button className="w-full" variant="outline" onClick={() => window.location.reload()}>
                            Refresh Leaderboard
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
