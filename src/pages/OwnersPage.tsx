import { useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { repository } from '../db/repository'
import { useOwners, useProjectOwnerLinks, useProjects } from '../hooks/useData'
import type { Owner } from '../types/models'

export function OwnersPage() {
  const owners = useOwners()
  const projects = useProjects()
  const projectOwnerLinks = useProjectOwnerLinks()
  const [editing, setEditing] = useState<Owner | undefined>()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const linkedProjectsByOwner = useMemo(() => {
    return projectOwnerLinks.reduce<Record<number, string[]>>((acc, link) => {
      const ownerId = link.ownerId
      const projectName = projects.find((project) => project.id === link.projectId)?.name
      if (!projectName) {
        return acc
      }
      if (!acc[ownerId]) {
        acc[ownerId] = []
      }
      acc[ownerId].push(projectName)
      return acc
    }, {})
  }, [projectOwnerLinks, projects])

  const reset = () => {
    setEditing(undefined)
    setName('')
    setEmail('')
    setTitle('')
    setError(null)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Owners</h2>
      <p className="text-sm text-slate-500">Project assignments are managed in the Projects page.</p>

      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!name.trim() || !email.trim()) {
            return
          }
          setError(null)
          try {
            if (editing?.id) {
              await repository.updateOwner(editing.id, { name: name.trim(), email: email.trim(), title: title.trim() })
            } else {
              await repository.createOwner({ name: name.trim(), email: email.trim(), title: title.trim() })
            }
            reset()
          } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to save owner.')
          }
        }}
      >
        <input
          className="h-10 rounded-lg border border-slate-200 px-3"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="h-10 rounded-lg border border-slate-200 px-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="h-10 rounded-lg border border-slate-200 px-3"
          placeholder="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Button type="submit">{editing ? 'Update Owner' : 'Add Owner'}</Button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {owners.length === 0 ? (
        <EmptyState title="No owners yet" description="Add internal owners responsible for issues." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Name</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Email</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Title</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Linked Projects</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => {
                const linkedProjects = linkedProjectsByOwner[owner.id as number] ?? []
                return (
                  <tr key={owner.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-sm font-medium text-slate-800">{owner.name}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{owner.email}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{owner.title}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">
                      {linkedProjects.length ? `${linkedProjects.length} linked` : '0 linked'}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-slate-600 hover:text-slate-900"
                          onClick={() => {
                            setEditing(owner)
                            setName(owner.name)
                            setEmail(owner.email)
                            setTitle(owner.title ?? '')
                            setError(null)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-slate-600 hover:text-slate-900"
                          onClick={async () => {
                            const ok = window.confirm(
                              `Delete owner "${owner.name}"? Linked issue assignments will be set to Unassigned.`,
                            )
                            if (!ok) {
                              return
                            }
                            setError(null)
                            try {
                              await repository.deleteOwner(owner.id as number)
                              if (editing?.id === owner.id) {
                                reset()
                              }
                            } catch (deleteError) {
                              setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete owner.')
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
