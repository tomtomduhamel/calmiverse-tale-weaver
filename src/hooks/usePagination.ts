import { useCallback, useState } from 'react';
import { validatePagination, PaginationParams, DEFAULT_PAGE_SIZE } from '@/utils/pagination';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  onPageChange?: (params: PaginationParams) => void;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const [params, setParams] = useState<PaginationParams>(() => 
    validatePagination({
      page: options.initialPage || 1,
      limit: options.initialPageSize || DEFAULT_PAGE_SIZE
    })
  );

  const updateParams = useCallback((newParams: Partial<PaginationParams>) => {
    const validatedParams = validatePagination({ ...params, ...newParams });
    setParams(validatedParams);
    options.onPageChange?.(validatedParams);
  }, [params, options]);

  const setPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const setPageSize = useCallback((limit: number) => {
    updateParams({ limit, page: 1 }); // Reset to first page when changing page size
  }, [updateParams]);

  const setSorting = useCallback((sortBy: string, sortDirection: 'asc' | 'desc' = 'desc') => {
    updateParams({ sortBy, sortDirection, page: 1 }); // Reset to first page when sorting
  }, [updateParams]);

  const reset = useCallback(() => {
    const defaultParams = validatePagination({
      page: 1,
      limit: options.initialPageSize || DEFAULT_PAGE_SIZE
    });
    setParams(defaultParams);
    options.onPageChange?.(defaultParams);
  }, [options]);

  return {
    params,
    setPage,
    setPageSize,
    setSorting,
    reset,
    // Convenience computed values
    offset: (params.page - 1) * params.limit,
    isFirstPage: params.page === 1
  };
};