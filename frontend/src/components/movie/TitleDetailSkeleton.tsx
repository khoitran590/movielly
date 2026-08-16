// Loading shape matches the real page: a backdrop the height of the hero, a
// poster bone, three text bones. No navy bar.
export default function TitleDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[min(70vh,720px)] w-full bg-velvet" />
      <div className="mx-auto -mt-24 max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-8">
          <div className="aspect-[2/3] w-40 shrink-0 rounded-poster bg-seat md:w-[200px]" />
          <div className="flex-1 space-y-3 pb-4">
            <div className="h-10 w-2/3 rounded bg-seat" />
            <div className="h-4 w-1/3 rounded bg-seat" />
            <div className="h-4 w-1/4 rounded bg-seat" />
          </div>
        </div>
      </div>
    </div>
  );
}
