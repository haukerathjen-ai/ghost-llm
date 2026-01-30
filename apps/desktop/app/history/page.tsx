// Copyright (c) 2026 Ghost LLM by haukerathjen-ai
// Licensed under the GNU General Public License v3.0

'use client';

import { useState, useEffect } from 'react';
import { ghostAPI } from '@/lib/ghost-api';
import { TranscriptionRecord } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Copy, ChevronDown, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [history, setHistory] = useState<TranscriptionRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<TranscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all');
  const [showClearModal, setShowClearModal] = useState(false);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, selectedStrategy]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await ghostAPI.getHistory();
      // Sort by timestamp (newest first)
      const sortedData = data.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setHistory(sortedData);
    } catch (error) {
      toast.error('Fehler beim Laden der Historie');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    if (selectedStrategy === 'all') {
      setFilteredHistory(history);
    } else {
      setFilteredHistory(
        history.filter((record) => record.strategy === selectedStrategy)
      );
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Text kopiert!');
    } catch (error) {
      toast.error('Fehler beim Kopieren');
    }
  };

  const handleClearHistory = async () => {
    try {
      await ghostAPI.clearHistory();
      setHistory([]);
      setShowClearModal(false);
      toast.success('Historie gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen der Historie');
      console.error(error);
    }
  };

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('de-DE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const getUniqueStrategies = () => {
    const strategies = new Set(history.map((record) => record.strategy));
    return Array.from(strategies);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Lade Historie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transkriptions-Historie</h1>
            <p className="text-muted-foreground mt-1">
              {filteredHistory.length} Einträge
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter nach Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Strategien</SelectItem>
                {getUniqueStrategies().map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {strategy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="destructive"
              onClick={() => setShowClearModal(true)}
              disabled={history.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Historie löschen
            </Button>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Keine Historie vorhanden</h3>
              <p className="text-muted-foreground text-center max-w-md">
                {selectedStrategy === 'all'
                  ? 'Deine Transkriptionen werden hier angezeigt, sobald du die erste Aufnahme machst.'
                  : `Keine Transkriptionen mit der Strategy "${selectedStrategy}" gefunden.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {formatTimestamp(record.timestamp)}
                        </CardTitle>
                        <Badge variant="secondary">{record.strategy}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Original Text (Collapsible) */}
                  <Collapsible
                    open={openItems.has(record.id)}
                    onOpenChange={() => toggleItem(record.id)}
                  >
                    <div className="space-y-2">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            openItems.has(record.id) ? 'rotate-180' : ''
                          }`}
                        />
                        Original-Text
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="bg-muted p-4 rounded-lg text-sm relative">
                          <p className="whitespace-pre-wrap">{record.originalText}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => handleCopy(record.originalText)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>

                  {/* Enriched Text */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Enriched-Text</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(record.enrichedText)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieren
                      </Button>
                    </div>
                    <div className="bg-background border rounded-lg p-4 text-sm">
                      <p className="whitespace-pre-wrap">{record.enrichedText}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Clear History Confirmation Modal */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Historie löschen?</DialogTitle>
            <DialogDescription>
              Möchtest du wirklich die gesamte Historie löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearModal(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleClearHistory}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}