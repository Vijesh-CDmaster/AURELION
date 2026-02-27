"use client"

import { useEffect } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGridStore } from "@/lib/grid-store"

export default function EventLogPage() {
  const { alerts, initializeSystemData } = useGridStore()

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Event Log & Audit Trail</h2>
            <p className="text-muted-foreground text-sm">Comprehensive record of all system events, interventions, and stability anomalies.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" suppressHydrationWarning>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs by keyword, ID, or zone..." className="pl-8 h-10 text-xs bg-muted/20 border-border" suppressHydrationWarning />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4" suppressHydrationWarning>
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4" suppressHydrationWarning>
              <Filter className="h-4 w-4" />
              Severity
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Audit Trail Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Type</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Event Description</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id} className="border-border hover:bg-muted/30 group">
                    <TableCell className="text-xs font-mono">{alert.time}</TableCell>
                    <TableCell className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{alert.type}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-[8px] h-4 ${
                          alert.severity === 'critical' || alert.severity === 'attack' ? 'border-red-500/30 text-red-400 bg-red-500/10' : 
                          alert.severity === 'warning' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 
                          'border-blue-500/30 text-blue-400 bg-blue-500/10'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-md">{alert.message}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${alert.status === 'resolved' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                        <span className="text-[10px] font-bold uppercase">{alert.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-accent h-7 text-[10px] uppercase font-bold hover:bg-accent/10" suppressHydrationWarning>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}