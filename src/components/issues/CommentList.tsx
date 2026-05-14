import { format } from 'date-fns'
import type { Comment } from '../../types/models'

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <article key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700">{comment.author}</span>
            <span>{format(new Date(comment.createdAt), 'dd MMM yyyy HH:mm')}</span>
          </div>
          <p className="text-sm text-slate-700">{comment.body}</p>
        </article>
      ))}
    </div>
  )
}
