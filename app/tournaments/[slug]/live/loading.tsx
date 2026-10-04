import BackButton from "@/components/ui/BackButton";

export default function LiveMatchLoading() {
  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36 animate-fade-in">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16">
        <BackButton fallbackHref="/#tournaments" label="Tournaments" />
        
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="h-14 w-40 skeleton rounded-2xl sm:h-16" />
            <div className="mt-2 h-4 w-64 skeleton rounded" />
          </div>
          <div className="h-10 w-44 skeleton rounded-xl" />
        </div>

        {/* Quick Stats Counter Skeleton */}
        <div className="mt-10 flex flex-wrap gap-8 sm:gap-12">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 skeleton rounded" />
              <div className="h-8 w-12 skeleton rounded-lg" />
            </div>
          ))}
        </div>

        {/* 4-Court Arena Grid Skeleton */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-60 flex-col rounded-2xl border border-off-white/10 bg-black/60 p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 skeleton rounded" />
                <div className="h-3 w-24 skeleton rounded" />
              </div>

              <div className="space-y-4 my-auto">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 skeleton rounded" />
                  <div className="h-8 w-10 skeleton rounded-lg" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-5 w-28 skeleton rounded" />
                  <div className="h-8 w-10 skeleton rounded-lg" />
                </div>
              </div>

              <div className="pt-3 border-t border-off-white/10 flex justify-between items-center">
                <div className="h-3 w-28 skeleton rounded" />
                <div className="h-3 w-16 skeleton rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Dual Column: Up Next & Results Skeleton */}
        <div className="mt-14 grid gap-12 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="divide-y divide-off-white/10 border-y border-off-white/10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-3 flex justify-between">
                  <div className="h-4 w-48 skeleton rounded" />
                  <div className="h-4 w-16 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-28 skeleton rounded" />
            <div className="divide-y divide-off-white/10 border-y border-off-white/10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-3 flex justify-between">
                  <div className="h-4 w-52 skeleton rounded" />
                  <div className="h-4 w-20 skeleton rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
