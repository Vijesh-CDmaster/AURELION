"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Settings2, 
  Zap, 
  History, 
  ShieldAlert, 
  Bot, 
  Activity,
  Search,
  Users,
  CloudSun,
  ShieldCheck,
  Server,
  Smartphone,
  PlayCircle,
  BarChart3,
  LogOut,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { useGridStore } from "@/lib/grid-store"

const navItems = [
  { group: "Monitoring", items: [
    { name: "Dashboard", icon: LayoutDashboard, href: "/" },
    { name: "Frequency Monitor", icon: Activity, href: "/frequency" },
    { name: "Solar Forecast", icon: CloudSun, href: "/forecast" },
  ]},
  { group: "Control", items: [
    { name: "MARL Agents", icon: Users, href: "/agents" },
    { name: "VPP Clusters", icon: Server, href: "/vpp" },
    { name: "Edge Assets", icon: Smartphone, href: "/devices" },
  ]},
  { group: "Intelligence", items: [
    { name: "Adversarial Defense", icon: ShieldCheck, href: "/defense" },
    { name: "Grid Assistant", icon: Bot, href: "/assistant" },
    { name: "Simulations", icon: PlayCircle, href: "/simulation" },
  ]},
  { group: "System", items: [
    { name: "Analytics", icon: BarChart3, href: "/analytics" },
    { name: "Event Logs", icon: History, href: "/history" },
    { name: "Configuration", icon: Settings2, href: "/config" },
  ]}
]

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { status, attackStatus, isLoggedIn, userName, userRole, logout } = useGridStore()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-4 flex flex-row items-center gap-2 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-headline font-bold text-lg tracking-tight">
              AuraGrid <span className="text-accent">Sentinel</span>
            </span>
          </SidebarHeader>
          <SidebarContent className="p-2 pt-4">
            <div className="px-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search modules..." className="pl-8 bg-background/50 border-none h-9 text-xs" />
              </div>
            </div>
            {navItems.map((group) => (
              <div key={group.group} className="mb-4">
                <div className="px-4 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{group.group}</div>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium text-xs">{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            ))}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full animate-pulse ${status === 'stable' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{status}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border hidden md:block" />
              <h1 className="text-sm font-headline font-bold hidden md:block uppercase tracking-wider">
                {pathname === "/" ? "Grid Overview" : pathname.slice(1).replace("-", " ")}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {attackStatus !== 'none' && (
                <Link href="/defense">
                  <Button variant="destructive" size="sm" className="gap-2 h-8 text-[10px] font-bold uppercase animate-pulse">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Attack Detected</span>
                  </Button>
                </Link>
              )}
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <div className="text-[10px] font-bold">{userName}</div>
                    <div className="text-[8px] text-muted-foreground uppercase">{userRole}</div>
                  </div>
                  <Link href="/login">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => logout()}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href="/login">
                  <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                </Link>
              )}
            </div>
          </header>
          <div className="p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
