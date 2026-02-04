'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#000000',
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Helper to convert hex to HSV for the selectors
  const hexToHsv = (hex: string) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, v: v * 100 };
  };

  const hsvToHex = (h: number, s: number, v: number) => {
    h /= 360;
    s /= 100;
    v /= 100;

    let r = 0,
      g = 0,
      b = 0;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const [hsv, setHsv] = React.useState(() => hexToHsv(value));

  React.useEffect(() => {
    setHsv(hexToHsv(value));
  }, [value]);

  const handleHueChange = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent,
    container?: HTMLElement,
  ) => {
    const rect = (
      container || (e.currentTarget as Element)
    ).getBoundingClientRect();
    const x =
      'touches' in e
        ? (e as unknown as React.TouchEvent).touches[0].clientX
        : (e as React.MouseEvent | MouseEvent).clientX;
    const hue = Math.min(Math.max(0, (x - rect.left) / rect.width), 1) * 360;
    const newHex = hsvToHex(hue, hsv.s, hsv.v);
    onChange(newHex);
  };

  const handleSvChange = (
    e: React.MouseEvent | React.TouchEvent | MouseEvent,
    container?: HTMLElement,
  ) => {
    const rect = (
      container || (e.currentTarget as Element)
    ).getBoundingClientRect();
    const x =
      'touches' in e
        ? (e as unknown as React.TouchEvent).touches[0].clientX
        : (e as React.MouseEvent | MouseEvent).clientX;
    const y =
      'touches' in e
        ? (e as unknown as React.TouchEvent).touches[0].clientY
        : (e as React.MouseEvent | MouseEvent).clientY;

    const s = Math.min(Math.max(0, (x - rect.left) / rect.width), 1) * 100;
    const v = Math.min(Math.max(0, 1 - (y - rect.top) / rect.height), 1) * 100;

    const newHex = hsvToHex(hsv.h, s, v);
    onChange(newHex);
  };

  // Drag interaction state
  const [isDraggingSv, setIsDraggingSv] = React.useState(false);
  const [isDraggingHue, setIsDraggingHue] = React.useState(false);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSv) {
        const el = document.getElementById('sv-picker');
        if (el) handleSvChange(e, el);
      }
      if (isDraggingHue) {
        const el = document.getElementById('hue-picker');
        if (el) handleHueChange(e, el);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSv(false);
      setIsDraggingHue(false);
    };

    if (isDraggingSv || isDraggingHue) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSv, isDraggingHue, hsv]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[64px] h-10 p-1 flex items-center justify-between',
            className,
          )}
        >
          <div
            className="w-full h-full rounded-md border border-black/10"
            style={{ backgroundColor: value }}
          />
          <ChevronDown className="h-3 w-3 opacity-50 ml-1 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-4" align="start">
        {/* Saturation/Value Area */}
        <div
          id="sv-picker"
          className="relative w-full h-32 rounded-lg cursor-crosshair overflow-hidden"
          style={{ backgroundColor: hsvToHex(hsv.h, 100, 100) }}
          onMouseDown={(e) => {
            setIsDraggingSv(true);
            handleSvChange(e);
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          <div
            className="absolute w-4 h-4 -ml-2 -mt-2 border-2 border-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.2)]"
            style={{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
            }}
          />
        </div>

        {/* Hue Slider */}
        <div
          id="hue-picker"
          className="relative w-full h-4 rounded-full cursor-pointer overflow-visible"
          style={{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }}
          onMouseDown={(e) => {
            setIsDraggingHue(true);
            handleHueChange(e);
          }}
        >
          <div
            className="absolute w-4 h-4 -top-0 -ml-2 border-2 border-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.2)] bg-transparent pointer-events-none"
            style={{ left: `${(hsv.h / 360) * 100}%` }}
          />
        </div>

        {/* Hex Input and Presets */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Hex
            </span>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  'w-full aspect-square rounded-md border border-black/10 transition-transform hover:scale-110',
                  value.toLowerCase() === color.toLowerCase() &&
                    'ring-2 ring-primary ring-offset-1',
                )}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                }}
              >
                {value.toLowerCase() === color.toLowerCase() && (
                  <Check className="h-3 w-3 mx-auto text-white drop-shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
