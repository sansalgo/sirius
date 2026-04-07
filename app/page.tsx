import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingPage } from "@/components/landing/landing-page";

export default async function Home() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (session?.session) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
