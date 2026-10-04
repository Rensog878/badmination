import BackButton from "@/components/ui/BackButton";

export default function RegisterLoading() {
  return (
    <main id="main" className="theme-light min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36 animate-fade-in">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <BackButton fallbackHref="/#tournaments" label="Tournament" />
        <div className="mt-8 h-12 w-64 skeleton rounded-2xl sm:h-16" />

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Form Steps & Fields Skeleton */}
          <div className="min-w-0 lg:col-span-8 space-y-8">
            {/* Step progress pills */}
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-1.5 skeleton rounded-full" />
              ))}
            </div>

            <div className="h-8 w-48 skeleton rounded-xl" />

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <div className="h-4 w-24 skeleton rounded" />
                <div className="h-12 w-full skeleton rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-28 skeleton rounded" />
                <div className="h-12 w-full skeleton rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 skeleton rounded" />
                <div className="h-12 w-full skeleton rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 skeleton rounded" />
                <div className="h-12 w-full skeleton rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 skeleton rounded" />
                <div className="h-12 w-full skeleton rounded-xl" />
              </div>
            </div>

            <div className="h-12 w-36 skeleton rounded-xl ml-auto" />
          </div>

          {/* Right Column: Sticky Summary Card Skeleton */}
          <aside aria-label="Tournament summary" className="lg:col-span-4">
            <div className="rounded-2xl border border-off-white/10 bg-black/60 p-6 sm:p-8 space-y-4">
              <div className="h-4 w-32 skeleton rounded" />
              <div className="h-8 w-48 skeleton rounded-lg" />
              <div className="space-y-3 border-t border-off-white/10 pt-4">
                <div className="flex justify-between">
                  <div className="h-4 w-16 skeleton rounded" />
                  <div className="h-4 w-24 skeleton rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-16 skeleton rounded" />
                  <div className="h-4 w-32 skeleton rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-20 skeleton rounded" />
                  <div className="h-4 w-20 skeleton rounded" />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
