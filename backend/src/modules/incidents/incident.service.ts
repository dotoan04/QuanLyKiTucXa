import { PrismaClient, IncidentCategory, IncidentPriority, IncidentStatus } from '@prisma/client'
import { AppError } from '../../common/utils/app-error'

const prisma = new PrismaClient()

interface IncidentQueryParams {
  page?: number
  limit?: number
  status?: string
  category?: string
  priority?: string
  reporterId?: string
  assignedTo?: string
  roomId?: string
  search?: string
}

interface CreateIncidentInput {
  reporterId: string
  roomId: string
  category: IncidentCategory
  title: string
  description: string
  images?: string[]
  priority?: IncidentPriority
}

interface UpdateIncidentInput {
  category?: IncidentCategory
  title?: string
  description?: string
  images?: string[]
  priority?: IncidentPriority
}

class IncidentService {
  async findAll(params: IncidentQueryParams) {
    const page = params.page || 1
    const limit = params.limit || 10
    const skip = (page - 1) * limit
    const where: any = {}

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { reporter: { fullName: { contains: params.search, mode: 'insensitive' } } }
      ]
    }

    if (params.status) {
      where.status = params.status
    }

    if (params.category) {
      where.category = params.category
    }

    if (params.priority) {
      where.priority = params.priority
    }

    if (params.reporterId) {
      where.reporterId = params.reporterId
    }

    if (params.assignedTo) {
      where.assignedTo = params.assignedTo
    }

    if (params.roomId) {
      where.roomId = params.roomId
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        include: {
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true
            }
          },
          room: {
            include: {
              roomType: true
            }
          },
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.incident.count({ where })
    ])

    return {
      incidents,
      page,
      limit,
      total
    }
  }

  async findById(id: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true
          }
        },
        room: {
          include: {
            roomType: true,
            contracts: {
              where: { status: 'active' },
              include: {
                student: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phone: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!incident) {
      throw AppError.notFound('Incident')
    }

    return incident
  }

  async create(data: CreateIncidentInput) {
    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: data.roomId }
    })

    if (!room) {
      throw AppError.notFound('Room')
    }

    // Check if reporter exists
    const reporter = await prisma.user.findUnique({
      where: { id: data.reporterId }
    })

    if (!reporter) {
      throw AppError.notFound('User')
    }

    // Create incident
    const incident = await prisma.incident.create({
      data: {
        reporterId: data.reporterId,
        roomId: data.roomId,
        category: data.category,
        title: data.title,
        description: data.description,
        images: data.images || [],
        priority: data.priority || IncidentPriority.medium,
        status: IncidentStatus.pending
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        room: {
          include: {
            roomType: true
          }
        }
      }
    })

    // Notify relevant staff about new incident
    const staffUsers = await prisma.user.findMany({
      where: {
        role: { in: ['admin', 'staff'] },
        isActive: true
      },
      take: 5
    })

    await Promise.all(
      staffUsers.map(staff =>
        prisma.notification.create({
          data: {
            userId: staff.id,
            type: 'incident_update',
            title: 'New Incident Reported',
            message: `New ${incident.category} incident reported: ${incident.title} in Room ${room.roomNumber}`,
            referenceId: incident.id,
            referenceType: 'incident'
          }
        })
      )
    )

    return incident
  }

  async update(id: string, data: UpdateIncidentInput) {
    const incident = await prisma.incident.findUnique({
      where: { id }
    })

    if (!incident) {
      throw AppError.notFound('Incident')
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        category: data.category,
        title: data.title,
        description: data.description,
        images: data.images,
        priority: data.priority
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        room: {
          include: {
            roomType: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Notify reporter about update
    if (data.title || data.description || data.priority) {
      await prisma.notification.create({
        data: {
          userId: incident.reporterId,
          type: 'incident_update',
          title: 'Incident Updated',
          message: `Your incident "${updatedIncident.title}" has been updated`,
          referenceId: updatedIncident.id,
          referenceType: 'incident'
        }
      })
    }

    return updatedIncident
  }

  async assignIncident(id: string, assignedTo: string, assignedBy: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: true
      }
    })

    if (!incident) {
      throw AppError.notFound('Incident')
    }

    // Check if assignedTo user exists and is staff/admin
    const assignee = await prisma.user.findFirst({
      where: {
        id: assignedTo,
        role: { in: ['admin', 'staff'] }
      }
    })

    if (!assignee) {
      throw AppError.notFound('Staff member')
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        assignedTo,
        status: IncidentStatus.in_progress
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        room: {
          include: {
            roomType: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Notify assignee
    await prisma.notification.create({
      data: {
        userId: assignedTo,
        type: 'incident_update',
        title: 'Incident Assigned',
        message: `You have been assigned to incident: ${updatedIncident.title}`,
        referenceId: updatedIncident.id,
        referenceType: 'incident'
      }
    })

    // Notify reporter
    await prisma.notification.create({
      data: {
        userId: incident.reporterId,
        type: 'incident_update',
        title: 'Incident Assigned',
        message: `Your incident "${updatedIncident.title}" has been assigned to ${assignee.fullName}`,
        referenceId: updatedIncident.id,
        referenceType: 'incident'
      }
    })

    return updatedIncident
  }

  async updateStatus(id: string, status: IncidentStatus, updatedBy: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: true
      }
    })

    if (!incident) {
      throw AppError.notFound('Incident')
    }

    if (incident.status === status) {
      throw AppError.badRequest(`Incident is already ${status}`)
    }

    // Validate status transitions
    if (incident.status === IncidentStatus.resolved && status !== IncidentStatus.resolved) {
      throw AppError.badRequest('Cannot change status of resolved incident')
    }

    const updateData: any = { status }

    if (status === IncidentStatus.resolved) {
      updateData.resolvedAt = new Date()
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        room: {
          include: {
            roomType: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Notify reporter
    await prisma.notification.create({
      data: {
        userId: incident.reporterId,
        type: 'incident_update',
        title: `Incident ${status}`,
        message: `Your incident "${updatedIncident.title}" is now ${status}`,
        referenceId: updatedIncident.id,
        referenceType: 'incident'
      }
    })

    return updatedIncident
  }

  async resolveIncident(id: string, resolutionNote: string, resolvedBy: string) {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reporter: true
      }
    })

    if (!incident) {
      throw AppError.notFound('Incident')
    }

    if (incident.status === IncidentStatus.resolved) {
      throw AppError.badRequest('Incident is already resolved')
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.resolved,
        resolutionNote,
        resolvedAt: new Date()
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        room: {
          include: {
            roomType: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Notify reporter
    await prisma.notification.create({
      data: {
        userId: incident.reporterId,
        type: 'incident_update',
        title: 'Incident Resolved',
        message: `Your incident "${updatedIncident.title}" has been resolved`,
        referenceId: updatedIncident.id,
        referenceType: 'incident'
      }
    })

    return updatedIncident
  }

  async deleteIncident(id: string) {
    const incident = await prisma.incident.findUnique({
      where: { id }
    })

    if (!incident) {
      throw AppError.notFound('Incident')
    }

    if (incident.status !== IncidentStatus.resolved) {
      throw AppError.badRequest('Can only delete resolved incidents')
    }

    await prisma.incident.delete({
      where: { id }
    })

    return true
  }

  async getStats() {
    const [total, pending, inProgress, resolved, closed, byCategory, byPriority, byAssignee] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: IncidentStatus.pending } }),
      prisma.incident.count({ where: { status: IncidentStatus.in_progress } }),
      prisma.incident.count({ where: { status: IncidentStatus.resolved } }),
      prisma.incident.count({ where: { status: IncidentStatus.closed } }),
      prisma.incident.groupBy({
        by: ['category'],
        _count: {
          id: true
        }
      }),
      prisma.incident.groupBy({
        by: ['priority'],
        _count: {
          id: true
        }
      }),
      prisma.incident.groupBy({
        by: ['assignedTo'],
        _count: {
          id: true
        },
        where: {
          assignedTo: {
            not: null
          }
        },
        take: 10,
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })
    ])

    // Get average resolution time
    const resolvedIncidents = await prisma.incident.findMany({
      where: {
        status: IncidentStatus.resolved,
        resolvedAt: {
          not: null
        }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      }
    })

    const avgResolutionTime = resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, inc) => {
          const hours = (inc.resolvedAt!.getTime() - inc.createdAt.getTime()) / (1000 * 60 * 60)
          return sum + hours
        }, 0) / resolvedIncidents.length
      : 0

    // Get recent incidents
    const recentIncidents = await prisma.incident.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true
          }
        },
        room: {
          select: {
            roomNumber: true,
            building: true
          }
        }
      }
    })

    return {
      total,
      byStatus: {
        pending,
        inProgress,
        resolved,
        closed
      },
      byCategory: byCategory.map(stat => ({
        category: stat.category,
        count: stat._count.id
      })),
      byPriority: byPriority.map(stat => ({
        priority: stat.priority,
        count: stat._count.id
      })),
      topAssignees: await Promise.all(
        byAssignee.map(async (stat) => {
          const user = await prisma.user.findUnique({
            where: { id: stat.assignedTo! },
            select: {
              id: true,
              fullName: true,
              avatarUrl: true
            }
          })
          return {
            user,
            count: stat._count.id
          }
        })
      ),
      avgResolutionTime: Math.round(avgResolutionTime),
      recentIncidents
    }
  }

  async getMyIncidents(userId: string) {
    const [reported, assigned] = await Promise.all([
      prisma.incident.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          room: {
            include: {
              roomType: true
            }
          },
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          }
        }
      }),
      prisma.incident.findMany({
        where: { assignedTo: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatarUrl: true
            }
          },
          room: {
            include: {
              roomType: true
            }
          }
        }
      })
    ])

    return {
      reported,
      assigned
    }
  }
}

export const incidentService = new IncidentService()
