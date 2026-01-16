"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { 
    Plus, Box, PlayCircle, ChevronRight, ChevronDown, 
    FolderPlus, MoreHorizontal, Pencil, Trash2, FileJson, Folder
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import CreateRequestDialog from "@/components/request/CreateRequestDialog";
import CreateCollectionDialog from "@/components/collection/CreateCollectionDialog";
import RenameCollectionDialog from "@/components/collection/RenameCollectionDialog"; 
import RequestEditor from "@/components/request/RequestEditor";

// --- Types ---
interface RequestItem {
  id: number;
  name: string;
  method: string;
}

interface Collection {
  id: number;
  name: string;
  isOpen?: boolean;
  requests?: RequestItem[];
}

interface Workspace {
  id: number;
  name: string;
}

export default function RequestHubPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // Dialog States
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionToEdit, setCollectionToEdit] = useState<{id: number, name: string} | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const wsRes = await api.get("/workspaces/my-workspaces");
      if (wsRes.data.length > 0) {
        
        const savedWsId = localStorage.getItem("activeWorkspaceId");
        let activeWs = wsRes.data[0];
        
        if (savedWsId) {
            const found = wsRes.data.find((w: any) => w.id.toString() === savedWsId);
            if (found) activeWs = found;
        }

        setWorkspace(activeWs);
        loadCollections(activeWs.id);
      }
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };

  const loadCollections = async (workspaceId: number) => {
    try {
        const colRes = await api.get(`/collections/workspace/${workspaceId}`);
        const cols = colRes.data;
        const colsWithRequests = await Promise.all(cols.map(async (col: Collection) => {
            try {
                const reqRes = await api.get(`/requests/collection/${col.id}`);
                return { ...col, requests: reqRes.data, isOpen: true }; 
            } catch (e) {
                return { ...col, requests: [] };
            }
        }));
        setCollections(colsWithRequests);
    } catch (e) {
        console.error("Failed to load collections", e);
        setCollections([]); 
    }
  };

  const toggleCollection = (id: number) => {
    setCollections(collections.map(col => 
        col.id === id ? { ...col, isOpen: !col.isOpen } : col
    ));
  };

  // --- ACTIONS ---

  const handleCreateRequest = (colId: number) => {
    setSelectedCollectionId(colId);
    setIsRequestDialogOpen(true);
  };

  const handleRenameCollection = (col: Collection) => {
    setCollectionToEdit({ id: col.id, name: col.name });
    setIsRenameDialogOpen(true);
  };

  const handleDeleteCollection = async (id: number) => {
    if(!confirm("Are you sure? This will delete all requests inside this collection.")) return;
    try {
        await api.delete(`/collections/${id}`);
        fetchData(); 
    } catch(e) {
        alert("Failed to delete collection");
    }
  };

  const getMethodColor = (method: string) => {
    switch(method) {
        case "GET": return "text-emerald-500 font-bold";
        case "POST": return "text-blue-500 font-bold";
        case "PUT": return "text-orange-500 font-bold";
        case "DELETE": return "text-red-500 font-bold";
        default: return "text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex divide-x divide-border bg-background">
      
      {/* 🟢 LEFT SIDEBAR */}
      <div className="w-[300px] flex flex-col bg-muted/5 h-full">
        
        {/* Sidebar Header */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-background/50 backdrop-blur sticky top-0 z-10">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Workspace</span>
                <span className="text-sm font-semibold truncate max-w-[180px]" title={workspace?.name}>
                    {workspace?.name || "Loading..."}
                </span>
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                onClick={() => setIsCollectionDialogOpen(true)} 
                title="Create New Collection"
            >
                <Plus className="h-4 w-4" />
            </Button>
        </div>

        {/* Tree View Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {collections.map((col) => (
                <div key={col.id} className="select-none">
                    
                    {/* Collection Row */}
                    <div 
                        className="group flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md hover:bg-muted/60 cursor-pointer transition-all relative text-foreground/80 hover:text-foreground"
                        onClick={() => toggleCollection(col.id)}
                    >
                        <span className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                            {col.isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </span>
                        
                        <Folder className={`h-4 w-4 transition-colors ${col.isOpen ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        
                        <span className="truncate flex-1">{col.name}</span>
                        
                        {/* Hover Actions */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 absolute right-2 bg-background/80 rounded-md backdrop-blur-sm shadow-sm border border-border/40">
                            <Button 
                                variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted"
                                onClick={(e) => { e.stopPropagation(); handleCreateRequest(col.id); }}
                                title="Add Request"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted"
                                        onClick={(e) => e.stopPropagation()} 
                                    >
                                        <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateRequest(col.id); }}>
                                        <Plus className="h-3.5 w-3.5 mr-2 opacity-70" /> Add Request
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleRenameCollection(col); }}>
                                        <Pencil className="h-3.5 w-3.5 mr-2 opacity-70" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2 opacity-70" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Requests List */}
                    {col.isOpen && (
                        <div className="relative">
                            {/* Indentation Line */}
                            <div className="absolute left-[13px] top-0 bottom-0 w-[1px] bg-border/40"></div>
                            
                            <div className="ml-2 space-y-[1px] pt-1">
                               {col.requests?.map((req) => (
    <div 
        key={req.id} 
        onClick={() => setSelectedRequestId(req.id)}
        className={`group/req flex items-center gap-3 pl-6 pr-2 py-1.5 text-sm rounded-r-sm cursor-pointer transition-all duration-200 ease-in-out relative border-l-[3px] ${
            selectedRequestId === req.id 
                ? "border-primary bg-primary/5 text-primary font-medium" 
                : "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        }`}
    >
        {/* Monospace Method for precise alignment */}
        <span className={`text-[10px] w-8 text-right shrink-0 font-mono font-bold tracking-tight ${getMethodColor(req.method)}`}>
            {req.method}
        </span>
        <span className="truncate flex-1 group-hover/req:translate-x-0.5 transition-transform duration-200">
            {req.name}
        </span>
    </div>
))}
                                {col.requests?.length === 0 && (
                                    <div className="pl-6 py-2 text-xs text-muted-foreground/50 italic flex items-center gap-2">
                                        <div className="h-[1px] w-3 bg-border/40"></div>
                                        No requests yet
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ))}
            
            {/* Empty State */}
            {collections.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 mt-10">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <FolderPlus className="h-6 w-6 text-muted-foreground/60" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-medium">No Collections</h3>
                        <p className="text-xs text-muted-foreground max-w-[150px]">Create a collection to start organizing requests.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsCollectionDialogOpen(true)} className="mt-2">
                        Create Collection
                    </Button>
                </div>
            )}
        </div>
      </div>
      
      {/* 🟢 RIGHT MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
         {selectedRequestId ? (
            <RequestEditor requestId={selectedRequestId} />
         ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-xl shadow-primary/5">
                    <PlayCircle className="h-10 w-10 text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold tracking-tight mb-2">Ready to Build?</h2>
                <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
                    Select a request from the sidebar to start testing your APIs, or create a new one to get going.
                </p>
                <div className="flex gap-4">
                     {collections.length > 0 && (
                        <Button variant="outline" onClick={() => handleCreateRequest(collections[0].id)}>
                            <Plus className="h-4 w-4 mr-2" /> New Request
                        </Button>
                     )}
                </div>
            </div>
         )}
      </div>

      {/* RENDER DIALOGS */}
      <CreateRequestDialog 
        open={isRequestDialogOpen} 
        onOpenChange={setIsRequestDialogOpen}
        workspaceId={workspace?.id || 0}
        collectionId={selectedCollectionId}
        onSuccess={() => fetchData()} 
      />

      <CreateCollectionDialog 
        open={isCollectionDialogOpen} 
        onOpenChange={setIsCollectionDialogOpen}
        workspaceId={workspace?.id || 0}
        onSuccess={() => fetchData()} 
      />

      <RenameCollectionDialog 
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        collection={collectionToEdit}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}