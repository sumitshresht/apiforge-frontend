"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: { id: number; name: string } | null;
  onSuccess: () => void;
}

export default function RenameCollectionDialog({ open, onOpenChange, collection, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (collection) setName(collection.name);
  }, [collection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !collection) return;

    setLoading(true);
    try {
      await api.put(`/collections/${collection.id}`, { name });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      alert("Failed to rename collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Rename Collection
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>New Name</Label>
            <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !name}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}