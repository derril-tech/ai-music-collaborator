'use client';

import React, { useState } from 'react';
import { Mixer } from '@/components/mixer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Volume2, 
  Download, 
  Settings, 
  Play, 
  Pause,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Mock stem data
const mockStems = [
  {
    id: '1',
    name: 'Vocals',
    role: 'vocals',
    level: 0.8,
    pan: 0,
    muted: false,
    soloed: false,
    sends: { reverb: 0.3, delay: 0.1, compression: 0.5 },
    meters: { left: 0.6, right: 0.6, peak: 0.7 }
  },
  {
    id: '2',
    name: 'Guitar',
    role: 'guitar',
    level: 0.7,
    pan: -0.2,
    muted: false,
    soloed: false,
    sends: { reverb: 0.4, delay: 0.2, compression: 0.3 },
    meters: { left: 0.5, right: 0.4, peak: 0.6 }
  },
  {
    id: '3',
    name: 'Bass',
    role: 'bass',
    level: 0.9,
    pan: 0,
    muted: false,
    soloed: false,
    sends: { reverb: 0.1, delay: 0, compression: 0.7 },
    meters: { left: 0.7, right: 0.7, peak: 0.8 }
  },
  {
    id: '4',
    name: 'Drums',
    role: 'drums',
    level: 0.8,
    pan: 0,
    muted: false,
    soloed: false,
    sends: { reverb: 0.2, delay: 0.1, compression: 0.6 },
    meters: { left: 0.8, right: 0.8, peak: 0.9 }
  },
  {
    id: '5',
    name: 'Keys',
    role: 'piano',
    level: 0.6,
    pan: 0.3,
    muted: false,
    soloed: false,
    sends: { reverb: 0.5, delay: 0.3, compression: 0.2 },
    meters: { left: 0.4, right: 0.5, peak: 0.5 }
  },
  {
    id: '6',
    name: 'Strings',
    role: 'strings',
    level: 0.5,
    pan: 0.1,
    muted: false,
    soloed: false,
    sends: { reverb: 0.6, delay: 0.2, compression: 0.1 },
    meters: { left: 0.3, right: 0.4, peak: 0.4 }
  }
];

export default function RenderPage() {
  const [stems, setStems] = useState(mockStems);
  const [renderStatus, setRenderStatus] = useState<'idle' | 'rendering' | 'completed' | 'error'>('idle');
  const [renderProgress, setRenderProgress] = useState(0);

  const handleStemChange = (stemId: string, changes: any) => {
    setStems(prev => prev.map(stem => 
      stem.id === stemId ? { ...stem, ...changes } : stem
    ));
  };

  const handleMasterChange = (changes: { level: number; pan: number }) => {
    console.log('Master changes:', changes);
  };

  const handleRender = async () => {
    setRenderStatus('rendering');
    setRenderProgress(0);

    // Simulate rendering process
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setRenderStatus('completed');
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mix & Master</h1>
          <p className="text-gray-600">Fine-tune your mix and render the final audio</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={renderStatus === 'completed' ? 'default' : 'secondary'}>
            {renderStatus === 'completed' ? (
              <CheckCircle className="w-4 h-4 mr-1" />
            ) : renderStatus === 'error' ? (
              <AlertCircle className="w-4 h-4 mr-1" />
            ) : (
              <Volume2 className="w-4 h-4 mr-1" />
            )}
            {renderStatus.charAt(0).toUpperCase() + renderStatus.slice(1)}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Render Progress */}
      {renderStatus === 'rendering' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Rendering Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Processing audio...</span>
                <span>{renderProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600">
                Estimated time remaining: {Math.max(0, Math.ceil((100 - renderProgress) / 10))} seconds
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render Results */}
      {renderStatus === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Render Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Master Mix</div>
                <div className="text-xs text-gray-600">LUFS: -14.2 | Peak: -1.5 dB</div>
                <Button size="sm" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download WAV
                </Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Individual Stems</div>
                <div className="text-xs text-gray-600">6 stems available</div>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Project Bundle</div>
                <div className="text-xs text-gray-600">Includes MIDI, charts, presets</div>
                <Button size="sm" variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Bundle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mixer */}
      <Mixer 
        stems={stems}
        onStemChange={handleStemChange}
        onMasterChange={handleMasterChange}
        onRender={handleRender}
      />

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">-14.2</div>
              <div className="text-sm text-gray-600">LUFS (Target: -14.0)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">-1.5</div>
              <div className="text-sm text-gray-600">True Peak dB</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">12.7</div>
              <div className="text-sm text-gray-600">Dynamic Range</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-sm text-gray-600">No Clipping</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
