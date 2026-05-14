import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { repository } from '../db/repository'
import {
  useCustomers,
  useOwners,
  useProjectCustomerLinks,
  useProjectOwnerLinks,
  useProjects,
} from '../hooks/useData'
import type { Project } from '../types/models'

const defaultColor = '#0F766E'

export function ProjectsPage() {
  const projects = useProjects()
  const owners = useOwners()
  const customers = useCustomers()
  const projectOwnerLinks = useProjectOwnerLinks()
  const projectCustomerLinks = useProjectCustomerLinks()

  const [editing, setEditing] = useState<Project | undefined>()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(defaultColor)

  const [assignmentProjectId, setAssignmentProjectId] = useState<number>(0)
  const [ownerSearch, setOwnerSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedOwnerIds, setSelectedOwnerIds] = useState<number[]>([])
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([])
  const [assignmentSaving, setAssignmentSaving] = useState(false)

  const linkedOwnerIdsByProject = useMemo(() => {
    return projectOwnerLinks.reduce<Record<number, number[]>>((acc, link) => {
      if (!acc[link.projectId]) {
        acc[link.projectId] = []
      }
      acc[link.projectId].push(link.ownerId)
      return acc
    }, {})
  }, [projectOwnerLinks])

  const linkedCustomerIdsByProject = useMemo(() => {
    return projectCustomerLinks.reduce<Record<number, number[]>>((acc, link) => {
      if (!acc[link.projectId]) {
        acc[link.projectId] = []
      }
      acc[link.projectId].push(link.customerId)
      return acc
    }, {})
  }, [projectCustomerLinks])

  useEffect(() => {
    if (projects.length && !projects.some((project) => project.id === assignmentProjectId)) {
      setAssignmentProjectId(projects[0].id as number)
    }
    if (!projects.length) {
      setAssignmentProjectId(0)
    }
  }, [projects, assignmentProjectId])

  useEffect(() => {
    if (!assignmentProjectId) {
      setSelectedOwnerIds([])
      setSelectedCustomerIds([])
      return
    }
    setSelectedOwnerIds(linkedOwnerIdsByProject[assignmentProjectId] ?? [])
    setSelectedCustomerIds(linkedCustomerIdsByProject[assignmentProjectId] ?? [])
  }, [assignmentProjectId, linkedOwnerIdsByProject, linkedCustomerIdsByProject])

  const filteredOwners = useMemo(() => {
    const query = ownerSearch.trim().toLowerCase()
    if (!query) {
      return owners
    }
    return owners.filter((owner) => `${owner.name} ${owner.email}`.toLowerCase().includes(query))
  }, [owners, ownerSearch])

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase()
    if (!query) {
      return customers
    }
    return customers.filter((customer) => `${customer.company} ${customer.name}`.toLowerCase().includes(query))
  }, [customers, customerSearch])

  const resetProjectForm = () => {
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

          resetProjectForm()
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
            <Button type="button" variant="secondary" onClick={resetProjectForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Assignments</h3>
          <select
            className="h-10 min-w-56 rounded-lg border border-slate-200 px-3 text-sm"
            value={assignmentProjectId}
            onChange={(event) => setAssignmentProjectId(Number(event.target.value))}
            disabled={!projects.length}
          >
            {!projects.length ? <option value={0}>No projects</option> : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <Button
            disabled={!assignmentProjectId || assignmentSaving}
            onClick={async () => {
              if (!assignmentProjectId) {
                return
              }
              setAssignmentSaving(true)
              try {
                await Promise.all([
                  repository.setProjectOwnerLinks(assignmentProjectId, selectedOwnerIds),
                  repository.setProjectCustomerLinks(assignmentProjectId, selectedCustomerIds),
                ])
              } finally {
                setAssignmentSaving(false)
              }
            }}
          >
            {assignmentSaving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>

        {!assignmentProjectId ? (
          <p className="text-sm text-slate-500">Create a project first to configure assignments.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Owners</h4>
              <input
                className="mb-3 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                placeholder="Search owners"
                value={ownerSearch}
                onChange={(event) => setOwnerSearch(event.target.value)}
              />
              <div className="max-h-52 space-y-2 overflow-auto pr-1">
                {filteredOwners.map((owner) => {
                  const checked = selectedOwnerIds.includes(owner.id as number)
                  return (
                    <label key={owner.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const ownerId = owner.id as number
                          if (event.target.checked) {
                            setSelectedOwnerIds((prev) => [...prev, ownerId])
                          } else {
                            setSelectedOwnerIds((prev) => prev.filter((id) => id !== ownerId))
                          }
                        }}
                      />
                      {owner.name}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <h4 className="mb-2 text-sm font-semibold text-slate-800">Customers</h4>
              <input
                className="mb-3 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                placeholder="Search customers"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
              />
              <div className="max-h-52 space-y-2 overflow-auto pr-1">
                {filteredCustomers.map((customer) => {
                  const checked = selectedCustomerIds.includes(customer.id as number)
                  return (
                    <label key={customer.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const customerId = customer.id as number
                          if (event.target.checked) {
                            setSelectedCustomerIds((prev) => [...prev, customerId])
                          } else {
                            setSelectedCustomerIds((prev) => prev.filter((id) => id !== customerId))
                          }
                        }}
                      />
                      {customer.company} - {customer.name}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>

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
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Owners</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Customers</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const ownerCount = (linkedOwnerIdsByProject[project.id as number] ?? []).length
                const customerCount = (linkedCustomerIdsByProject[project.id as number] ?? []).length
                return (
                  <tr key={project.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-sm font-medium text-slate-800">
                      <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: project.color }} />
                      {project.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-slate-600">{project.description}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{project.status}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{ownerCount}</td>
                    <td className="px-3 py-2 text-sm text-slate-600">{customerCount}</td>
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
                        <button
                          type="button"
                          className="text-slate-600 hover:text-slate-900"
                          onClick={() => setAssignmentProjectId(project.id as number)}
                        >
                          Assign
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
