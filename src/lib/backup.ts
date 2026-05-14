import { db } from '../db/database'
import { repository } from '../db/repository'
import type {
  ActivityEntry,
  Attachment,
  Comment,
  Customer,
  Issue,
  Notification,
  Owner,
  ProjectCustomerLink,
  ProjectOwnerLink,
  Project,
  Site,
} from '../types/models'

interface AttachmentBackup extends Omit<Attachment, 'blob'> {
  blobBase64: string
}

interface BackupPayloadV1 {
  version: 1
  exportedAt: string
  projects: Project[]
  owners: Owner[]
  customers: Customer[]
  issues: Issue[]
  comments: Comment[]
  activities: ActivityEntry[]
  attachments: AttachmentBackup[]
  notifications: Notification[]
}

interface BackupPayloadV2 extends Omit<BackupPayloadV1, 'version'> {
  version: 2
  sites: Site[]
}

interface BackupPayloadV3 extends Omit<BackupPayloadV2, 'version'> {
  version: 3
  projectOwnerLinks: ProjectOwnerLink[]
  projectCustomerLinks: ProjectCustomerLink[]
}

type BackupPayload = BackupPayloadV1 | BackupPayloadV2 | BackupPayloadV3

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlob(dataUrl: string) {
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function exportBackup(): Promise<BackupPayload> {
  const [
    projects,
    sites,
    owners,
    customers,
    projectOwnerLinks,
    projectCustomerLinks,
    issues,
    comments,
    activities,
    attachments,
    notifications,
  ] =
    await Promise.all([
      db.projects.toArray(),
      db.sites.toArray(),
      db.owners.toArray(),
      db.customers.toArray(),
      db.projectOwnerLinks.toArray(),
      db.projectCustomerLinks.toArray(),
      db.issues.toArray(),
      db.comments.toArray(),
      db.activities.toArray(),
      db.attachments.toArray(),
      db.notifications.toArray(),
    ])

  const serializedAttachments = await Promise.all(
    attachments.map(async (attachment) => ({
      ...attachment,
      blobBase64: await blobToDataUrl(attachment.blob),
    })),
  )

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    projects,
    sites,
    owners,
    customers,
    projectOwnerLinks,
    projectCustomerLinks,
    issues,
    comments,
    activities,
    attachments: serializedAttachments,
    notifications,
  }
}

export function downloadBackup(payload: BackupPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `issue-log-backup-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importBackup(file: File) {
  const raw = await file.text()
  const payload = JSON.parse(raw) as BackupPayload

  if (payload.version !== 1 && payload.version !== 2 && payload.version !== 3) {
    throw new Error('Unsupported backup version')
  }

  const attachments: Attachment[] = await Promise.all(
    payload.attachments.map(async (attachment) => ({
      ...attachment,
      blob: await dataUrlToBlob(attachment.blobBase64),
    })),
  )

  await repository.bulkImport({
    projects: payload.projects,
    sites: payload.version === 1 ? [] : payload.sites,
    owners: payload.owners,
    customers: payload.customers,
    projectOwnerLinks: payload.version === 3 ? payload.projectOwnerLinks : [],
    projectCustomerLinks: payload.version === 3 ? payload.projectCustomerLinks : [],
    issues: payload.issues,
    comments: payload.comments,
    activities: payload.activities,
    attachments,
    notifications: payload.notifications,
  })
}
