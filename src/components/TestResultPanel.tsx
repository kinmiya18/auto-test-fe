import type { TestResultData } from '../types'

interface TestResultPanelProps {
  data: TestResultData
}

/**
 * Displays test run summary: total / passed / failed / none counts.
 * The actual Excel table is rendered separately via ExcelPreview.
 */
export default function TestResultPanel({ data }: TestResultPanelProps) {
  const { total, passed, failed, none } = data

  return (
    <div className="test-result-panel">
      <div className="test-summary">
        <span className="test-summary-item">Total: {total}</span>
        <span className="test-summary-item test-summary-passed">Passed: {passed}</span>
        <span className="test-summary-item test-summary-failed">Failed: {failed}</span>
        <span className="test-summary-item test-summary-none">None: {none}</span>
      </div>
    </div>
  )
}
