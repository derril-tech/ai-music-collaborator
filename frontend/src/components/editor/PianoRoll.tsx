'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Copy, Scissors } from 'lucide-react'

interface Note {
  id: string
  pitch: number
  startTime: number
  duration: number
  velocity: number
  selected?: boolean
}

interface PianoRollProps {
  notes: Note[]
  onNotesChange: (notes: Note[]) => void
  duration: number
  currentTime: number
  onTimeChange: (time: number) => void
  zoom: number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const OCTAVES = [8, 7, 6, 5, 4, 3, 2, 1, 0]

export function PianoRoll({
  notes,
  onNotesChange,
  duration,
  currentTime,
  onTimeChange,
  zoom = 1
}: PianoRollProps) {
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  
  const pianoRollRef = useRef<HTMLDivElement>(null)
  const pixelsPerSecond = 100 * zoom
  const pixelsPerNote = 20

  const handleNoteClick = (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (event.shiftKey) {
      // Multi-select
      const newSelected = new Set(selectedNotes)
      if (newSelected.has(noteId)) {
        newSelected.delete(noteId)
      } else {
        newSelected.add(noteId)
      }
      setSelectedNotes(newSelected)
    } else {
      // Single select
      setSelectedNotes(new Set([noteId]))
    }
  }

  const handlePianoRollClick = (event: React.MouseEvent) => {
    if (!pianoRollRef.current) return

    const rect = pianoRollRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Calculate time and pitch from click position
    const time = (x / pixelsPerSecond)
    const pitch = Math.floor((rect.height - y) / pixelsPerNote)

    // Create new note
    const newNote: Note = {
      id: `note_${Date.now()}`,
      pitch,
      startTime: Math.max(0, time),
      duration: 0.5,
      velocity: 80
    }

    onNotesChange([...notes, newNote])
    setSelectedNotes(new Set([newNote.id]))
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!pianoRollRef.current) return

    const rect = pianoRollRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setDragStart({ x, y })
    setIsDragging(true)
    setSelectionBox({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !pianoRollRef.current) return

    const rect = pianoRollRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setSelectionBox({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y)
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setSelectionBox(null)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const deleteSelectedNotes = () => {
    const newNotes = notes.filter(note => !selectedNotes.has(note.id))
    onNotesChange(newNotes)
    setSelectedNotes(new Set())
  }

  const duplicateSelectedNotes = () => {
    const selectedNoteIds = Array.from(selectedNotes)
    const selectedNoteObjects = notes.filter(note => selectedNoteIds.includes(note.id))
    
    const duplicatedNotes = selectedNoteObjects.map(note => ({
      ...note,
      id: `note_${Date.now()}_${Math.random()}`,
      startTime: note.startTime + 1
    }))

    onNotesChange([...notes, ...duplicatedNotes])
  }

  const getNoteName = (pitch: number) => {
    const noteName = NOTE_NAMES[pitch % 12]
    const octave = Math.floor(pitch / 12)
    return `${noteName}${octave}`
  }

  const isBlackKey = (pitch: number) => {
    return [1, 3, 6, 8, 10].includes(pitch % 12)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Piano Roll</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newNote: Note = {
                  id: `note_${Date.now()}`,
                  pitch: 60, // Middle C
                  startTime: currentTime,
                  duration: 0.5,
                  velocity: 80
                }
                onNotesChange([...notes, newNote])
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={duplicateSelectedNotes}
              disabled={selectedNotes.size === 0}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={deleteSelectedNotes}
              disabled={selectedNotes.size === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex">
          {/* Piano Keys */}
          <div className="w-16 border-r border-gray-300">
            {OCTAVES.map(octave => (
              <div key={octave} className="text-xs text-gray-500 text-center py-1">
                {octave}
              </div>
            )).reverse()}
            {Array.from({ length: 88 }, (_, i) => {
              const pitch = 87 - i
              const isBlack = isBlackKey(pitch)
              return (
                <div
                  key={pitch}
                  className={`h-5 border-b border-gray-200 text-xs flex items-center justify-center ${
                    isBlack ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                  }`}
                >
                  {getNoteName(pitch)}
                </div>
              )
            })}
          </div>

          {/* Piano Roll Grid */}
          <div className="flex-1 relative overflow-auto">
            <div
              ref={pianoRollRef}
              className="relative"
              style={{
                width: `${duration * pixelsPerSecond}px`,
                height: `${88 * pixelsPerNote}px`
              }}
              onClick={handlePianoRollClick}
              onMouseDown={handleMouseDown}
            >
              {/* Grid Lines */}
              <div className="absolute inset-0">
                {/* Vertical lines (time) */}
                {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => (
                  <div
                    key={`time-${i}`}
                    className="absolute top-0 bottom-0 border-l border-gray-200"
                    style={{ left: `${i * pixelsPerSecond}px` }}
                  />
                ))}
                
                {/* Horizontal lines (notes) */}
                {Array.from({ length: 88 }, (_, i) => (
                  <div
                    key={`note-${i}`}
                    className="absolute left-0 right-0 border-b border-gray-100"
                    style={{ top: `${i * pixelsPerNote}px` }}
                  />
                ))}
              </div>

              {/* Notes */}
              {notes.map((note) => {
                const noteY = (87 - note.pitch) * pixelsPerNote
                const noteX = note.startTime * pixelsPerSecond
                const noteWidth = note.duration * pixelsPerSecond
                const isSelected = selectedNotes.has(note.id)

                return (
                  <div
                    key={note.id}
                    className={`absolute rounded cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-2 border-blue-800'
                        : 'bg-blue-500 border border-blue-600'
                    }`}
                    style={{
                      left: `${noteX}px`,
                      top: `${noteY}px`,
                      width: `${noteWidth}px`,
                      height: `${pixelsPerNote - 2}px`
                    }}
                    onClick={(e) => handleNoteClick(note.id, e)}
                    title={`${getNoteName(note.pitch)} - ${note.startTime.toFixed(2)}s (${note.duration.toFixed(2)}s)`}
                  />
                )
              })}

              {/* Selection Box */}
              {selectionBox && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20"
                  style={{
                    left: `${selectionBox.x}px`,
                    top: `${selectionBox.y}px`,
                    width: `${selectionBox.width}px`,
                    height: `${selectionBox.height}px`
                  }}
                />
              )}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"
                style={{ left: `${currentTime * pixelsPerSecond}px` }}
              />
            </div>
          </div>
        </div>

        {/* Note Properties */}
        {selectedNotes.size === 1 && (() => {
          const selectedNote = notes.find(note => selectedNotes.has(note.id))
          if (!selectedNote) return null

          return (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <h4 className="font-medium mb-2">Note Properties</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-600">Pitch</label>
                  <input
                    type="number"
                    value={selectedNote.pitch}
                    onChange={(e) => {
                      const newNotes = notes.map(note =>
                        note.id === selectedNote.id
                          ? { ...note, pitch: parseInt(e.target.value) }
                          : note
                      )
                      onNotesChange(newNotes)
                    }}
                    className="w-full px-2 py-1 border rounded"
                    min="0"
                    max="127"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Start Time</label>
                  <input
                    type="number"
                    value={selectedNote.startTime}
                    onChange={(e) => {
                      const newNotes = notes.map(note =>
                        note.id === selectedNote.id
                          ? { ...note, startTime: parseFloat(e.target.value) }
                          : note
                      )
                      onNotesChange(newNotes)
                    }}
                    className="w-full px-2 py-1 border rounded"
                    step="0.1"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Duration</label>
                  <input
                    type="number"
                    value={selectedNote.duration}
                    onChange={(e) => {
                      const newNotes = notes.map(note =>
                        note.id === selectedNote.id
                          ? { ...note, duration: parseFloat(e.target.value) }
                          : note
                      )
                      onNotesChange(newNotes)
                    }}
                    className="w-full px-2 py-1 border rounded"
                    step="0.1"
                    min="0.1"
                  />
                </div>
                <div>
                  <label className="block text-gray-600">Velocity</label>
                  <input
                    type="number"
                    value={selectedNote.velocity}
                    onChange={(e) => {
                      const newNotes = notes.map(note =>
                        note.id === selectedNote.id
                          ? { ...note, velocity: parseInt(e.target.value) }
                          : note
                      )
                      onNotesChange(newNotes)
                    }}
                    className="w-full px-2 py-1 border rounded"
                    min="1"
                    max="127"
                  />
                </div>
              </div>
            </div>
          )
        })()}
      </CardContent>
    </Card>
  )
}
