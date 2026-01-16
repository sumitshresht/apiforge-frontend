"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  collectionId: number | null;
  onSuccess: () => void;
}

export default function CreateRequestDialog({ 
  open, 
  onOpenChange, 
  workspaceId, 
  collectionId, 
  onSuccess 
}: CreateRequestDialogProps) {
  const [name, setName] = useState("");
  const [method, setMethod] = useState("GET");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionId) {
        alert("Please select a collection first!");
        return;
    }
    
    setLoading(true);
    try {
      await api.post("/requests/create", {
        name,
        method,
        url: "", // Empty initially
        workspaceId,
        collectionId
      });
      setName("");
      onOpenChange(false);
      onSuccess(); // Trigger refresh in parent
    } catch (error) {
      console.error("Failed to create request", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Request Name</Label>
            <Input 
              placeholder="e.g. Fetch Users" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                    <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}