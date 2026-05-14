import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { repository } from '../db/repository'
import { useProjects, useSites } from '../hooks/useData'
import type { Site } from '../types/models'

export function SitesPage() {
  const projects = useProjects()
  const sites = useSites()
  const [editing, setEditing] = useState<Site | undefined>()
  const [siteId, setSiteId] = useState('')
  const [siteName, setSiteName] = useState('')
  const [projectId, setProjectId] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id as number, project.name])),
    [projects],
  )

  useEffect(() => {
    if (!editing && projectId === 0 && projects[0]?.id) {
      setProjectId(projects[0].id)
    }
  }, [editing, projectId, projects])

  const reset = () => {
    setEditing(undefined)
    setSiteId('')
    setSiteName('')
    setProjectId(projects[0]?.id ?? 0)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Site Management</h2>

      <form
        className="rounded-xl border border-slate-200 bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!siteId.trim() || !siteName.trim() || projectId <= 0) {
            return
          }

          setError(null)
          try {
            if (editing?.id) {
              await repository.updateSite(editing.id, {
                siteId: siteId.trim(),
                siteName: siteName.trim(),
                projectId,
              })
            } else {
              await repository.createSite({
                siteId: siteId.trim(),
                siteName: siteName.trim(),
                projectId,
              })
            }
            reset()
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to save site.')
          }
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="h-10 rounded-lg border border-slate-200 px-3"
            placeholder="Site ID (e.g., ST-001)"
            value={siteId}
            onChange={(event) => setSiteId(event.target.value)}
            required
          />
          <input
            className="h-10 rounded-lg border border-slate-200 px-3"
            placeholder="Site name"
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
            required
          />
          <select
            className="h-10 rounded-lg border border-slate-200 px-3"
            value={projectId}
            onChange={(event) => setProjectId(Number(event.target.value))}
            required
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-3 flex gap-2">
          <Button type="submit" disabled={projects.length === 0}>
            {editing ? 'Update Site' : 'Add Site'}
          </Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={reset}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create at least one project before managing sites."
        />
      ) : sites.length === 0 ? (
        <EmptyState
          title="No sites yet"
          description="Add your first site and link it to a project."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Site ID</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Site Name</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Project</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-sm font-medium text-slate-800">{site.siteId}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{site.siteName}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{projectNames[site.projectId] ?? '-'}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-slate-600 hover:text-slate-900"
                        onClick={() => {
                          setEditing(site)
                          setSiteId(site.siteId)
                          setSiteName(site.siteName)
                          setProjectId(site.projectId)
                          setError(null)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-slate-600 hover:text-slate-900"
                        onClick={async () => {
                          setError(null)
                          try {
                            await repository.deleteSite(site.id as number)
                          } catch (deleteError) {
                            setError(
                              deleteError instanceof Error
                                ? deleteError.message
                                : 'Unable to delete site.',
                            )
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
