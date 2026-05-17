import { Request, Response } from 'express'
import { logger } from './ai-config'

export interface SSEEvent {
  type: 'content' | 'metadata' | 'error' | 'done'
  data: any
}

export class SSEStreamer {
  private res: Response
  private isConnected: boolean = true
  private buffer: string[] = []

  constructor(res: Response) {
    this.res = res

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // Send initial event
    this.send({
      type: 'metadata',
      data: {
        timestamp: new Date().toISOString(),
        status: 'connected'
      }
    })

    // Handle client disconnect
    res.on('close', () => {
      this.isConnected = false
      logger.info('SSE connection closed')
    })
  }

  send(event: SSEEvent) {
    if (!this.isConnected) {
      return
    }

    try {
      const eventData = JSON.stringify(event.data)
      const message = `event: ${event.type}\ndata: ${eventData}\n\n`
      this.res.write(message)
    } catch (error) {
      logger.error('Error sending SSE message:', error)
      this.isConnected = false
    }
  }

  sendContent(content: string, isStreaming: boolean = false) {
    this.send({
      type: 'content',
      data: {
        content,
        isStreaming
      }
    })
  }

  sendError(error: string) {
    this.send({
      type: 'error',
      data: {
        error,
        timestamp: new Date().toISOString()
      }
    })
  }

  sendDone(finalData?: any) {
    this.send({
      type: 'done',
      data: {
        timestamp: new Date().toISOString(),
        ...finalData
      }
    })
  }

  end() {
    if (this.isConnected) {
      this.isConnected = false
      this.res.end()
    }
  }
}

// Utility for SSE response validation
export const validateSSEConnection = (req: Request): boolean => {
  // Check if client supports SSE
  const accept = req.headers.accept || ''
  return accept.includes('text/event-stream')
}

// Format text for better display
export const formatChatResponse = (text: string): string => {
  // Remove excessive whitespace
  let formatted = text.replace(/\s+/g, ' ').trim()

  // Add line breaks for better readability
  formatted = formatted.replace(/\. /g, '.\n\n')
  formatted = formatted.replace(/\? /g, '?\n\n')
  formatted = formatted.replace(/! /g, '!\n\n')

  return formatted
}

// Extract citations from AI response
export const extractCitations = (text: string): string[] => {
  const citationPattern = /\[source:(\d+)\]/g
  const citations: string[] = []
  let match

  while ((match = citationPattern.exec(text)) !== null) {
    citations.push(match[1])
  }

  return citations
}