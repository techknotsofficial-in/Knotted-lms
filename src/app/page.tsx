import React from "react";
import { headers } from "next/headers";
import { getPublishedCourses } from "@/lib/courses";
import { auth } from "@/lib/auth";
import { PromoBar } from "@/components/layout/promo-bar";
import { MainNav } from "@/components/layout/main-nav";
import { Hero17 } from "@/components/ui/hero-17";
import { CourseDiscoverySection } from "@/components/courses/course-discovery-section";
import { TrendingCoursesSection } from "@/components/courses/trending-courses-section";
import { LearningTracksSection } from "@/components/home/learning-tracks-section";
import { PersonalPlanBanner } from "@/components/home/personal-plan-banner";
import { SkillsDirectorySection } from "@/components/home/skills-directory-section";
import { TrustedCompaniesBar } from "@/components/home/trusted-companies-bar";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { CertificationHubSection } from "@/components/home/certification-hub-section";
import { CareerPathwaysSection } from "@/components/home/career-pathways-section";
import { Footer } from "@/components/layout/footer";

export default async function HomePage() {
  const reqHeaders = await headers();
  const [courses, session] = await Promise.all([
    getPublishedCourses(),
    auth.api.getSession({ headers: reqHeaders }),
  ]);

  const userRole = (session?.user && "role" in session.user ? (session.user.role as string) : "STUDENT")?.toUpperCase() || "STUDENT";
  const isStaffOrAdmin = userRole === "ADMIN" || userRole === "STAFF" || userRole === "INSTRUCTOR";

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#09090B]">
      {/* 1. Top Promo Notification Banner */}
      <PromoBar />

      {/* 2. 100% Full-Width Edge-to-Edge Navigation Bar */}
      <MainNav user={session?.user} />

      {/* 3. 100% Full-Screen Width Billboard Hero Section */}
      <Hero17
        primaryCtaLink="/courses"
        secondaryCtaLink={isStaffOrAdmin ? "/creator/courses" : "/dashboard"}
        secondaryCtaText={isStaffOrAdmin ? "Creator Studio" : "My Dashboard"}
      />

      {/* Main Flow of All Sections */}
      <main className="flex-1 w-full space-y-4">
        {/* 4. Interactive Category Tabs & Course Grid (Udemy Style) */}
        <CourseDiscoverySection courses={courses} />

        {/* 5. Trending Masterclasses */}
        <TrendingCoursesSection courses={courses} />

        {/* 6. Visual Engineering & Career Tracks */}
        <LearningTracksSection />

        {/* 7. All-Access Masterclass Subscription Dark Banner */}
        <PersonalPlanBanner />

        {/* 8. Popular Engineering Skills Directory Matrix */}
        <SkillsDirectorySection />

        {/* 9. Trusted by 16,000+ Enterprise Companies Bar */}
        <TrustedCompaniesBar />

        {/* 10. Verified Learner Testimonials */}
        <TestimonialsSection />

        {/* 11. Verifiable Certification Hub */}
        <CertificationHubSection />

        {/* 12. Role-Based Career Pathways */}
        <CareerPathwaysSection />
      </main>

      {/* 13. Rich Monochrome Black Footer */}
      <Footer />
    </div>
  );
}
