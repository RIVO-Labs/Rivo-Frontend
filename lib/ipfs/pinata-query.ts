/**
 * Pinata API Query Utilities
 *
 * Query pins from Pinata by metadata filters
 */

export interface PinataPin {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  date_pinned: string;
  date_unpinned: string | null;
  metadata: {
    name?: string;
    keyvalues?: {
      type?: string;
      walletAddress?: string;
      supplierName?: string;
      employeeName?: string;
      timestamp?: string;
      [key: string]: any;
    };
  };
  regions: Array<{
    regionId: string;
    currentReplicationCount: number;
    desiredReplicationCount: number;
  }>;
  mime_type: string;
  number_of_files: number;
}

export interface PinataListResponse {
  count: number;
  rows: PinataPin[];
}

export interface PinataQueryOptions {
  /** Filter by metadata type (e.g., 'supplier', 'employee') */
  type?: string;
  /** Filter by wallet address */
  walletAddress?: string;
  /** Additional metadata filters */
  metadata?: Record<string, string>;
  /** Page offset */
  pageOffset?: number;
  /** Page limit (max 1000) */
  pageLimit?: number;
  /** Status filter */
  status?: 'pinned' | 'unpinned' | 'all';
}

/**
 * Query Pinata API to list pins with metadata filters
 */
export async function queryPinataPins(
  options: PinataQueryOptions = {}
): Promise<PinataListResponse> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!jwt) {
    throw new Error('NEXT_PUBLIC_PINATA_JWT not configured');
  }

  // Build query parameters
  const params = new URLSearchParams();

  // Status filter
  if (options.status) {
    params.append('status', options.status);
  } else {
    params.append('status', 'pinned');
  }

  // Pagination
  if (options.pageOffset !== undefined) {
    params.append('pageOffset', options.pageOffset.toString());
  }
  if (options.pageLimit !== undefined) {
    params.append('pageLimit', Math.min(options.pageLimit, 1000).toString());
  } else {
    params.append('pageLimit', '100');
  }

  // Metadata filters
  const metadata: Record<string, any> = {};

  if (options.type) {
    metadata.type = options.type;
  }

  if (options.walletAddress) {
    metadata.walletAddress = options.walletAddress;
  }

  if (options.metadata) {
    Object.assign(metadata, options.metadata);
  }

  // Add metadata filters to query
  if (Object.keys(metadata).length > 0) {
    params.append('metadata', JSON.stringify(metadata));
  }

  const url = `https://api.pinata.cloud/data/pinList?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Pinata API error: ${response.status} - ${error}`);
  }

  const data: PinataListResponse = await response.json();
  return data;
}

/**
 * Query suppliers for a specific wallet address
 */
export async function querySuppliers(walletAddress: string): Promise<PinataPin[]> {
  try {
    const response = await queryPinataPins({
      type: 'supplier',
      walletAddress,
      status: 'pinned',
    });
    return response.rows;
  } catch (error) {
    console.error('Error querying suppliers from Pinata:', error);
    throw error;
  }
}

/**
 * Query employees for a specific wallet address
 */
export async function queryEmployees(walletAddress: string): Promise<PinataPin[]> {
  try {
    const response = await queryPinataPins({
      type: 'employee',
      walletAddress,
      status: 'pinned',
    });
    return response.rows;
  } catch (error) {
    console.error('Error querying employees from Pinata:', error);
    throw error;
  }
}

/**
 * Query QR invoices for a specific wallet address
 */
export async function queryQRInvoices(walletAddress: string): Promise<PinataPin[]> {
  try {
    const response = await queryPinataPins({
      type: 'qr_invoice',
      walletAddress,
      status: 'pinned',
    });
    return response.rows;
  } catch (error) {
    console.error('Error querying QR invoices from Pinata:', error);
    throw error;
  }
}
