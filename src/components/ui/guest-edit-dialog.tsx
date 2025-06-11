import React, { useState, useEffect } from "react";
import { Guest } from "@/lib/firestore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TableSelector } from "@/components/ui/table-selector";
import { User, Phone, Mail, FileText, Save, X } from "lucide-react";

interface Table {
  id: string;
  name: string;
  color: string;
  capacity: number;
  guests?: Array<{ id: string; name: string }>;
}

interface GuestEditDialogProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (guestId: string, updates: Partial<Guest>) => Promise<void>;
  tables?: Table[];
}

export function GuestEditDialog({
  guest,
  open,
  onOpenChange,
  onSave,
  tables = [],
}: GuestEditDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when guest changes
  useEffect(() => {
    if (guest) {
      setFirstName(guest.firstName || "");
      setLastName(guest.lastName || "");
      setPhoneNumber(guest.phoneNumber || "");
      setEmail(guest.email || "");
      setNotes(guest.notes || "");
      setSelectedTableId(guest.tableId || null);
      setErrors({});
    }
  }, [guest]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // At least one name is required
    if (!firstName.trim() && !lastName.trim()) {
      newErrors.name = "At least first name or last name is required";
    }

    // Validate email format if provided
    if (email.trim() && !email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!guest || !validateForm()) return;

    setIsSaving(true);
    try {
      const updates: Partial<Guest> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        tableId: selectedTableId || undefined,
      };

      // Update the legacy name field for backward compatibility
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (fullName) {
        updates.name = fullName;
      }

      await onSave(guest.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save guest:", error);
      setErrors({ general: "Failed to save changes. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold text-gray-900">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Edit Guest Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="firstName"
                className="text-sm font-medium text-gray-700"
              >
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={errors.name ? "border-red-500" : ""}
              />
            </div>
            <div>
              <Label
                htmlFor="lastName"
                className="text-sm font-medium text-gray-700"
              >
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={errors.name ? "border-red-500" : ""}
              />
            </div>
          </div>
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}

          {/* Phone Number */}
          <div>
            <Label
              htmlFor="phoneNumber"
              className="text-sm font-medium text-gray-700 flex items-center"
            >
              <Phone className="w-4 h-4 mr-1" />
              Phone Number
            </Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              type="tel"
            />
          </div>

          {/* Email */}
          <div>
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700 flex items-center"
            >
              <Mail className="w-4 h-4 mr-1" />
              Email Address
            </Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              type="email"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label
              htmlFor="notes"
              className="text-sm font-medium text-gray-700 flex items-center"
            >
              <FileText className="w-4 h-4 mr-1" />
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Table Assignment */}
          {tables && tables.length > 0 && (
            <TableSelector
              tables={tables}
              selectedTableId={selectedTableId}
              onTableSelect={setSelectedTableId}
              placeholder="Select a table (optional)..."
            />
          )}

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
