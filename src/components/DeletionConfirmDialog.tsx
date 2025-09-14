import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface DeletionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName: string;
  onConfirm: (deletedByName: string, reason?: string) => void;
  isLoading?: boolean;
}

export function DeletionConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  onConfirm,
  isLoading = false,
}: DeletionConfirmDialogProps) {
  const [deletedByName, setDeletedByName] = useState("");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const expectedConfirmText = `DELETE ${itemName}`;
  const canConfirm = 
    deletedByName.trim().length > 0 && 
    confirmText === expectedConfirmText;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(deletedByName.trim(), reason.trim() || undefined);
      handleReset();
    }
  };

  const handleReset = () => {
    setDeletedByName("");
    setReason("");
    setConfirmText("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>{description}</p>
            <p className="text-sm font-medium text-destructive">
              This action cannot be undone and will be logged for audit purposes.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deletedBy" className="text-sm font-medium">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deletedBy"
              placeholder="Enter your full name"
              value={deletedByName}
              onChange={(e) => setDeletedByName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Reason for Deletion (Optional)
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why this item is being deleted..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmText" className="text-sm font-medium">
              Type <code className="bg-muted px-1 py-0.5 rounded text-xs">{expectedConfirmText}</code> to confirm <span className="text-destructive">*</span>
            </Label>
            <Input
              id="confirmText"
              placeholder={expectedConfirmText}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Forever"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}