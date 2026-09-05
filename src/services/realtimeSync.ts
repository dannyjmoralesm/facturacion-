// Real-time synchronization service for multi-device collaboration in NegoFact POS

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'offline' | 'error';

export type MutationAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'REPLACE_ALL' | 'SYNC_BATCH' | 'UPDATE_STOCK_BATCH' | 'UPDATE_BATCH';

export interface SyncMessage {
  type: 'INIT_STATE' | 'MUTATION_BROADCAST' | 'CLIENTS_COUNT' | 'PING' | 'PONG' | 'DATABASE_RESET';
  payload?: any;
  entity?: string;
  action?: string;
  senderId?: string;
  clientCount?: number;
  count?: number;
  serverTime?: number;
  timestamp?: number;
}

export interface RealtimeListenerCallbacks {
  onStatusChange?: (status: ConnectionStatus, clientCount: number) => void;
  onMutation?: (entity: string, action: string, payload: any, senderId: string) => void;
  onFullState?: (state: any) => void;
}

class RealtimeSyncManager {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'offline';
  private connectedCount: number = 1;
  private deviceId: string = '';
  private deviceName: string = '';
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private listeners: Set<RealtimeListenerCallbacks> = new Set();
  private isExplicitlyClosed: boolean = false;
  private retryDelayMs: number = 2000;

  constructor() {
    this.initDeviceIdentity();
  }

  private initDeviceIdentity(): void {
    if (typeof window === 'undefined') return;

    let storedId = localStorage.getItem('negofact_device_id');
    if (!storedId) {
      storedId = 'dev-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
      localStorage.setItem('negofact_device_id', storedId);
    }
    this.deviceId = storedId;

    let storedName = localStorage.getItem('negofact_device_name');
    if (!storedName) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      storedName = isMobile ? 'Dispositivo Móvil' : 'Terminal POS / PC';
      localStorage.setItem('negofact_device_name', storedName);
    }
    this.deviceName = storedName;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getDeviceName(): string {
    return this.deviceName;
  }

  public setDeviceName(newName: string): void {
    this.deviceName = newName;
    localStorage.setItem('negofact_device_name', newName);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'REGISTER_DEVICE',
        deviceId: this.deviceId,
        deviceName: this.deviceName
      }));
    }
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getConnectedDevicesCount(): number {
    return this.connectedCount;
  }

  public subscribe(callbacks: RealtimeListenerCallbacks): () => void {
    this.listeners.add(callbacks);
    // Immediately inform subscriber of current state
    if (callbacks.onStatusChange) {
      callbacks.onStatusChange(this.status, this.connectedCount);
    }
    return () => {
      this.listeners.delete(callbacks);
    };
  }

  private notifyStatus(status: ConnectionStatus, count: number): void {
    this.status = status;
    this.connectedCount = count;
    this.listeners.forEach(l => {
      try {
        l.onStatusChange?.(status, count);
      } catch (err) {
        console.error('Error in realtime status subscriber:', err);
      }
    });
  }

  private notifyMutation(entity: string, action: string, payload: any, senderId: string): void {
    this.listeners.forEach(l => {
      try {
        l.onMutation?.(entity, action, payload, senderId);
      } catch (err) {
        console.error('Error in realtime mutation subscriber:', err);
      }
    });
  }

  private notifyFullState(state: any): void {
    this.listeners.forEach(l => {
      try {
        l.onFullState?.(state);
      } catch (err) {
        console.error('Error in realtime full-state subscriber:', err);
      }
    });
  }

  public connect(): void {
    if (typeof window === 'undefined') return;

    // Do not reconnect if already open or connecting
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.notifyStatus('connecting', this.connectedCount);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/realtime`;

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.retryDelayMs = 2000;
        this.notifyStatus('connected', Math.max(1, this.connectedCount));

        // Register this device on the server
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.socket.send(JSON.stringify({
            type: 'REGISTER_DEVICE',
            deviceId: this.deviceId,
            deviceName: this.deviceName
          }));
        }

        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data: SyncMessage = JSON.parse(event.data);

          if (data.type === 'INIT_STATE' && data.payload) {
            if (data.clientCount !== undefined) {
              this.connectedCount = data.clientCount;
              this.notifyStatus('connected', data.clientCount);
            }
            this.notifyFullState(data.payload);
          } else if (data.type === 'CLIENTS_COUNT') {
            this.connectedCount = data.count || 1;
            this.notifyStatus('connected', this.connectedCount);
          } else if (data.type === 'MUTATION_BROADCAST') {
            if (data.entity && data.action) {
              this.notifyMutation(data.entity, data.action, data.payload, data.senderId || '');
            }
          } else if (data.type === 'DATABASE_RESET') {
            this.notifyFullState(data.payload);
          }
        } catch (parseErr) {
          console.error('Failed to parse realtime WebSocket message:', parseErr);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.notifyStatus('reconnecting', 1);
          this.scheduleReconnect();
        } else {
          this.notifyStatus('offline', 1);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('Realtime sync socket warning:', err);
        this.notifyStatus('reconnecting', 1);
      };
    } catch (err) {
      console.error('Failed to instantiate WebSocket:', err);
      this.notifyStatus('reconnecting', 1);
      this.scheduleReconnect();
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'PING' }));
      }
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.retryDelayMs = Math.min(this.retryDelayMs * 1.5, 15000);
      this.connect();
    }, this.retryDelayMs);
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyStatus('offline', 1);
  }

  // Send a mutation to the central server and broadcast to all devices
  public async broadcastMutation(
    entity: string, 
    action: MutationAction, 
    payload: any
  ): Promise<boolean> {
    const message = {
      type: 'MUTATION',
      entity,
      action,
      payload,
      senderId: this.deviceId,
      timestamp: Date.now()
    };

    // If WebSocket is active, send directly
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (wsErr) {
        console.warn('WebSocket send failed, trying HTTP fallback:', wsErr);
      }
    }

    // HTTP fallback
    try {
      const resp = await fetch('/api/sync/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity,
          action,
          payload,
          senderId: this.deviceId
        })
      });
      return resp.ok;
    } catch (httpErr) {
      console.warn('HTTP mutation sync fallback error (offline mode):', httpErr);
      return false;
    }
  }

  // Manually fetch the central state from the server
  public async fetchCentralState(): Promise<any | null> {
    try {
      const resp = await fetch('/api/sync/state');
      if (!resp.ok) return null;
      const json = await resp.json();
      if (json.success && json.data) {
        this.notifyFullState(json.data);
        if (json.connectedDevices) {
          this.notifyStatus('connected', json.connectedDevices);
        }
        return json.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching central state:', err);
      return null;
    }
  }

  // Force push local state to the central server
  public async pushFullLocalState(localState: any): Promise<boolean> {
    try {
      const resp = await fetch('/api/sync/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'all',
          action: 'SYNC_BATCH',
          payload: localState,
          senderId: this.deviceId
        })
      });
      return resp.ok;
    } catch (err) {
      console.error('Error pushing full state to server:', err);
      return false;
    }
  }

  // Reset database to initial seed defaults
  public async resetCentralDatabase(): Promise<boolean> {
    try {
      const resp = await fetch('/api/sync/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: this.deviceId })
      });
      return resp.ok;
    } catch (err) {
      console.error('Error resetting database on server:', err);
      return false;
    }
  }
}

// Global Singleton Instance
export const realtimeSync = new RealtimeSyncManager();
