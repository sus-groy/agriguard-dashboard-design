"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"

interface VoiceContextType {
  isActive: boolean
  isConnected: boolean
  toggleVoice: () => void
  updateContext: (text: string) => void
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      // Connect to Gemini Live API WebSocket
      const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/voice-partner`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
      }

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data)
        // Handle audio playback (24kHz)
        if (message.type === "audio" && message.data) {
          playAudio(message.data)
        }
      }

      wsRef.current.onerror = () => {
        setIsConnected(false)
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
      }
    } catch (error) {
      console.error("WebSocket connection error:", error)
      setIsConnected(false)
    }
  }, [])

  // Initialize audio context for 16kHz recording
  const initAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)

      // Resample audio to 16kHz for WebSocket transmission
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0)
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "audio",
              data: Array.from(inputData),
              sampleRate: 16000,
            }),
          )
        }
      }

      source.connect(processor)
      processor.connect(audioContext.destination)
    } catch (error) {
      console.error("Audio recording error:", error)
    }
  }, [])

  // Play audio response at 24kHz
  const playAudio = useCallback((audioData: Float32Array | number[]) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const audioContext = audioContextRef.current
      const audioBuffer = audioContext.createBuffer(1, audioData.length, 24000)
      const channelData = audioBuffer.getChannelData(0)

      if (audioData instanceof Float32Array) {
        channelData.set(audioData)
      } else {
        for (let i = 0; i < audioData.length; i++) {
          channelData[i] = audioData[i]
        }
      }

      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.start(0)
    } catch (error) {
      console.error("Audio playback error:", error)
    }
  }, [])

  // Update context with diagnosis or field information
  const updateContext = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "context",
          data: text,
        }),
      )
    }
  }, [])

  const toggleVoice = useCallback(() => {
    if (isActive) {
      // Disconnect
      wsRef.current?.close()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      audioContextRef.current?.close()
      setIsActive(false)
      setIsConnected(false)
    } else {
      // Connect
      setIsActive(true)
      connectWebSocket()
      setTimeout(() => initAudioRecording(), 500)
    }
  }, [isActive, connectWebSocket, initAudioRecording])

  useEffect(() => {
    return () => {
      wsRef.current?.close()
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      audioContextRef.current?.close()
    }
  }, [])

  const value: VoiceContextType = {
    isActive,
    isConnected,
    toggleVoice,
    updateContext,
  }

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}

export function useVoice() {
  const context = useContext(VoiceContext)
  if (context === undefined) {
    throw new Error("useVoice must be used within a VoiceProvider")
  }
  return context
}
