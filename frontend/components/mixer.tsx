'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Volume2, 
  Mic, 
  Guitar, 
  Drum, 
  Piano, 
  Settings, 
  Play, 
  Pause, 
  Square,
  RotateCcw,
  RotateCw
} from 'lucide-react';

interface Stem {
  id: string;
  name: string;
  role: string;
  level: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  sends: {
    reverb: number;
    delay: number;
    compression: number;
  };
  meters: {
    left: number;
    right: number;
    peak: number;
  };
}

interface MixerProps {
  stems: Stem[];
  onStemChange: (stemId: string, changes: Partial<Stem>) => void;
  onMasterChange: (changes: { level: number; pan: number }) => void;
  onRender: () => void;
}

export function Mixer({ stems, onStemChange, onMasterChange, onRender }: MixerProps) {
  const [masterLevel, setMasterLevel] = useState(0);
  const [masterPan, setMasterPan] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3 minutes default
  const audioRef = useRef<HTMLAudioElement>(null);

  // Simulate real-time meter updates
  useEffect(() => {
    const interval = setInterval(() => {
      stems.forEach(stem => {
        const newMeters = {
          left: Math.random() * 0.8,
          right: Math.random() * 0.8,
          peak: Math.random() * 0.9,
        };
        onStemChange(stem.id, { meters: newMeters });
      });
    }, 100);

    return () => clearInterval(interval);
  }, [stems, onStemChange]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStemIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'vocals':
      case 'melody':
        return <Mic className="w-4 h-4" />;
      case 'guitar':
      case 'harmony':
        return <Guitar className="w-4 h-4" />;
      case 'drums':
      case 'rhythm':
        return <Drum className="w-4 h-4" />;
      case 'piano':
      case 'keys':
        return <Piano className="w-4 h-4" />;
      default:
        return <Volume2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Transport Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Transport Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="w-10 h-10 p-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStop}
                className="w-10 h-10 p-0"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span>{formatTime(currentTime)}</span>
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span>{formatTime(duration)}</span>
            </div>

            <audio
              ref={audioRef}
              onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
              onLoadedMetadata={() => setDuration(audioRef.current?.duration || 180)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stems.map((stem) => (
          <Card key={stem.id} className="min-h-[300px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {getStemIcon(stem.role)}
                {stem.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Level Fader */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Level</span>
                  <span>{Math.round(stem.level * 100)}%</span>
                </div>
                <div className="relative h-32 bg-gray-100 rounded-lg">
                  <Slider
                    orientation="vertical"
                    value={[stem.level]}
                    onValueChange={([value]) => onStemChange(stem.id, { level: value })}
                    className="h-full"
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b-lg" />
                </div>
              </div>

              {/* Pan Control */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Pan</span>
                  <span>{stem.pan > 0 ? `R ${Math.round(stem.pan * 100)}%` : `L ${Math.round(Math.abs(stem.pan) * 100)}%`}</span>
                </div>
                <Slider
                  value={[stem.pan]}
                  onValueChange={([value]) => onStemChange(stem.id, { pan: value })}
                  min={-1}
                  max={1}
                  step={0.01}
                  className="w-full"
                />
              </div>

              {/* Meters */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>L</span>
                  <span>R</span>
                </div>
                <div className="flex gap-1 h-16">
                  <div className="flex-1 bg-gray-200 rounded overflow-hidden">
                    <div 
                      className={cn(
                        "w-full transition-all duration-100",
                        stem.meters.left > 0.8 ? "bg-red-500" : 
                        stem.meters.left > 0.6 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ height: `${stem.meters.left * 100}%` }}
                    />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded overflow-hidden">
                    <div 
                      className={cn(
                        "w-full transition-all duration-100",
                        stem.meters.right > 0.8 ? "bg-red-500" : 
                        stem.meters.right > 0.6 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ height: `${stem.meters.right * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sends */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Sends</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8">Rev</span>
                    <Slider
                      value={[stem.sends.reverb]}
                      onValueChange={([value]) => onStemChange(stem.id, { 
                        sends: { ...stem.sends, reverb: value }
                      })}
                      className="flex-1"
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-8">Del</span>
                    <Slider
                      value={[stem.sends.delay]}
                      onValueChange={([value]) => onStemChange(stem.id, { 
                        sends: { ...stem.sends, delay: value }
                      })}
                      className="flex-1"
                      min={0}
                      max={1}
                      step={0.01}
                    />
                  </div>
                </div>
              </div>

              {/* Mute/Solo */}
              <div className="flex gap-2">
                <Button
                  variant={stem.muted ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => onStemChange(stem.id, { muted: !stem.muted })}
                  className="flex-1 text-xs"
                >
                  M
                </Button>
                <Button
                  variant={stem.soloed ? "default" : "outline"}
                  size="sm"
                  onClick={() => onStemChange(stem.id, { soloed: !stem.soloed })}
                  className="flex-1 text-xs"
                >
                  S
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Master Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Master
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Master Level */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Master Level</span>
                <span>{Math.round(masterLevel * 100)}%</span>
              </div>
              <div className="relative h-40 bg-gray-100 rounded-lg">
                <Slider
                  orientation="vertical"
                  value={[masterLevel]}
                  onValueChange={([value]) => {
                    setMasterLevel(value);
                    onMasterChange({ level: value, pan: masterPan });
                  }}
                  className="h-full"
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>
            </div>

            {/* Master Meters */}
            <div className="space-y-2">
              <div className="text-sm">Master Meters</div>
              <div className="flex gap-2 h-40">
                <div className="flex-1 bg-gray-200 rounded overflow-hidden">
                  <div className="w-full h-1/2 bg-green-500" />
                </div>
                <div className="flex-1 bg-gray-200 rounded overflow-hidden">
                  <div className="w-full h-1/2 bg-green-500" />
                </div>
              </div>
              <div className="text-xs text-gray-600">
                LUFS: -14.2 | Peak: -1.5 dB
              </div>
            </div>

            {/* Render Controls */}
            <div className="space-y-4">
              <div className="text-sm">Render</div>
              <Button onClick={onRender} className="w-full">
                Render Mix
              </Button>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="include-stems" defaultChecked />
                  <label htmlFor="include-stems" className="text-sm">Include Stems</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="include-midi" defaultChecked />
                  <label htmlFor="include-midi" className="text-sm">Include MIDI</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="include-charts" />
                  <label htmlFor="include-charts" className="text-sm">Include Charts</label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
