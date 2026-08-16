// A 20px tungsten arc — the only spinner in the product.
export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-tungsten border-t-transparent ${className}`}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}
