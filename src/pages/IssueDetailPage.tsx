import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/EmptyState'
import { ActivityLog } from '../components/issues/ActivityLog'
import { AttachmentList } from '../components/issues/AttachmentList'
import { CommentList } from '../components/issues/CommentList'
import { repository } from '../db/repository'
import { useActivities, useAttachments, useComments, useCustomers, useIssue, useOwners, useProjects } from '../hooks/useData'

export function IssueDetailPage() {
  const params = useParams()
  const issueId = Number(params.id)

  const issue = useIssue(Number.isFinite(issueId) ? issueId : undefined)
  const comments = useComments(issue?.id)
  const activities = useActivities(issue?.id)
  const attachments = useAttachments(issue?.id)
  const projects = useProjects()
  const owners = useOwners()
  const customers = useCustomers()

  const [commentAuthor, setCommentAuthor] = useState('System User')
  const [commentBody, setCommentBody] = useState('')

  const projectName = useMemo(
    () => projects.find((project) => project.id === issue?.projectId)?.name,
    [projects, issue],
  )
  const ownerName = useMemo(
    () => owners.find((owner) => owner.id === issue?.ownerId)?.name ?? 'Unassigned',
    [owners, issue],
  )
  const customerName = useMemo(
    () => customers.find((customer) => customer.id === issue?.customerId)?.company ?? 'Unassigned',
    [customers, issue],
  )

  if (!issue) {
    return <EmptyState title="Issue not found" description="Select an issue from the list to view details." />
  }

  return (
    <div className="space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-500">{issue.issueNumber}</p>
            <h2 className="text-2xl font-semibold text-slate-900">{issue.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{issue.description || 'No description provided.'}</p>
          </div>
          <div className="flex gap-2">
            <Badge kind="status" value={issue.status} />
            <Badge kind="priority" value={issue.priority} />
          </div>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-500">Project</dt>
            <dd className="font-medium text-slate-800">{projectName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Owner</dt>
            <dd className="font-medium text-slate-800">{ownerName}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Customer</dt>
            <dd className="font-medium text-slate-800">{customerName}</dd>
          </div>
        </dl>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Comments</h3>

            <form
              className="mb-4 space-y-2"
              onSubmit={async (event) => {
                event.preventDefault()
                if (!commentBody.trim()) {
                  return
                }
                await repository.addComment(issue.id as number, commentBody.trim(), commentAuthor.trim() || 'System User')
                setCommentBody('')
              }}
            >
              <input
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                placeholder="Author"
                value={commentAuthor}
                onChange={(event) => setCommentAuthor(event.target.value)}
              />
              <textarea
                className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Write a comment"
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
              />
              <Button type="submit">Add Comment</Button>
            </form>

            <CommentList comments={comments} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Attachments</h3>
            <p className="mb-2 text-xs text-slate-500">Recommended max file size: 10 MB each.</p>
            <AttachmentList
              attachments={attachments}
              onUpload={async (file) => {
                if (file.size > 10 * 1024 * 1024) {
                  window.alert('File is larger than 10 MB and may exceed browser storage limits.')
                }
                await repository.addAttachment(issue.id as number, file, 'System User')
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Activity History</h3>
          <ActivityLog activities={activities} />
        </div>
      </section>
    </div>
  )
}
