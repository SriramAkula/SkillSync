export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  totalElements: number;
  totalPages: number;
  pageSize: number;
}
