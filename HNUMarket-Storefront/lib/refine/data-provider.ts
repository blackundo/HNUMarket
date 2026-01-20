import { DataProvider } from '@refinedev/core';
import { getAuthHeaders } from '@/lib/supabase/auth-helpers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Custom Data Provider for NestJS Backend API
 * 
 * Maps Refine operations to NestJS REST API endpoints
 */
export const dataProvider: DataProvider = {
    getList: async ({ resource, pagination, filters, sorters, meta }) => {
        try {
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();

            // Pagination
            if (pagination) {
                // useTable passes currentPage, not current
                const current =
                    'current' in pagination ? pagination.current :
                        'currentPage' in pagination ? pagination.currentPage :
                            1;
                const pageSize = 'pageSize' in pagination ? pagination.pageSize : 10;
                params.append('page', String(current));
                params.append('limit', String(pageSize));
            }

            // Filters
            if (filters && filters.length > 0) {
                filters.forEach((filter) => {
                    if ('field' in filter) {
                        if (filter.operator === 'eq') {
                            // Map field names to API parameter names
                            if (filter.field === 'status') {
                                params.append('status', String(filter.value));
                            } else if (filter.field === 'category') {
                                params.append('category', String(filter.value));
                            } else if (filter.field === 'is_active') {
                                params.append('isActive', String(filter.value));
                            } else {
                                params.append(filter.field, String(filter.value));
                            }
                        }
                        if (filter.operator === 'contains') {
                            params.append('search', String(filter.value));
                        }
                    }
                });
            }

            // Sorters
            if (sorters && sorters.length > 0) {
                const sorter = sorters[0];
                if ('field' in sorter) {
                    // Map field names to API parameter names
                    const sortByMap: Record<string, string> = {
                        'created_at': 'createdAt',
                        'createdAt': 'createdAt',
                        'display_order': 'display_order',
                        'title': 'title',
                        'published_at': 'publishedAt',
                        'publishedAt': 'publishedAt',
                        'view_count': 'viewCount',
                        'viewCount': 'viewCount',
                    };
                    const sortBy = sortByMap[sorter.field] || sorter.field;
                    params.append('sortBy', sortBy);
                    params.append('sortOrder', sorter.order === 'asc' ? 'asc' : 'desc');
                }
            }

            const url = `${API_URL}/admin/${resource}${params.toString() ? `?${params.toString()}` : ''}`;

            console.log('[Refine DataProvider] Fetching:', url);

            const response = await fetch(url, { headers });

            if (!response.ok) {
                const errorText = await response.text();
                let error;
                try {
                    error = JSON.parse(errorText);
                } catch {
                    error = { message: errorText || response.statusText };
                }
                console.error('[Refine DataProvider] Error response:', error);
                throw new Error(error.message || `Failed to fetch ${resource}`);
            }

            const responseData = await response.json();
            console.log('[Refine DataProvider] Response:', {
                resource,
                hasData: !!responseData.data,
                dataLength: responseData.data?.length,
                meta: responseData.meta,
                fullResponse: responseData,
            });

            // Handle response format: { data: [...], meta: { total, page, limit, totalPages } }
            const data = responseData.data || [];
            const total = responseData.meta?.total || data.length || 0;

            return {
                data,
                total,
            };
        } catch (error) {
            console.error('[Refine DataProvider] getList error:', error);
            throw error;
        }
    },

    getOne: async ({ resource, id, meta }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/admin/${resource}/${id}`, { headers });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to fetch ${resource}`);
        }

        const data = await response.json();
        return { data };
    },

    create: async ({ resource, variables, meta }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/admin/${resource}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(variables),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to create ${resource}`);
        }

        const data = await response.json();
        return { data };
    },

    update: async ({ resource, id, variables, meta }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/admin/${resource}/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(variables),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to update ${resource}`);
        }

        const data = await response.json();
        return { data };
    },

    deleteOne: async ({ resource, id, meta }) => {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_URL}/admin/${resource}/${id}`, {
            method: 'DELETE',
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || `Failed to delete ${resource}`);
        }

        return { data: { id } as any };
    },

    getApiUrl: () => API_URL,

    custom: async ({ url, method, filters, sorters, payload, query, headers: customHeaders, meta }) => {
        const authHeaders = await getAuthHeaders();
        const requestHeaders = { ...authHeaders, ...customHeaders };

        let requestUrl = `${API_URL}${url}`;
        const params = new URLSearchParams();

        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    params.append(key, String(value));
                }
            });
        }

        if (params.toString()) {
            requestUrl += `?${params.toString()}`;
        }

        const response = await fetch(requestUrl, {
            method: method || 'GET',
            headers: requestHeaders,
            body: payload ? JSON.stringify(payload) : undefined,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'Request failed');
        }

        const data = await response.json();
        return { data };
    },
};

