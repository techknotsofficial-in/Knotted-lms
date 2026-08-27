import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/ui/logo";
import { OnboardingSetup } from "@/components/ui/onboarding-setup";

export default async function OnboardingPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  // If not logged in, redirect to login with return redirect
  if (!session?.user) {
    redirect("/login?redirect=/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAFAFA] text-[#09090B] p-4 sm:p-8">
      {/* Top Navbar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <Logo size="default" />
        <div className="text-xs text-[#71717A] font-medium">
          Logged in as <span className="font-bold text-[#09090B]">{session.user.email}</span>
        </div>
      </header>

      {/* Main Center Multi-Step Onboarding Component */}
      <main className="my-auto py-8">
        <OnboardingSetup
          initialUser={{
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
          }}
        />
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-2 text-xs text-[#71717A]">
        Knotted LMS — Welcome to your personalized technical learning environment
      </footer>
    </div>
  );
}
