import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        console.error('[ErrorBoundary]', error, info.componentStack)
    }

    handleReload = () => {
        window.location.reload()
    }

    handleHome = () => {
        window.location.href = '/'
    }

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <div className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-4">
                <div className="max-w-md w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-overlay)] p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--red-50)] border border-[var(--red-100)]">
                        <AlertTriangle className="h-7 w-7 text-[var(--red-600)]" />
                    </div>
                    <h1 className="text-[18px] font-bold text-[var(--text-primary)] mb-2">
                        Something went wrong
                    </h1>
                    <p className="text-[13px] text-[var(--text-muted)] mb-6 leading-relaxed">
                        An unexpected error occurred. Try reloading the page. If the problem persists, contact your system administrator.
                    </p>

                    {this.state.error && (
                        <details className="mb-6 text-left rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3">
                            <summary className="text-[12px] font-semibold text-[var(--text-secondary)] cursor-pointer select-none">
                                Error details
                            </summary>
                            <pre className="mt-2 text-[11px] text-[var(--red-600)] whitespace-pre-wrap break-all leading-relaxed">
                                {this.state.error.message}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={this.handleHome}
                            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:border-[var(--border-2)] transition cursor-pointer"
                        >
                            <Home className="h-4 w-4" />
                            Dashboard
                        </button>
                        <button
                            onClick={this.handleReload}
                            className="flex items-center gap-2 rounded-xl bg-[var(--surface)] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[var(--surface-2)] transition cursor-pointer"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        )
    }
}
