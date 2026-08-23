import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, Volume2, Package } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { startScanner, stopScanner, acquireScannerToken } from '@/services/barcode/scanner';
import { BARCODE_FORMAT_LABELS } from '@/services/barcode/types';
import type { ScanResult } from '@/services/barcode/types';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: ScanResult) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({
  open,
  onOpenChange,
  onScan,
  title = 'Scan Barcode',
  description = 'Point your camera at a barcode or QR code to scan',
}: BarcodeScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const scannerElementId = 'barcode-scanner-reader';
  const audioContextRef = useRef<AudioContext | null>(null);
  const tokenRef = useRef<number>(0);

  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio may not be available
    }
  }, []);

  const handleScanResult = useCallback(
    (result: ScanResult) => {
      playBeep();
      setLastResult(result);
      setScanning(false);
      stopScanner().catch(() => {});
      // Brief delay before invoking callback so user sees result
      setTimeout(() => {
        onScan(result);
      }, 1000);
    },
    [onScan, playBeep]
  );

  const initScanner = useCallback(async () => {
    setError(null);
    setLastResult(null);
    const token = acquireScannerToken();
    tokenRef.current = token;
    try {
      await startScanner(scannerElementId, handleScanResult, undefined, token);
      // Only update state if this mount is still the current owner
      if (tokenRef.current === token) {
        setScanning(true);
      }
    } catch (err) {
      if (tokenRef.current === token) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to start camera. Please ensure camera permissions are granted.'
        );
        setScanning(false);
      }
    }
  }, [handleScanResult]);

  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM element is rendered
      const timer = setTimeout(() => {
        initScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner().catch(() => {});
      setScanning(false);
      setLastResult(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner().catch(() => {});
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-[24px] border-t border-border bg-background/95 backdrop-blur-xl p-0"
      >
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-primary" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col items-center px-6 pb-6 space-y-4">
          {/* Scanner viewfinder */}
          <div className="relative w-full max-w-sm aspect-square rounded-[16px] overflow-hidden bg-black/80 border border-white/10">
            <div id={scannerElementId} className="w-full h-full" />

            {/* Scanning line animation */}
            {scanning && !lastResult && (
              <motion.div
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_8px_#10b981]"
                animate={{ top: ['15%', '85%', '15%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            {/* Corner brackets */}
            {scanning && !lastResult && (
              <>
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-emerald-500 rounded-br-lg" />
              </>
            )}

            {/* Dark overlay when not scanning */}
            {!scanning && !lastResult && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Camera className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Status messages */}
          {error && (
            <div className="w-full max-w-sm rounded-[12px] border border-red-500/30 bg-red-500/10 p-4 text-center">
              <p className="text-sm text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={initScanner}
              >
                Retry
              </Button>
            </div>
          )}

          {scanning && !lastResult && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Volume2 className="h-4 w-4 text-primary animate-pulse" />
              <span>Scanning... Hold steady</span>
            </div>
          )}

          {/* Scan result card */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm rounded-[16px] border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-300">Scan Successful</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Value</span>
                    <span className="text-sm font-mono text-foreground">{lastResult.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Format</span>
                    <Badge variant="default" className="text-xs">
                      {BARCODE_FORMAT_LABELS[lastResult.format]}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {lastResult && (
              <Button variant="outline" onClick={initScanner}>
                Scan Again
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              <X className="mr-2 h-4 w-4" /> Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
