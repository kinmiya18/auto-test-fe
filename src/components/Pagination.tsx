interface PaginationProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  return (
    <div className="pagination">
      <button
        className="btn btn-sm btn-ghost"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        ← Prev
      </button>

      <span className="pagination-info">
        Page {page + 1} / {totalPages} ({total} total)
      </span>

      <button
        className="btn btn-sm btn-ghost"
        disabled={page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next →
      </button>
    </div>
  )
}
