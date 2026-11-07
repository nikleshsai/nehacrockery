// ─────────────────────────────────────────────────────────────────────────────
// Pagination helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePagination(
  pageStr?: string,
  pageSizeStr?: string,
  maxPageSize = 2000,
): PaginationParams {
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const pageSize = Math.min(maxPageSize, Math.max(1, parseInt(pageSizeStr ?? '20', 10) || 20));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
