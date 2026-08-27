import React from "react";

const COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Stripe",
  "Spotify",
  "Uber",
  "Airbnb",
];

export function TrustedCompaniesBar() {
  return (
    <section className="w-full border-y border-[#E4E4E7] bg-white py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-6 text-center">
        <p className="text-xs sm:text-sm font-semibold text-[#71717A] uppercase tracking-wider font-mono">
          Trusted by engineers and leaders at top technology companies worldwide
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75">
          {COMPANIES.map((name) => (
            <div key={name} className="group">
              <span className="text-lg sm:text-xl font-extrabold text-[#09090B] font-sans tracking-tight group-hover:text-black transition-colors">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
