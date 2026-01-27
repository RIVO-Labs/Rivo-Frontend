import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">
            Authenticating...
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProfileLoadingSkeleton() {
  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}