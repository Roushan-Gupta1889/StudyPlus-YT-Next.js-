import { redirect } from "next/navigation";

export default async function WatchRedirect({
    searchParams,
}: {
    searchParams: Promise<{ v?:  string }>;
}) {
    const params = await searchParams;
    
    // Redirect old URL format (/app/watch?v=ID) to new format (/app/watch/ID)
    if (params?.v) {
        redirect(`/app/watch/${params.v}`);
    }

    // If no video ID, redirect to dashboard
    redirect("/app/dashboard");
}
