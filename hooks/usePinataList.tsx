"use client";

import { useState, useEffect } from "react";
import { querySuppliers, queryEmployees, queryQRInvoices, PinataPin } from "@/lib/ipfs/pinata-query";

interface PinataListItem {
  id: string;
  name: string;
  cid: string;
  timestamp: number;
  [key: string]: any;
}

interface UsePinataListResult {
  items: PinataListItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch suppliers from Pinata API
 */
export function useSuppliersList(walletAddress?: string): UsePinataListResult {
  const [items, setItems] = useState<PinataListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    if (!walletAddress) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pins = await querySuppliers(walletAddress);

      // Map Pinata pins to our internal format
      const mappedItems: PinataListItem[] = pins.map((pin: PinataPin) => ({
        id: pin.metadata?.keyvalues?.supplierId || pin.id,
        name: pin.metadata?.keyvalues?.supplierName || 'Unknown',
        cid: pin.ipfs_pin_hash,
        timestamp: parseInt(pin.metadata?.keyvalues?.timestamp || Date.now().toString()),
        category: 'Loading...',
        status: 'active',
        lastTransaction: new Date(pin.date_pinned).toLocaleDateString('id-ID'),
        totalAmount: '0 IDRX',
        totalInvoices: 0,
        // Store full pin data for reference
        _pinData: pin,
      }));

      // Sort by timestamp descending (newest first)
      mappedItems.sort((a, b) => b.timestamp - a.timestamp);

      setItems(mappedItems);
    } catch (err) {
      console.error('Error fetching suppliers from Pinata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [walletAddress]);

  return {
    items,
    isLoading,
    error,
    refetch: fetchSuppliers,
  };
}

/**
 * Hook to fetch employees from Pinata API
 */
export function useEmployeesList(walletAddress?: string): UsePinataListResult {
  const [items, setItems] = useState<PinataListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    if (!walletAddress) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pins = await queryEmployees(walletAddress);

      // Map Pinata pins to our internal format
      const mappedItems: PinataListItem[] = pins.map((pin: PinataPin) => ({
        id: pin.metadata?.keyvalues?.employeeId || pin.id,
        name: pin.metadata?.keyvalues?.employeeName || 'Unknown',
        cid: pin.ipfs_pin_hash,
        timestamp: parseInt(pin.metadata?.keyvalues?.timestamp || Date.now().toString()),
        department: 'Loading...',
        role: 'Loading...',
        avatar: (pin.metadata?.keyvalues?.employeeName || 'U').split(' ').map((n: string) => n[0]).join(''),
        paymentStatus: 'pending',
        joinDate: new Date(pin.date_pinned).toLocaleDateString('id-ID'),
        lastPaid: '-',
        // Store full pin data for reference
        _pinData: pin,
      }));

      // Sort by timestamp descending (newest first)
      mappedItems.sort((a, b) => b.timestamp - a.timestamp);

      setItems(mappedItems);
    } catch (err) {
      console.error('Error fetching employees from Pinata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [walletAddress]);

  return {
    items,
    isLoading,
    error,
    refetch: fetchEmployees,
  };
}

/**
 * Hook to fetch QR invoices from Pinata API
 */
export function useQRInvoicesList(walletAddress?: string): UsePinataListResult {
  const [items, setItems] = useState<PinataListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRInvoices = async () => {
    if (!walletAddress) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pins = await queryQRInvoices(walletAddress);

      // Map Pinata pins to our internal format
      const mappedItems: PinataListItem[] = pins.map((pin: PinataPin) => ({
        id: pin.metadata?.keyvalues?.invoiceId || pin.id,
        name: pin.metadata?.keyvalues?.invoiceId || 'Unknown',
        cid: pin.ipfs_pin_hash,
        timestamp: parseInt(pin.metadata?.keyvalues?.timestamp || Date.now().toString()),
        invoiceNumber: pin.metadata?.keyvalues?.invoiceId,
        // Store full pin data for reference
        _pinData: pin,
      }));

      // Sort by timestamp descending (newest first)
      mappedItems.sort((a, b) => b.timestamp - a.timestamp);

      setItems(mappedItems);
    } catch (err) {
      console.error('Error fetching QR invoices from Pinata:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch QR invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQRInvoices();
  }, [walletAddress]);

  return {
    items,
    isLoading,
    error,
    refetch: fetchQRInvoices,
  };
}
