import { useMemo } from 'react'

interface ExcelPreviewProps {
  headers: string[]
  rows: Record<string, string>[]
  title?: string
}

export default function ExcelPreview({ headers, rows, title = 'Excel Content Preview:' }: ExcelPreviewProps) {
  /* Fallback: derive headers from first row if not provided */
  const columns = useMemo(() => {
    if (headers.length > 0) return headers
    if (rows.length === 0) return []
    return Object.keys(rows[0])
  }, [headers, rows])

  if (columns.length === 0 || rows.length === 0) return null

  return (
    <>
      <h3 className="excel-preview-title">{title}</h3>
      <div className="excel-table-wrap">
        <table className="excel-table">
          <thead>
            <tr>
              {columns.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((h) => {
                  const val = row[h] ?? ''
                  return (
                    <td key={h} className={getCellClass(h, val)} title={val}>
                      {val}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/** Highlight result/status columns */
function getCellClass(header: string, value?: string): string {
  const lower = header.toLowerCase()
  if (lower === 'resulttestauto' || lower === 'result') {
    const v = (value ?? '').toUpperCase()
    if (v === 'PASS') return 'cell-pass'
    if (v === 'FAIL' || v === 'FAILED') return 'cell-fail'
  }
  return ''
}
