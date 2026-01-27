'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useWorkRejectedEvents } from '@/hooks/useWorkRejectedEvents';
import type { Agreement } from '@/types/user';

interface RejectionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: Agreement;
}

export function RejectionHistoryDialog({
  open,
  onOpenChange,
  agreement,
}: RejectionHistoryDialogProps) {
  const { rejectionHistory, isLoading } = useWorkRejectedEvents();
  const history = rejectionHistory[agreement.id] || [];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rejection History</DialogTitle>
          <DialogDescription>
            Work rejection history for {agreement.projectName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Agreement Info */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">{agreement.projectName}</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2 capitalize">
                  {agreement.type}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="ml-2 capitalize">
                  {agreement.status}
                </Badge>
              </div>
              {agreement.type === 'milestone' && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="ml-2 font-medium">
                    Milestone {agreement.currentMilestone + 1} of {agreement.totalMilestones}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading rejection history from blockchain...</p>
            </div>
          )}

          {/* Rejection History Timeline */}
          {!isLoading && history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No rejection history for this agreement.</p>
              <p className="text-sm mt-1">All submissions have been accepted or are pending review.</p>
            </div>
          )}

          {!isLoading && history.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                {history.length} Rejection{history.length > 1 ? 's' : ''} (from blockchain)
              </h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {history.map((rejection, index) => (
                  <div
                    key={index}
                    className="border border-destructive/20 rounded-lg p-4 bg-destructive/5 relative"
                  >
                    {/* Timeline connector */}
                    {index < history.length - 1 && (
                      <div className="absolute left-6 top-full h-3 w-0.5 bg-destructive/20" />
                    )}

                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-destructive">
                              Work Rejected
                              {rejection.milestoneNumber !== undefined && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                  (Milestone {rejection.milestoneNumber})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(rejection.timestamp)}</span>
                              <span>•</span>
                              <span>{getTimeSince(rejection.timestamp)}</span>
                            </div>
                          </div>

                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                            Rejected
                          </Badge>
                        </div>

                        {/* Rejection Reason */}
                        <div className="bg-background/50 rounded p-3 border border-destructive/10">
                          <p className="text-sm font-medium mb-1">Reason:</p>
                          <p className="text-sm text-muted-foreground">{rejection.reason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Message */}
          {Object.keys(rejectionHistory).length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Review the rejection reasons above and resubmit your work addressing the feedback.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
