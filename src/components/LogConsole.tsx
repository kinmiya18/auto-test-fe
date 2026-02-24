import { useEffect, useRef } from 'react'

interface LogConsoleProps {
  logs: string[]
}

export default function LogConsole({ logs }: LogConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    containerRef.current?.scrollTo(0, containerRef.current.scrollHeight)
  }, [logs])

  return (
    <div className="log-console" ref={containerRef}>
      {logs.length === 0 ? (
        <span className="log-placeholder">Logs will appear here after you run</span>
      ) : (
        logs.map((line, i) => (
          <div key={i} className="log-line">
            {line}
          </div>
        ))
      )}
    </div>
  )
}
