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
  Menu,
  Activity,
  Search
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

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "VPP Config", icon: Settings2, href: "/vpp" },
  { name: "Forecasting", icon: Zap, href: "/forecast" },
  { name: "Grid Assistant", icon: Bot, href: "/assistant" },
  { name: "History", icon: History, href: "/history" },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-border bg-card">
          <SidebarHeader className="p-4 flex flex-row items-center gap-2 border-b border-border">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center glow-primary">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-headline font-bold text-lg tracking-tight">
              AuraGrid<span className="text-accent">Sentinel</span>
            </span>
          </SidebarHeader>
          <SidebarContent className="p-2 pt-4">
            <div className="px-2 mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search metrics..." className="pl-8 bg-background/50 border-none h-9 text-xs" />
              </div>
            </div>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Grid Status: STABLE</span>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-px bg-border hidden md:block" />
              <h1 className="text-lg font-headline font-semibold hidden md:block capitalize">
                {pathname === "/" ? "Grid State Dashboard" : pathname.slice(1).replace("-", " ")}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10">
                <ShieldAlert className="h-4 w-4 text-accent" />
                <span>2 Active Anomalies</span>
              </Button>
              <div className="h-8 w-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
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