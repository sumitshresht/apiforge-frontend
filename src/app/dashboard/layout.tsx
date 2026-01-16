import SideBar from "@/components/layout/SideBar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* 1. Top Bar */}
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 2. Sidebar */}
        <SideBar />
        
        {/* 3. Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-0">
            {children}
        </main>
      </div>
    </div>
  );
}