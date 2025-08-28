'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Share2, 
  FileAudio, 
  FileText, 
  FileCode, 
  Archive,
  CheckCircle,
  AlertCircle,
  Settings,
  Copy,
  ExternalLink
} from 'lucide-react';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  formats: string[];
  defaultFormat: string;
}

interface ExportWizardProps {
  projectId: string;
  onExport: (options: ExportOptions) => void;
  onCancel: () => void;
}

interface ExportOptions {
  types: string[];
  audioFormat: string;
  includeRights: boolean;
  includeProvenance: boolean;
  createShareLink: boolean;
  customName?: string;
}

const exportOptions: ExportOption[] = [
  {
    id: 'stems',
    name: 'Individual Stems',
    description: 'Separate audio files for each instrument',
    icon: <FileAudio className="w-5 h-5" />,
    formats: ['WAV', 'FLAC', 'MP3'],
    defaultFormat: 'WAV',
  },
  {
    id: 'mix',
    name: 'Master Mix',
    description: 'Final mixed and mastered audio',
    icon: <FileAudio className="w-5 h-5" />,
    formats: ['WAV', 'FLAC', 'MP3'],
    defaultFormat: 'WAV',
  },
  {
    id: 'midi',
    name: 'MIDI Files',
    description: 'MIDI data for each instrument part',
    icon: <FileCode className="w-5 h-5" />,
    formats: ['MIDI'],
    defaultFormat: 'MIDI',
  },
  {
    id: 'charts',
    name: 'Chord Charts',
    description: 'PDF chord charts with Nashville/roman numerals',
    icon: <FileText className="w-5 h-5" />,
    formats: ['PDF'],
    defaultFormat: 'PDF',
  },
  {
    id: 'lyrics',
    name: 'Lyric Sheets',
    description: 'Formatted lyric sheets with chords',
    icon: <FileText className="w-5 h-5" />,
    formats: ['PDF'],
    defaultFormat: 'PDF',
  },
  {
    id: 'bundle',
    name: 'Project Bundle',
    description: 'Complete project with all files and metadata',
    icon: <Archive className="w-5 h-5" />,
    formats: ['ZIP'],
    defaultFormat: 'ZIP',
  },
];

export function ExportWizard({ projectId, onExport, onCancel }: ExportWizardProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mix', 'stems']);
  const [audioFormat, setAudioFormat] = useState('WAV');
  const [includeRights, setIncludeRights] = useState(true);
  const [includeProvenance, setIncludeProvenance] = useState(true);
  const [createShareLink, setCreateShareLink] = useState(false);
  const [customName, setCustomName] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'completed' | 'error'>('idle');
  const [shareLink, setShareLink] = useState('');

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleExport = async () => {
    if (selectedTypes.length === 0) {
      alert('Please select at least one export type');
      return;
    }

    setExportStatus('exporting');

    const options: ExportOptions = {
      types: selectedTypes,
      audioFormat,
      includeRights,
      includeProvenance,
      createShareLink,
      customName: customName || undefined,
    };

    try {
      await onExport(options);
      setExportStatus('completed');
      
      if (createShareLink) {
        setShareLink(`https://example.com/share/${projectId}_${Date.now()}`);
      }
    } catch (error) {
      setExportStatus('error');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    // Could add a toast notification here
  };

  const getEstimatedSize = () => {
    let size = 0;
    selectedTypes.forEach(type => {
      switch (type) {
        case 'stems':
          size += 10; // 10 MB
          break;
        case 'mix':
          size += 5; // 5 MB
          break;
        case 'midi':
          size += 0.1; // 0.1 MB
          break;
        case 'charts':
          size += 0.05; // 0.05 MB
          break;
        case 'lyrics':
          size += 0.02; // 0.02 MB
          break;
        case 'bundle':
          size += 15; // 15 MB
          break;
      }
    });
    return size;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Project</h2>
          <p className="text-gray-600">Choose what to export and how</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Export Types */}
      <Card>
        <CardHeader>
          <CardTitle>What to Export</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportOptions.map((option) => (
              <div
                key={option.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTypes.includes(option.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleTypeToggle(option.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${
                    selectedTypes.includes(option.id) ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{option.name}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                  </div>
                  {selectedTypes.includes(option.id) && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Format */}
          <div>
            <label className="block text-sm font-medium mb-2">Audio Format</label>
            <div className="flex gap-2">
              {['WAV', 'FLAC', 'MP3'].map((format) => (
                <Button
                  key={format}
                  variant={audioFormat === format ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAudioFormat(format)}
                >
                  {format}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Custom Export Name (Optional)</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="My Song Export"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Metadata Options */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-rights"
                checked={includeRights}
                onChange={(e) => setIncludeRights(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="include-rights" className="text-sm">
                Include rights metadata (license, attribution)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="include-provenance"
                checked={includeProvenance}
                onChange={(e) => setIncludeProvenance(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="include-provenance" className="text-sm">
                Include provenance information (models used, generation details)
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="create-share-link"
                checked={createShareLink}
                onChange={(e) => setCreateShareLink(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="create-share-link" className="text-sm">
                Create share link for easy sharing
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Export Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Selected types:</span>
              <div className="flex gap-1">
                {selectedTypes.map(type => (
                  <Badge key={type} variant="secondary">
                    {exportOptions.find(opt => opt.id === type)?.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span>Audio format:</span>
              <span className="font-medium">{audioFormat}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated size:</span>
              <span className="font-medium">{getEstimatedSize().toFixed(1)} MB</span>
            </div>
            <div className="flex justify-between">
              <span>Metadata included:</span>
              <span className="font-medium">
                {includeRights && includeProvenance ? 'Rights + Provenance' :
                 includeRights ? 'Rights only' :
                 includeProvenance ? 'Provenance only' : 'None'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleExport}
          disabled={selectedTypes.length === 0 || exportStatus === 'exporting'}
          className="min-w-[120px]"
        >
          {exportStatus === 'exporting' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </div>

      {/* Export Results */}
      {exportStatus === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Export Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Download Files</h4>
                <div className="space-y-2">
                  {selectedTypes.map(type => {
                    const option = exportOptions.find(opt => opt.id === type);
                    return (
                      <div key={type} className="flex items-center gap-2">
                        {option?.icon}
                        <span className="text-sm">{option?.name}</span>
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {createShareLink && shareLink && (
                <div className="space-y-2">
                  <h4 className="font-medium">Share Link</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={copyShareLink}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(shareLink, '_blank')}>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {exportStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              Export Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">There was an error creating your export. Please try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
