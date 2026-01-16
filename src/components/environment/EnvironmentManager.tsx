"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Settings, Save } from "lucide-react";
import api from "@/lib/api";
import KeyValueTable from "@/components/request/KeyValueTable";

interface EnvironmentManagerProps {
  onEnvChange: () => void; // Tell parent to reload
}

export default function EnvironmentManager({ onEnvChange }: EnvironmentManagerProps) {
  const [open, setOpen] = useState(false);
  const [envs, setEnvs] = useState<any[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<any>(null);
  const [vars, setVars] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) loadEnvs();
  }, [open]);

  const loadEnvs = async () => {
    try {
        const wsRes = await api.get("/workspaces/my-workspaces");
        if (wsRes.data.length > 0) {
            const res = await api.get(`/environments/workspace/${wsRes.data[0].id}`);
            setEnvs(res.data);
        }
    } catch(e) { console.error(e); }
  };

  const handleCreate = async () => {
    const wsRes = await api.get("/workspaces/my-workspaces");
    await api.post("/environments/create", {
        name: "New Environment",
        variables: "{}",
        workspaceId: wsRes.data[0].id
    });
    loadEnvs();
  };

  const handleSave = async () => {
    if (!selectedEnv) return;
    // NOTE: Ideally we use a PUT endpoint. For Phase 1, we assume specific update logic or re-create
    // You might need to add @PutMapping to your Backend EnvironmentController
    alert("Environment Saved locally (Implement PUT /api/environments/{id} in backend to persist!)");
    onEnvChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="border-b p-4 flex items-center justify-between bg-muted/10">
            <DialogTitle>Manage Environments</DialogTitle>
        </div>
        
        <div className="flex flex-1 h-full overflow-hidden">
            {/* Sidebar: List of Envs */}
            <div className="w-[250px] border-r bg-muted/5 p-2 flex flex-col gap-2">
                {envs.map(env => (
                    <div 
                        key={env.id}
                        className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${selectedEnv?.id === env.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                        onClick={() => {
                            setSelectedEnv(env);
                            setVars(env.variables ? JSON.parse(env.variables) : {});
                        }}
                    >
                        {env.name}
                    </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2 justify-start gap-2" onClick={handleCreate}>
                    <Plus className="h-3 w-3" /> Create New
                </Button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col p-6 gap-6 bg-background">
                {selectedEnv ? (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Environment Name</label>
                            <Input 
                                value={selectedEnv.name} 
                                onChange={e => setSelectedEnv({...selectedEnv, name: e.target.value})} 
                            />
                        </div>
                        <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                             <label className="text-xs font-semibold text-muted-foreground uppercase">Variables</label>
                            <div className="flex-1 overflow-y-auto border rounded-md">
                                <KeyValueTable initialData={vars} onChange={setVars} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSave} className="gap-2">
                                <Save className="h-4 w-4" /> Save Changes
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select an environment to edit variables
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}