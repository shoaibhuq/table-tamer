"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Edit3, Palette, Users, Save, X } from "lucide-react";

interface Table {
  id: string;
  name: string;
  color: string;
  capacity: number;
  guests?: Array<{ id: string; name: string }>;
}

interface TableEditDialogProps {
  table: Table;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    tableId: string,
    updates: { name?: string; color?: string; capacity?: number }
  ) => Promise<void>;
}

const PRESET_COLORS = [
  { color: "#3B82F6", name: "Blue" },
  { color: "#EF4444", name: "Red" },
  { color: "#10B981", name: "Emerald" },
  { color: "#F59E0B", name: "Amber" },
  { color: "#8B5CF6", name: "Purple" },
  { color: "#EC4899", name: "Pink" },
  { color: "#06B6D4", name: "Cyan" },
  { color: "#84CC16", name: "Lime" },
  { color: "#F97316", name: "Orange" },
  { color: "#6366F1", name: "Indigo" },
  { color: "#14B8A6", name: "Teal" },
  { color: "#A855F7", name: "Violet" },
];

export function TableEditDialog({
  table,
  isOpen,
  onClose,
  onSave,
}: TableEditDialogProps) {
  const [name, setName] = useState(table.name);
  const [color, setColor] = useState(table.color);
  const [capacity, setCapacity] = useState(table.capacity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Table name is required");
      return;
    }

    if (capacity < 1) {
      setError("Capacity must be at least 1");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates: { name?: string; color?: string; capacity?: number } = {};

      if (name.trim() !== table.name) {
        updates.name = name.trim();
      }

      if (color !== table.color) {
        updates.color = color;
      }

      if (capacity !== table.capacity) {
        updates.capacity = capacity;
      }

      if (Object.keys(updates).length > 0) {
        await onSave(table.id, updates);
      }

      onClose();
    } catch (error) {
      console.error("Error saving table:", error);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form to original values
    setName(table.name);
    setColor(table.color);
    setCapacity(table.capacity);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Table
          </DialogTitle>
          <DialogDescription>
            Customize your table settings including name, color, and capacity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Table Preview */}
          <div className="flex items-center justify-center">
            <div
              className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border-l-4"
              style={{ borderLeftColor: color }}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div>
                <span className="font-medium">{name || "Table Name"}</span>
                <div className="text-sm text-gray-500">
                  Capacity: {capacity}
                </div>
              </div>
              {table.guests && table.guests.length > 0 && (
                <Badge variant="secondary">{table.guests.length} guests</Badge>
              )}
            </div>
          </div>

          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="table-name" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Table Name
            </Label>
            <Input
              id="table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter table name"
              maxLength={30}
              disabled={loading}
            />
          </div>

          {/* Table Color */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Table Color
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.color}
                  onClick={() => setColor(preset.color)}
                  disabled={loading}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all hover:scale-110
                    ${
                      color === preset.color
                        ? "border-gray-900 shadow-lg"
                        : "border-gray-300"
                    }
                  `}
                  style={{ backgroundColor: preset.color }}
                  title={`Select ${preset.name}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-color" className="text-sm">
                Custom:
              </Label>
              <input
                id="custom-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                className="w-8 h-8 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-500">{color}</span>
            </div>
          </div>

          {/* Table Capacity */}
          <div className="space-y-2">
            <Label htmlFor="table-capacity" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Seating Capacity
            </Label>
            <Input
              id="table-capacity"
              type="number"
              value={capacity}
              onChange={(e) =>
                setCapacity(Math.max(1, parseInt(e.target.value) || 1))
              }
              min={1}
              max={20}
              disabled={loading}
            />
            <p className="text-sm text-gray-500">
              Maximum number of guests that can be seated at this table
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </Dialog>
  );
}
