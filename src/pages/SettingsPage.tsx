import { useState } from 'react'
import { Button } from '../components/common/Button'
import { loadDemoData } from '../db/seed'
import { repository } from '../db/repository'
import { downloadBackup, exportBackup, importBackup } from '../lib/backup'

export function SettingsPage() {
  const [busy, setBusy] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
      <p className="text-sm text-slate-500">Use backup and demo tools for local-only v1 data management.</p>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Backup</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={busy !== null}
            onClick={async () => {
              setBusy('export')
              try {
                const payload = await exportBackup()
                downloadBackup(payload)
              } finally {
                setBusy(null)
              }
            }}
          >
            {busy === 'export' ? 'Exporting...' : 'Export JSON'}
          </Button>

          <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Import JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) {
                  return
                }
                setBusy('import')
                try {
                  await importBackup(file)
                  window.alert('Backup imported successfully.')
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : 'Import failed.')
                } finally {
                  setBusy(null)
                  event.target.value = ''
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Demo Data</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={busy !== null}
            onClick={async () => {
              setBusy('seed')
              try {
                await loadDemoData()
                window.alert('Demo data loaded.')
              } finally {
                setBusy(null)
              }
            }}
          >
            {busy === 'seed' ? 'Loading...' : 'Load Demo Data'}
          </Button>

          <Button
            variant="danger"
            disabled={busy !== null}
            onClick={async () => {
              const ok = window.confirm('Clear all local data from IndexedDB?')
              if (!ok) {
                return
              }
              setBusy('clear')
              try {
                await repository.clearAll()
                window.alert('All data cleared.')
              } finally {
                setBusy(null)
              }
            }}
          >
            {busy === 'clear' ? 'Clearing...' : 'Clear All Data'}
          </Button>
        </div>
      </section>
    </div>
  )
}
