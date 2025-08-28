'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Pause, Square, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react'
import { formatTime } from '@/lib/utils'

interface TimelineProps {
  duration: number
  currentTime: number
  onTimeChange: (time: number) => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  isPlaying: boolean
  sections?: Array<{
    id: string
    name: string
    startTime: number
    endTime: number
    type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro'
  }>
}

export function Timeline({
  duration,
  currentTime,
  onTimeChange,
  onPlay,
  onPause,
  onStop,
  isPlaying,
  sections = []
}: TimelineProps) {
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  const pixelsPerSecond = 100 * zoom
  const timelineWidth = duration * pixelsPerSecond

  useEffect(() => {
    if (playheadRef.current) {
      const playheadPosition = (currentTime / duration) * 100
      playheadRef.current.style.left = `${playheadPosition}%`
    }
  }, [currentTime, duration])

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickPercent = clickX / rect.width
    const newTime = clickPercent * duration

    onTimeChange(Math.max(0, Math.min(newTime, duration)))
  }

  const handlePlayheadDrag = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const dragX = e.clientX - rect.left
    const dragPercent = dragX / rect.width
    const newTime = dragPercent * duration

    onTimeChange(Math.max(0, Math.min(newTime, duration)))
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handlePlayheadDrag as any)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handlePlayheadDrag as any)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  const getSectionColor = (type: string) => {
    switch (type) {
      case 'verse': return 'bg-blue-500'
      case 'chorus': return 'bg-green-500'
      case 'bridge': return 'bg-purple-500'
      case 'intro': return 'bg-yellow-500'
      case 'outro': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Transport Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPlay}
              disabled={isPlaying}
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onPause}
              disabled={!isPlaying}
            >
              <Pause className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTimeChange(Math.max(0, currentTime - 5))}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTimeChange(Math.min(duration, currentTime + 5))}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(5, zoom + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          <div
            ref={timelineRef}
            className="relative h-16 bg-gray-100 border border-gray-300 rounded cursor-pointer overflow-hidden"
            onClick={handleTimelineClick}
            style={{ width: `${timelineWidth}px` }}
          >
            {/* Grid Lines */}
            <div className="absolute inset-0">
              {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-gray-300"
                  style={{ left: `${(i / duration) * 100}%` }}
                >
                  <div className="absolute bottom-0 left-1 text-xs text-gray-500">
                    {i}s
                  </div>
                </div>
              ))}
            </div>

            {/* Sections */}
            {sections.map((section) => (
              <div
                key={section.id}
                className={`absolute top-2 bottom-2 ${getSectionColor(section.type)} opacity-80 rounded`}
                style={{
                  left: `${(section.startTime / duration) * 100}%`,
                  width: `${((section.endTime - section.startTime) / duration) * 100}%`,
                }}
                title={`${section.name} (${section.type})`}
              >
                <div className="px-2 py-1 text-xs text-white font-medium truncate">
                  {section.name}
                </div>
              </div>
            ))}

            {/* Playhead */}
            <div
              ref={playheadRef}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-ew-resize"
              style={{ left: '0%' }}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          </div>
        </div>

        {/* Section Labels */}
        {sections.length > 0 && (
          <div className="mt-2 flex space-x-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`px-2 py-1 rounded text-xs font-medium ${getSectionColor(section.type)} text-white`}
              >
                {section.name}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
