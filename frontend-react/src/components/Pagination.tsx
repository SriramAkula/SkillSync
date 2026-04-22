import React from 'react';

interface PaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ totalItems, pageSize, currentPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button 
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <span className="material-icons text-slate-600 dark:text-slate-300">chevron_left</span>
      </button>

      {pages.map(page => (
        <button
          key={page}
          className={`w-10 h-10 rounded-xl font-semibold transition-colors ${
            page === currentPage 
              ? 'bg-primary-600 text-white shadow-md' 
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          onClick={() => onPageChange(page)}
        >
          {page + 1}
        </button>
      ))}

      <button 
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
        disabled={currentPage === totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <span className="material-icons text-slate-600 dark:text-slate-300">chevron_right</span>
      </button>
    </div>
  );
};
