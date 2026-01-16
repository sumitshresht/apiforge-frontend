"use client";

import { 
  FolderGit2, Globe, Server, FileText, Clock, Settings, Plus 
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const sections = [
  {
    label: "CORE",
    items: [
      { name: "Request Hub", icon: FolderGit2, href: "/dashboard/request-hub" },
      { name: "Mock Server", icon: Server, href: "/dashboard/mock-server" },
    ]
  },
  {
    label: "DATA",
    items: [
      { name: "Environments", icon: Globe, href: "/dashboard/environments" },
      { name: "Logs", icon: FileText, href: "/dashboard/logs" },
      { name: "History", icon: Clock, href: "/dashboard/history" },
    ]
  },
  {
    label: "SYSTEM",
    items: [
      { name: "Settings", icon: Settings, href: "/dashboard/settings" },
    ]
  }
];

export default function SideBar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-background/95 backdrop-blur h-full flex flex-col shrink-0">
      
      {/* Primary Action Area */}
      <div className="p-4 pb-2">
        <Button 
          className="w-full justify-start gap-2 shadow-sm h-9 font-medium transition-transform active:scale-[0.98]" 
          size="sm"
        >
            <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-8">
        {sections.map((section) => (
          <div key={section.label}>
            {/* Section Header */}
            <h4 className="mb-2 px-2 text-[11px] font-bold text-muted-foreground/60 tracking-wider uppercase select-none">
              {section.label}
            </h4>
            
            {/* Nav Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200 ease-in-out relative overflow-hidden",
                      isActive 
                        ? "bg-primary/10 text-primary font-semibold" 
                        : "text-muted-foreground font-medium hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {/* Active State Accent Border */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                    )}
                    
                    <item.icon className={cn(
                      "h-4 w-4 transition-colors duration-200", 
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t bg-muted/5 text-[11px] text-muted-foreground flex justify-between items-center select-none">
        <span className="font-medium opacity-70">v1.0.0</span>
        <div className="flex items-center gap-1.5 opacity-70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]"></span>
            <span>Online</span>
        </div>
      </div>
    </aside>
  );
}