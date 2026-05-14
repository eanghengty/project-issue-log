import { useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { repository } from '../db/repository'
import { useProjects } from '../hooks/useData'
import type { Project } from '../types/models'

const defaultColor = '#0F766E'

export function ProjectsPage() {
  const projects = useProjects()
  const [editing, setEditing] = useState<Project | undefined>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(defaultColor)

  const reset = () => {
    setEditing(undefined)
    setName('')
    setDescription('')
    setColor(defaultColor)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Projects</h2>

      <form
        className="rounded-xl border border-slate-200 bg-white p-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!name.trim()) {
            return
          }

          if (editing?.id) {
            await repository.updateProject(editing.id, {
              name: name.trim(),
              description: description.trim(),
              color,
            })
          } else {
            await repository.createProject({
              name: name.trim(),
              description: description.trim(),
              color,
              status: 'active',
            })
          }

          reset()
        }}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="h-10 rounded-lg border border-slate-200 px-3"
            placeholder="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <input
            className="h-10 rounded-lg border border-slate-200 px-3"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            className="h-10 rounded-lg border border-slate-200 px-3"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button type="submit">{editing ? 'Update Project' : 'Add Project'}</Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={reset}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Create your first project to start logging issues." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Name</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Description</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Status</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-sm font-medium text-slate-800">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: project.color }} />
                    {project.name}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">{project.description}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{project.status}</td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-slate-600 hover:text-slate-900"
                        onClick={() => {
                          setEditing(project)
                          setName(project.name)
                          setDescription(project.description ?? '')
                          setColor(project.color)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-slate-600 hover:text-slate-900"
                        onClick={() =>
                          repository.updateProject(project.id as number, {
                            status: project.status === 'active' ? 'archived' : 'active',
                          })
                        }
                      >
                        {project.status === 'active' ? 'Archive' : 'Activate'}
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
