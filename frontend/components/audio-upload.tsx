'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, Music, FileAudio, Download, AlertCircle, CheckCircle,
  Play, Pause, Volume2, Settings, X, FileText
} from 'lucide-react';

interface AudioUploadProps {
  projectId: string;
  onUploadComplete?: (result: any) => void;
  onMidiGenerated?: (midiData: any) => void;
  className?: string;
}

interface UploadProgress {
  uploadId: string;
  step: string;
  progress: number;
  status: 'uploading' | 'converting' | 'completed' | 'error';
  audioUrl?: string;
  midiUrl?: string;
  conversionResults?: {
    detectedKey?: string;
    detectedTempo?: number;
    noteCount?: number;
    confidence?: number;
  };
}

export function AudioUpload({ 
  projectId, 
  onUploadComplete, 
  onMidiGenerated,
  className 
}: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionMode, setConversionMode] = useState<'full' | 'melody' | 'harmony' | 'rhythm'>('full');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [quantize, setQuantize] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    
    if (audioFile) {
      setSelectedFile(audioFile);
      setError(null);
    } else {
      setError('Please select an audio file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      setError(null);
    } else if (file) {
      setError('Please select an audio file');
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Get signed URL for upload
      const signedUrlResponse = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type,
          projectId,
          expiresIn: 3600,
        }),
      });

      if (!signedUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileKey } = await signedUrlResponse.json();

      // Upload file to signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Start conversion process
      const conversionResponse = await fetch('/api/upload/audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          format: selectedFile.name.split('.').pop()?.toLowerCase() || 'wav',
          convertToMidi: true,
          midiMode: conversionMode,
          pitchConfidence: confidenceThreshold,
          quantize,
        }),
      });

      if (!conversionResponse.ok) {
        throw new Error('Failed to start conversion');
      }

      // Set up SSE for progress updates
      const reader = conversionResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setUploadProgress(data);
              
              if (data.status === 'completed') {
                setIsUploading(false);
                onUploadComplete?.(data);
                if (data.midiUrl) {
                  onMidiGenerated?.(data);
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setIsUploading(false);
    }
  };

  const handleConvertToMidi = async () => {
    if (!uploadProgress?.uploadId) return;

    setIsUploading(true);
    setError(null);

    try {
      const response = await fetch(`/api/upload/audio/${uploadProgress.uploadId}/convert-midi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: conversionMode,
          confidence: confidenceThreshold,
          quantize,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start MIDI conversion');
      }

      // Handle SSE progress updates
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              setUploadProgress(prev => ({ ...prev, ...data }));
              
              if (data.status === 'completed') {
                setIsUploading(false);
                onMidiGenerated?.(data);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'MIDI conversion failed');
      setIsUploading(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Audio Upload & MIDI Conversion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your audio file here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports WAV, MP3, FLAC, M4A, OGG
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Choose File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileAudio className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)} • {selectedFile.type}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Conversion Settings */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Conversion Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conversion Mode
                </label>
                <select
                  value={conversionMode}
                  onChange={(e) => setConversionMode(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={isUploading}
                >
                  <option value="full">Full (Melody + Harmony + Rhythm)</option>
                  <option value="melody">Melody Only</option>
                  <option value="harmony">Harmony Only</option>
                  <option value="rhythm">Rhythm Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confidence Threshold
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full"
                  disabled={isUploading}
                />
                <span className="text-sm text-gray-500">{confidenceThreshold}</span>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="quantize"
                  checked={quantize}
                  onChange={(e) => setQuantize(e.target.checked)}
                  className="mr-2"
                  disabled={isUploading}
                />
                <label htmlFor="quantize" className="text-sm font-medium text-gray-700">
                  Quantize Timing
                </label>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Convert
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {uploadProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Conversion Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{uploadProgress.step}</span>
                <span className="text-gray-600">{uploadProgress.progress.toFixed(0)}%</span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full" />
            </div>

            {uploadProgress.status === 'completed' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Conversion completed successfully!</span>
                </div>

                {/* Results */}
                {uploadProgress.conversionResults && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Key</p>
                      <p className="font-semibold">{uploadProgress.conversionResults.detectedKey}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Tempo</p>
                      <p className="font-semibold">{uploadProgress.conversionResults.detectedTempo} BPM</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="font-semibold">{uploadProgress.conversionResults.noteCount}</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Confidence</p>
                      <p className="font-semibold">{(uploadProgress.conversionResults.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                )}

                {/* Download Links */}
                <div className="flex gap-2">
                  {uploadProgress.audioUrl && (
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(uploadProgress.audioUrl!, 'audio.wav')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Audio
                    </Button>
                  )}
                  {uploadProgress.midiUrl && (
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(uploadProgress.midiUrl!, 'converted.mid')}
                    >
                      <Music className="h-4 w-4 mr-2" />
                      Download MIDI
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
