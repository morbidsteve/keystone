// =============================================================================
// Sensitive Item Catalog API — CRUD for catalog item types
// Includes inline mock data for demo mode (falls back to static catalog)
// =============================================================================

import apiClient from './client';
import { isDemoMode } from './mockClient';
import {
  SENSITIVE_ITEM_CATALOG,
  searchCatalog as staticSearchCatalog,
  type CatalogEntry,
} from '@/data/sensitiveItemCatalog';
import type { SensitiveItemType } from '@/lib/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SensitiveItemCatalogItem {
  id: number;
  nomenclature: string;
  nsn: string | null;
  item_type: string;
  tamcn: string | null;
  aliases: string[];
  is_active: boolean;
}

export interface SensitiveItemCatalogItemCreate {
  nomenclature: string;
  nsn?: string;
  item_type: string;
  tamcn?: string;
  aliases?: string[];
}

// ---------------------------------------------------------------------------
// Mock data derived from static catalog
// ---------------------------------------------------------------------------

let mockCatalogItems: SensitiveItemCatalogItem[] = SENSITIVE_ITEM_CATALOG.map(
  (entry, index) => ({
    id: index + 1,
    nomenclature: entry.nomenclature,
    nsn: entry.nsn,
    item_type: entry.itemType,
    tamcn: entry.tamcn ?? null,
    aliases: entry.aliases,
    is_active: true,
  }),
);

let mockNextId = mockCatalogItems.length + 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockDelay = (ms = 100 + Math.random() * 100): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

function matchesQuery(q: string, ...fields: (string | null | undefined)[]): boolean {
  const lower = q.toLowerCase();
  return fields.some((f) => f != null && f.toLowerCase().includes(lower));
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/** GET /api/v1/catalog/items?q=searchterm&item_type=WEAPON */
export async function getCatalogItems(params?: {
  q?: string;
  item_type?: string;
}): Promise<SensitiveItemCatalogItem[]> {
  if (isDemoMode) {
    await mockDelay();
    let results = [...mockCatalogItems];
    if (params?.item_type) {
      results = results.filter((i) => i.item_type === params.item_type);
    }
    if (params?.q && params.q.trim().length > 0) {
      const q = params.q;
      results = results.filter(
        (i) =>
          matchesQuery(q, i.nomenclature, i.nsn, i.item_type, i.tamcn) ||
          i.aliases.some((a) => a.toLowerCase().includes(q.toLowerCase())),
      );
    }
    return results;
  }
  const response = await apiClient.get<{ data: SensitiveItemCatalogItem[] }>(
    '/catalog/items',
    { params },
  );
  return response.data.data;
}

/** POST /api/v1/catalog/items */
export async function createCatalogItem(
  data: SensitiveItemCatalogItemCreate,
): Promise<SensitiveItemCatalogItem> {
  if (isDemoMode) {
    await mockDelay();
    const newItem: SensitiveItemCatalogItem = {
      id: mockNextId++,
      nomenclature: data.nomenclature,
      nsn: data.nsn ?? null,
      item_type: data.item_type,
      tamcn: data.tamcn ?? null,
      aliases: data.aliases ?? [],
      is_active: true,
    };
    mockCatalogItems = [...mockCatalogItems, newItem];
    return newItem;
  }
  const response = await apiClient.post<{ data: SensitiveItemCatalogItem }>(
    '/catalog/items',
    data,
  );
  return response.data.data;
}

/** PUT /api/v1/catalog/items/{id} */
export async function updateCatalogItem(
  id: number,
  data: Partial<SensitiveItemCatalogItemCreate>,
): Promise<SensitiveItemCatalogItem> {
  if (isDemoMode) {
    await mockDelay();
    mockCatalogItems = mockCatalogItems.map((item) =>
      item.id === id
        ? {
            ...item,
            ...(data.nomenclature !== undefined && { nomenclature: data.nomenclature }),
            ...(data.nsn !== undefined && { nsn: data.nsn ?? null }),
            ...(data.item_type !== undefined && { item_type: data.item_type }),
            ...(data.tamcn !== undefined && { tamcn: data.tamcn ?? null }),
            ...(data.aliases !== undefined && { aliases: data.aliases ?? [] }),
          }
        : item,
    );
    const updated = mockCatalogItems.find((i) => i.id === id);
    if (!updated) throw new Error('Item not found');
    return updated;
  }
  const response = await apiClient.put<{ data: SensitiveItemCatalogItem }>(
    `/catalog/items/${id}`,
    data,
  );
  return response.data.data;
}

/** DELETE /api/v1/catalog/items/{id} */
export async function deleteCatalogItem(id: number): Promise<void> {
  if (isDemoMode) {
    await mockDelay();
    mockCatalogItems = mockCatalogItems.filter((i) => i.id !== id);
    return;
  }
  await apiClient.delete(`/catalog/items/${id}`);
}

// ---------------------------------------------------------------------------
// Catalog search for auto-complete (used by CustodyPage)
// In demo mode: uses static catalog. In live mode: uses API.
// ---------------------------------------------------------------------------

export async function searchCatalogApi(
  query: string,
  limit = 8,
): Promise<CatalogEntry[]> {
  if (isDemoMode) {
    return staticSearchCatalog(query, limit);
  }
  // In live mode, query the API and map to CatalogEntry format
  if (!query || query.length < 2) return [];
  const items = await getCatalogItems({ q: query });
  return items
    .filter((i) => i.is_active)
    .slice(0, limit)
    .map((i) => ({
      nomenclature: i.nomenclature,
      nsn: i.nsn ?? '',
      itemType: i.item_type as SensitiveItemType,
      tamcn: i.tamcn ?? undefined,
      aliases: i.aliases,
    }));
}
