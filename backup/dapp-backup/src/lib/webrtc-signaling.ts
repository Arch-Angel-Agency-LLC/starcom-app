import { gun } from './gun-db'

// WebRTC configuration with free STUN servers
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
}

export class P2PConnection {
  private peerConnection: RTCPeerConnection
  private dataChannel: RTCDataChannel | null = null
  private localAddress: string
  private remoteAddress: string
  private onMessageCallback: ((data: unknown) => void) | null = null
  private onConnectionCallback: (() => void) | null = null

  constructor(localAddress: string, remoteAddress: string) {
    this.localAddress = localAddress
    this.remoteAddress = remoteAddress
    this.peerConnection = new RTCPeerConnection(rtcConfig)
    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send candidate through Gun.js signaling
        gun.get('webrtc-signal')
          .get(this.remoteAddress)
          .get('ice-candidates')
          .set({
            from: this.localAddress,
            candidate: JSON.stringify(event.candidate),
            timestamp: Date.now()
          })
      }
    }

    // Listen for ICE candidates
    gun.get('webrtc-signal')
      .get(this.localAddress)
      .get('ice-candidates')
      .map()
      .on((data: unknown) => {
        if (data && typeof data === 'object' && 'from' in data && 'candidate' in data) {
          const signalData = data as { from: string; candidate: string }
          if (signalData.from === this.remoteAddress && signalData.candidate) {
            try {
              const candidate = JSON.parse(signalData.candidate)
              this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                .catch(err => console.error('Failed to add ICE candidate:', err))
            } catch (err) {
              console.error('Failed to parse ICE candidate:', err)
            }
          }
        }
      })

    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel
      this.setupDataChannel()
    }
  }

  private setupDataChannel() {
    if (!this.dataChannel) return

    this.dataChannel.onopen = () => {
      console.log('P2P connection established')
      if (this.onConnectionCallback) {
        this.onConnectionCallback()
      }
    }

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (this.onMessageCallback) {
          this.onMessageCallback(data)
        }
      } catch (error) {
        console.error('Failed to parse message:', error)
      }
    }

    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error)
    }

    this.dataChannel.onclose = () => {
      console.log('Data channel closed')
    }
  }

  async initiate() {
    try {
      // Create data channel
      this.dataChannel = this.peerConnection.createDataChannel('chat', {
        ordered: true
      })
      this.setupDataChannel()

      // Create offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // Send offer through Gun.js
      gun.get('webrtc-signal')
        .get(this.remoteAddress)
        .get('offers')
        .set({
          from: this.localAddress,
          offer: JSON.stringify(offer),
          timestamp: Date.now()
        })

      // Listen for answer
      gun.get('webrtc-signal')
        .get(this.localAddress)
        .get('answers')
        .map()
        .on(async (data: unknown) => {
          if (data && typeof data === 'object' && 'from' in data && 'answer' in data) {
            const signalData = data as { from: string; answer: string }
            if (signalData.from === this.remoteAddress && signalData.answer) {
              try {
                const answer = JSON.parse(signalData.answer)
                await this.peerConnection.setRemoteDescription(answer)
              } catch (err) {
                console.error('Failed to set remote description:', err)
              }
            }
          }
        })
    } catch (error) {
      console.error('Failed to initiate P2P connection:', error)
      throw error
    }
  }

  async respond() {
    // Listen for offers
    gun.get('webrtc-signal')
      .get(this.localAddress)
      .get('offers')
      .map()
      .on(async (data: unknown) => {
        if (data && typeof data === 'object' && 'from' in data && 'offer' in data) {
          const signalData = data as { from: string; offer: string }
          if (signalData.from === this.remoteAddress && signalData.offer) {
            try {
              const offer = JSON.parse(signalData.offer)
              await this.peerConnection.setRemoteDescription(offer)

              // Create answer
              const answer = await this.peerConnection.createAnswer()
              await this.peerConnection.setLocalDescription(answer)

              // Send answer
              gun.get('webrtc-signal')
                .get(this.remoteAddress)
                .get('answers')
                .set({
                  from: this.localAddress,
                  answer: JSON.stringify(answer),
                  timestamp: Date.now()
                })
            } catch (err) {
              console.error('Failed to respond to offer:', err)
            }
          }
        }
      })
  }

  send(data: unknown) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data))
      return true
    } else {
      console.warn('Data channel not open, current state:', this.dataChannel?.readyState)
      return false
    }
  }

  onMessage(callback: (data: unknown) => void) {
    this.onMessageCallback = callback
  }

  onConnection(callback: () => void) {
    this.onConnectionCallback = callback
  }

  getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close()
    }
    this.peerConnection.close()
  }
}

// AI-NOTE: WebRTC enables direct peer-to-peer connections
// Gun.js is used for signaling (exchanging connection info)
// Falls back to Gun.js messaging if P2P fails
