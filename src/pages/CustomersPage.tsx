import { useState } from 'react'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { repository } from '../db/repository'
import { useCustomers } from '../hooks/useData'
import type { Customer } from '../types/models'

export function CustomersPage() {
  const customers = useCustomers()
  const [editing, setEditing] = useState<Customer | undefined>()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const reset = () => {
    setEditing(undefined)
    setName('')
    setCompany('')
    setEmail('')
    setPhone('')
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Customers</h2>

      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5"
        onSubmit={async (event) => {
          event.preventDefault()
          if (!name.trim() || !company.trim()) {
            return
          }

          if (editing?.id) {
            await repository.updateCustomer(editing.id, {
              name: name.trim(),
              company: company.trim(),
              email: email.trim(),
              phone: phone.trim(),
            })
          } else {
            await repository.createCustomer({
              name: name.trim(),
              company: company.trim(),
              email: email.trim(),
              phone: phone.trim(),
            })
          }

          reset()
        }}
      >
        <input
          className="h-10 rounded-lg border border-slate-200 px-3"
          placeholder="Contact Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <input
          className="h-10 rounded-lg border border-slate-200 px-3"
          placeholder="Company"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          required
        />
        <input
          className="h-10 rounded-lg border border-slate-200 px-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="h-10 rounded-lg border border-slate-200 px-3"
          placeholder="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Button type="submit">{editing ? 'Update Customer' : 'Add Customer'}</Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState title="No customers yet" description="Add customer contacts for project issues." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Contact</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Company</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Email</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Phone</th>
                <th className="px-3 py-2 text-left text-xs uppercase text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-sm font-medium text-slate-800">{customer.name}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{customer.company}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{customer.email}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{customer.phone}</td>
                  <td className="px-3 py-2 text-sm">
                    <button
                      type="button"
                      className="text-slate-600 hover:text-slate-900"
                      onClick={() => {
                        setEditing(customer)
                        setName(customer.name)
                        setCompany(customer.company)
                        setEmail(customer.email ?? '')
                        setPhone(customer.phone ?? '')
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
