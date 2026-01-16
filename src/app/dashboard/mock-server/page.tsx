"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Server, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";

export default function MockServerListPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Create Form State
  const [newName, setNewName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get Active Workspace ID
    const wId = localStorage.getItem("activeWorkspaceId");
    if (wId) {
        setWorkspaceId(wId);
        loadServers(wId);
    } else {
        setLoading(false); // No workspace selected
    }
  }, []);

  const loadServers = async (wId: string) => {
    try {
      const res = await api.get(`/mocks/servers/workspace/${wId}`);
      setServers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName || !workspaceId) return;

    setCreateLoading(true);
    try {
      // 2. Send workspaceId in the payload
      await api.post("/mocks/servers/create", {
        name: newName,
        workspaceId: parseInt(workspaceId) // <--- CRITICAL FIX
      });
      setNewName("");
      setOpen(false);
      loadServers(workspaceId);
    } catch (e) {
      alert("Failed to create server");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this server?")) return;
    await api.delete(`/mocks/servers/${id}`);
    if (workspaceId) loadServers(workspaceId);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Server className="h-6 w-6 text-muted-foreground" /> Mock Servers
            </h1>
            <p className="text-muted-foreground">Create virtual APIs to test your frontend.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!workspaceId}>
            <Plus className="h-4 w-4 mr-2" /> Create Server
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
            <Card key={server.id} className="hover:border-primary/50 transition-all group relative">
                <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-start">
                        <span>{server.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(server.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-xs font-mono bg-muted p-2 rounded truncate text-muted-foreground">
                        /api/mock/simulator/{server.pathPrefix}
                    </div>
                    <Link href={`/dashboard/mock-server/${server.id}`}>
                        <Button variant="outline" className="w-full gap-2">
                            <ExternalLink className="h-3 w-3" /> Manage Routes
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        ))}
        
        {servers.length === 0 && !loading && (
            <div className="col-span-full text-center py-10 text-muted-foreground opacity-50 border-2 border-dashed rounded-xl">
                No mock servers in this workspace. Create one to get started.
            </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Mock Server</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Server Name</Label>
                    <Input 
                        placeholder="e.g. Payment Service" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createLoading || !newName}>
                    {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}