export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-800 ${className}`} />;
}

export function EventCardSkeleton() {
  return (
    <div className="bg-gray-900 border-2 border-gray-800 rounded-xl pl-6 pr-5 py-5">
      <Skeleton className="h-4 w-32 rounded-full mb-2" />
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-3.5 w-1/2 mb-1.5" />
      <Skeleton className="h-3.5 w-1/3" />
    </div>
  );
}
