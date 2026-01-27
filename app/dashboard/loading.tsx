import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
      </div>

      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {Array(3)
            .fill(null)
            .map((_, i) => (
              <div key={i} className="p-6 border rounded-lg">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-end">
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
