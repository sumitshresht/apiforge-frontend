"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, ShieldCheck, Lock } from "lucide-react";

export interface AuthConfig {
  type: "none" | "bearer" | "basic";
  token?: string;
  username?: string;
  password?: string;
}

interface Props {
  config: AuthConfig;
  onChange: (config: AuthConfig) => void;
}

export default function AuthEditor({ config, onChange }: Props) {
  const handleChange = (key: keyof AuthConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="w-[150px]">
          <Label className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 block">Auth Type</Label>
          <Select value={config.type} onValueChange={(val: any) => onChange({ ...config, type: val })}>
            <SelectTrigger className="h-9 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Auth</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 pt-5">
           <p className="text-xs text-muted-foreground">Select an authorization method for this request.</p>
        </div>
      </div>

      <div className="flex-1">
        {config.type === "none" && (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 gap-3 min-h-[200px]">
            <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm font-medium text-foreground/60">This request is public</p>
            <p className="text-xs text-center max-w-[250px]">No authorization header will be sent. Select a type above to add credentials.</p>
          </div>
        )}

        {config.type === "bearer" && (
          <div className="space-y-4 max-w-xl animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Token</Label>
              <Input 
                placeholder="e.g. eyJhbGciOiJIUzI1Ni..." 
                value={config.token || ""} 
                onChange={(e) => handleChange("token", e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground">The token will be added to the Authorization header.</p>
            </div>
          </div>
        )}

        {config.type === "basic" && (
          <div className="grid grid-cols-2 gap-6 max-w-xl animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Username</Label>
              <Input 
                placeholder="admin" 
                value={config.username || ""} 
                onChange={(e) => handleChange("username", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Password</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={config.password || ""} 
                onChange={(e) => handleChange("password", e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}