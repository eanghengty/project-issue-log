import { subDays } from 'date-fns'
import { repository } from './repository'

const colors = ['#0F766E', '#9333EA', '#0C4A6E', '#B45309']

export async function loadDemoData() {
  const projectIds = await Promise.all([
    repository.createProject({
      name: 'Airport Upgrade',
      description: 'Runway drainage and lighting update',
      status: 'active',
      color: colors[0],
    }),
    repository.createProject({
      name: 'Bridge Retrofit',
      description: 'Structural reinforcement package',
      status: 'active',
      color: colors[1],
    }),
    repository.createProject({
      name: 'Rail Signalling',
      description: 'Safety and systems integration',
      status: 'active',
      color: colors[2],
    }),
  ])

  const ownerIds = await Promise.all([
    repository.createOwner({ name: 'Alice Chen', email: 'alice@company.com', title: 'Project Engineer' }),
    repository.createOwner({ name: 'Sam Harris', email: 'sam@company.com', title: 'Site Supervisor' }),
    repository.createOwner({ name: 'Priya Singh', email: 'priya@company.com', title: 'Quality Lead' }),
  ])

  const customerIds = await Promise.all([
    repository.createCustomer({
      name: 'James Nguyen',
      company: 'City Infrastructure Authority',
      email: 'james@cia.gov',
      phone: '+61-401-000-111',
    }),
    repository.createCustomer({
      name: 'Karen Adams',
      company: 'Metro Projects Group',
      email: 'karen@metroprojects.com',
      phone: '+61-402-000-222',
    }),
  ])

  const siteIds = await Promise.all([
    repository.createSite({
      siteId: 'AP-01',
      siteName: 'North Runway Drainage',
      projectId: projectIds[0],
    }),
    repository.createSite({
      siteId: 'BR-22',
      siteName: 'East Span Support',
      projectId: projectIds[1],
    }),
    repository.createSite({
      siteId: 'RS-05',
      siteName: 'Cabinet Cluster A',
      projectId: projectIds[2],
    }),
  ])

  const issueIds = await Promise.all([
    repository.createIssue({
      projectId: projectIds[0],
      siteRefId: siteIds[0],
      title: 'Drainage trench depth mismatch',
      description: 'As-built trench depth does not match approved drawings on chainage 1.2-1.6.',
      status: 'Open',
      priority: 'High',
      category: 'Civil',
      ownerId: ownerIds[0],
      customerId: customerIds[0],
      dueDate: subDays(new Date(), 1).toISOString(),
    }, 'Seeder'),
    repository.createIssue({
      projectId: projectIds[1],
      siteRefId: siteIds[1],
      title: 'Bearing plate delivery delay',
      description: 'Supplier revised ETA by 5 days. Sequence impact under review.',
      status: 'In Progress',
      priority: 'Medium',
      category: 'Procurement',
      ownerId: ownerIds[1],
      customerId: customerIds[1],
      dueDate: subDays(new Date(), -5).toISOString(),
    }, 'Seeder'),
    repository.createIssue({
      projectId: projectIds[2],
      siteRefId: siteIds[2],
      title: 'Signal cabinet grounding defect',
      description: 'Ground resistance exceeds tolerance during commissioning test.',
      status: 'Blocked',
      priority: 'Critical',
      category: 'Electrical',
      ownerId: ownerIds[2],
      customerId: customerIds[0],
      dueDate: subDays(new Date(), 2).toISOString(),
    }, 'Seeder'),
  ])

  await repository.addComment(issueIds[0], 'Initial inspection completed, waiting on survey update.', 'Alice Chen')
  await repository.addComment(issueIds[1], 'Supplier confirmed dispatch by Friday.', 'Sam Harris')
  await repository.updateIssue(issueIds[1], { status: 'Resolved' }, 'Priya Singh')
  await repository.createOverdueNotifications()
}
