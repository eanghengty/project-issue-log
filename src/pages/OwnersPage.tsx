import { useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { repository } from '../db/repository'
import { useOwners } from '../hooks/useData'
import type { Owner } from '../types/models'

export function OwnersPage() {
  const owners = useOwners()
  const [editing, setEditing] = useState<Owner | undefined>()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')

  const reset = () => {
    setEditing(undefined)
    setName('')
    setEmail('')
    setTitle('')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Owners</h2>

      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!name.trim() || !email.trim()) {
            return
          }
          if (editing?.id) {
            await repository.updateOwner(editing.id, { name: name.trim(), email: email.trim(), title: title.trim() })
          } else {
            await repository.createOwner({ name: name.trim(), email: email.trim(), title: title.trim() })
          }
          reset()
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
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-sm font-medium text-slate-800">{owner.name}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{owner.email}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{owner.title}</td>
                  <td className="px-3 py-2 text-sm">
                    <button
                      type="button"
                      className="text-slate-600 hover:text-slate-900"
                      onClick={() => {
                        setEditing(owner)
                        setName(owner.name)
                        setEmail(owner.email)
                        setTitle(owner.title ?? '')
                      }}
                    >
                      Edit
                    </button>
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
