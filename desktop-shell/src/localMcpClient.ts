import { Command } from '@tauri-apps/plugin-shell'

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: any
  id?: string | number
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  id?: string | number | null
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export class LocalMcpClient {
  private commandName: string
  private child: any = null
  private pendingRequests = new Map<
    string | number,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >()
  private nextId = 1
  private onStatusChange: (status: 'checking' | 'online' | 'offline') => void
  private buffer = ''

  constructor(
    commandName: string,
    onStatusChange: (status: 'checking' | 'online' | 'offline') => void
  ) {
    this.commandName = commandName
    this.onStatusChange = onStatusChange
  }

  async start(): Promise<void> {
    try {
      this.onStatusChange('checking')

      // Process hygiene: kill existing process attached to window if any
      const globalKey = `__mcp_child_${this.commandName}`
      const oldChild = (window as any)[globalKey]
      if (oldChild) {
        try {
          await oldChild.kill()
        } catch (e) {
          console.warn('Failed to kill previous sidecar process:', e)
        }
      }

      console.log(`Spawning local MCP sidecar: ${this.commandName}`)
      const command = Command.sidecar(this.commandName)
      this.child = await command.spawn()
      ;(window as any)[globalKey] = this.child

      // Handle standard output
      this.child.stdout.on('data', (data: string) => {
        this.handleStdout(data)
      })

      // Handle stderr for logging
      this.child.stderr.on('data', (data: string) => {
        console.error(`[${this.commandName} stderr]:`, data)
      })

      // Handle exit/close
      this.child.on('close', (data: any) => {
        console.warn(`[${this.commandName}] sidecar process closed:`, data)
        this.onStatusChange('offline')
        this.child = null
      })

      // Send initialize request to establish connection
      const initResult = await this.call('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'alchm-desktop-shell', version: '1.0.0' },
      })
      console.log(`[${this.commandName}] initialized successfully:`, initResult)

      // Send initialized notification
      await this.sendNotification('notifications/initialized')

      this.onStatusChange('online')
    } catch (error) {
      console.error(`Failed to start sidecar ${this.commandName}:`, error)
      this.onStatusChange('offline')
      this.child = null
    }
  }

  async stop(): Promise<void> {
    if (this.child) {
      try {
        await this.child.kill()
      } catch (e) {
        console.error(`Failed to kill sidecar ${this.commandName}:`, e)
      }
      this.child = null
    }
    this.onStatusChange('offline')
  }

  async call(method: string, params: any = {}): Promise<any> {
    if (!this.child) {
      throw new Error(`Sidecar ${this.commandName} is not running`)
    }

    const id = this.nextId++
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id,
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })
      this.writeToStdin(request)

      // Auto-timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          const req = this.pendingRequests.get(id)
          this.pendingRequests.delete(id)
          req?.reject(new Error(`MCP Request timed out: ${method} (id: ${id})`))
        }
      }, 30000)
    })
  }

  private async sendNotification(method: string, params: any = {}): Promise<void> {
    if (!this.child) return
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
    }
    this.writeToStdin(request)
  }

  private writeToStdin(request: JsonRpcRequest) {
    if (!this.child) return
    const line = JSON.stringify(request) + '\n'
    this.child.write(line)
  }

  private handleStdout(data: string) {
    this.buffer += data
    let newlineIndex: number
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim()
      this.buffer = this.buffer.slice(newlineIndex + 1)

      if (!line) continue

      try {
        const response: JsonRpcResponse = JSON.parse(line)
        if (response.id !== undefined && response.id !== null) {
          const handler = this.pendingRequests.get(response.id)
          if (handler) {
            this.pendingRequests.delete(response.id)
            if (response.error) {
              handler.reject(new Error(response.error.message))
            } else {
              handler.resolve(response.result)
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse JSON-RPC line from stdout:', line, e)
      }
    }
  }

  isOnline(): boolean {
    return this.child !== null
  }
}
