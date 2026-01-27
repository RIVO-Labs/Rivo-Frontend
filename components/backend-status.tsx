import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Server } from "lucide-react";

interface BackendStatusProps {
  className?: string;
}

export function BackendStatus({ className }: BackendStatusProps) {
  return (
    <Alert className={className}>
      <Server className="h-4 w-4" />
      <AlertDescription>
        <strong>Backend Required:</strong> Make sure the Django backend is running at{" "}
        <code className="bg-muted px-1 rounded">link-be</code> with CORS enabled for{" "}
        <code className="bg-muted px-1 rounded">link-fe</code>
      </AlertDescription>
    </Alert>
  );
}

interface NetworkErrorAlertProps {
  error: string;
  onRetry?: () => void;
}

export function NetworkErrorAlert({ error, onRetry }: NetworkErrorAlertProps) {
  const isCorsError = error.includes('CORS') || error.includes('cors');
  const isNetworkError = error.includes('Network') || error.includes('fetch');

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p><strong>Connection Error:</strong> {error}</p>
          {isCorsError && (
            <div className="text-sm">
              <p>To fix this CORS issue, ensure your Django backend has:</p>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li><code>django-cors-headers</code> installed</li>
                <li><code>'link-fe'</code> in <code>CORS_ALLOWED_ORIGINS</code></li>
                <li>CORS middleware properly configured</li>
              </ul>
            </div>
          )}
          {isNetworkError && (
            <div className="text-sm">
              <p>Please check:</p>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li>Django backend is running on <code>link-be</code></li>
                <li>No firewall is blocking the connection</li>
                <li>The backend API endpoints are accessible</li>
              </ul>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}