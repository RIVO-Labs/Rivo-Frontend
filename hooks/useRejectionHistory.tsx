'use client';

import { useState, useEffect, useCallback } from 'react';
import { RejectionHistory } from '@/types/user';

const REJECTION_HISTORY_KEY = 'Rivo_rejection_history';

interface RejectionHistoryStorage {
  [agreementId: string]: RejectionHistory[];
}

export function useRejectionHistory() {
  const [rejectionHistory, setRejectionHistory] = useState<RejectionHistoryStorage>({});

  // Load rejection history from localStorage on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(REJECTION_HISTORY_KEY);
        if (stored) {
          setRejectionHistory(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load rejection history:', error);
      }
    };

    loadHistory();
  }, []);

  // Save to localStorage whenever history changes
  const saveHistory = useCallback((history: RejectionHistoryStorage) => {
    try {
      localStorage.setItem(REJECTION_HISTORY_KEY, JSON.stringify(history));
      setRejectionHistory(history);
    } catch (error) {
      console.error('Failed to save rejection history:', error);
    }
  }, []);

  // Add a new rejection to history
  const addRejection = useCallback(
    (agreementId: string, reason: string, milestoneNumber?: number) => {
      const newRejection: RejectionHistory = {
        timestamp: new Date().toISOString(),
        reason,
        milestoneNumber,
      };

      const updatedHistory = {
        ...rejectionHistory,
        [agreementId]: [...(rejectionHistory[agreementId] || []), newRejection],
      };

      saveHistory(updatedHistory);
    },
    [rejectionHistory, saveHistory]
  );

  // Get rejection history for a specific agreement
  const getHistory = useCallback(
    (agreementId: string): RejectionHistory[] => {
      return rejectionHistory[agreementId] || [];
    },
    [rejectionHistory]
  );

  // Get the latest rejection for an agreement
  const getLatestRejection = useCallback(
    (agreementId: string): RejectionHistory | null => {
      const history = rejectionHistory[agreementId];
      if (!history || history.length === 0) return null;
      return history[history.length - 1];
    },
    [rejectionHistory]
  );

  // Clear rejection history for a specific agreement
  const clearHistory = useCallback(
    (agreementId: string) => {
      const updatedHistory = { ...rejectionHistory };
      delete updatedHistory[agreementId];
      saveHistory(updatedHistory);
    },
    [rejectionHistory, saveHistory]
  );

  return {
    addRejection,
    getHistory,
    getLatestRejection,
    clearHistory,
  };
}
