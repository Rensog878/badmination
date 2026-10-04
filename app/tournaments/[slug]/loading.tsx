import BackButton from "@/components/ui/BackButton";

export default function TournamentLoading() {
  return (
    <main id="main" className="theme-light min-h-svh bg-charcoal pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-0 animate-fade-in">
      <header className="relative overflow-hidden border-b border-off-white/10 pt-28 pb-14 lg:pt-36 lg:pb-20">
        <div className="relative mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
          <BackButton fallbackHref="/#tournaments" label="All tournaments" />
          
          {/* Level & City pill skeleton */}
          <div className="mt-8 h-7 w-36 skeleton rounded-full" />
          
          {/* Tournament title skeleton */}
          <div className="mt-4 h-16 w-3/4 max-w-2xl skeleton rounded-2xl sm:h-20" />
          
          {/* Subtitle info row skeleton */}
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <div className="h-6 w-44 skeleton rounded-lg" />
            <div className="h-6 w-32 skeleton rounded-lg" />
            <div className="h-6 w-28 skeleton rounded-full" />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-12 px-4 py-14 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-16 lg:py-20">
        {/* Left Column: Details, Events, Draw */}
        <div className="min-w-0 space-y-16 lg:col-span-8">
          {/* About Section */}
          <section>
            <div className="h-4 w-20 skeleton rounded" />
            <div className="mt-4 space-y-2.5 max-w-2xl">
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-4 w-5/6 skeleton rounded" />
              <div className="h-4 w-2/3 skeleton rounded" />
            </div>

            {/* Facts Grid Skeleton */}
            <div className="mt-8 grid grid-cols-2 border border-off-white/10 sm:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-r border-b border-off-white/10 p-5">
                  <div className="h-3 w-16 skeleton rounded" />
                  <div className="mt-2 h-5 w-24 skeleton rounded" />
                </div>
              ))}
            </div>
          </section>

          {/* Events Section */}
          <section>
            <div className="h-4 w-24 skeleton rounded" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-off-white/10 bg-off-white/[0.02] p-4">
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 skeleton rounded" />
                    <div className="h-3 w-24 skeleton rounded" />
                  </div>
                  <div className="h-5 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          </section>

          {/* Player Match Finder / Bracket Placeholder Skeleton */}
          <div className="rounded-2xl border border-off-white/10 bg-off-white/[0.02] p-6 space-y-4">
            <div className="h-5 w-48 skeleton rounded" />
            <div className="h-11 w-full skeleton rounded-xl" />
            <div className="h-32 w-full skeleton rounded-xl" />
          </div>
        </div>

        {/* Right Column: Sticky Registration Card Skeleton */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl border border-off-white/15 bg-black/60 p-6 sm:p-8 space-y-6">
            <div className="h-6 w-24 skeleton rounded-full" />
            <div className="h-10 w-40 skeleton rounded-xl" />
            <div className="space-y-4 border-t border-off-white/10 pt-6">
              <div className="flex justify-between">
                <div className="h-4 w-24 skeleton rounded" />
                <div className="h-4 w-28 skeleton rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 skeleton rounded" />
                <div className="h-4 w-28 skeleton rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 skeleton rounded" />
                <div className="h-4 w-16 skeleton rounded" />
              </div>
            </div>
            <div className="h-2 w-full skeleton rounded-full" />
            <div className="h-12 w-full skeleton rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
