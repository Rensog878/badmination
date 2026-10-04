export default function AllLiveLoading() {
  return (
    <main id="main" className="min-h-svh bg-charcoal pt-28 pb-24 lg:pt-36 animate-fade-in">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 lg:px-16 space-y-12">
        <div className="space-y-3">
          <div className="h-6 w-36 skeleton rounded-full" />
          <div className="h-14 w-80 skeleton rounded-2xl sm:h-16" />
          <div className="h-4 w-96 max-w-full skeleton rounded" />
        </div>

        {/* Live Arenas Multi-Court Skeleton */}
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-off-white/10 pb-4">
            <div className="h-7 w-64 skeleton rounded-lg" />
            <div className="h-5 w-32 skeleton rounded" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        </div>
      </div>
    </main>
  );
}
