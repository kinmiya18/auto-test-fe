import { read, utils, type WorkBook } from 'xlsx'

export interface ParsedSheet {
  headers: string[]
  rows: Record<string, string>[]
}

/**
 * Read a File object as an Excel workbook and return the parsed rows
 * for the given sheet name. Falls back to the first sheet when the
 * name is empty or not found.
 */
export async function parseExcelFile(
  file: File,
  sheetName?: string,
): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer()
  const wb: WorkBook = read(buffer, { type: 'array' })

  const targetSheet =
    sheetName && wb.SheetNames.includes(sheetName)
      ? sheetName
      : wb.SheetNames[0]

  const ws = wb.Sheets[targetSheet]
  if (!ws) return { headers: [], rows: [] }

  /* sheet_to_json with header:1 gives us arrays; defval keeps empty cells visible */
  const raw = utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })
  if (raw.length === 0) return { headers: [], rows: [] }

  const headers = raw[0].map(String)
  const rows = raw.slice(1).map((row) => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = row[i] != null ? String(row[i]) : ''
    })
    return obj
  })

  return { headers, rows }
}

/**
 * List all sheet names in a workbook file.
 */
export async function getSheetNames(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const wb: WorkBook = read(buffer, { type: 'array' })
  return wb.SheetNames
}
