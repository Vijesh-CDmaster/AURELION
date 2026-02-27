"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Filter, Search, X, CheckCircle2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useGridStore } from "@/lib/grid-store"
import { toast } from "@/hooks/use-toast"

export default function EventLogPage() {
  const { alerts, resolveAlert, initializeSystemData } = useGridStore()
  const [search, setSearch] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAlert, setSelectedAlert] = useState<typeof alerts[0] | null>(null)

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      const matchSearch = !search || a.message.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()) || a.type.toLowerCase().includes(search.toLowerCase())
      const matchSeverity = severityFilter === 'all' || a.severity === severityFilter
      const matchStatus = statusFilter === 'all' || a.status === statusFilter
      return matchSearch && matchSeverity && matchStatus
    })
  }, [alerts, search, severityFilter, statusFilter])

  const handleExportCSV = useCallback(() => {
    if (filtered.length === 0) { toast({ title: "No data", description: "No events to export." }); return }
    const header = "ID,Time,Type,Severity,Message,Status\n"
    const rows = filtered.map(a => `${a.id},${a.time},${a.type},${a.severity},"${a.message}",${a.status}`).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const el = document.createElement("a"); el.href = url; el.download = "event-log.csv"; el.click()
    URL.revokeObjectURL(url)
    toast({ title: "CSV Exported", description: `${filtered.length} events exported.` })
  }, [filtered])

  const handleResolve = (id: string) => {
    resolveAlert(id)
    toast({ title: "Event Resolved", description: `Alert ${id} marked as resolved.` })
  }

  const activeCount = alerts.filter(a => a.status === 'active').length
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'attack').length

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Event Log & Audit Trail</h2>
            <p className="text-muted-foreground text-sm">Comprehensive record of all system events, interventions, and stability anomalies.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[9px]">{alerts.length} total</Badge>
            {activeCount > 0 && <Badge className="bg-red-500/20 text-red-400 text-[9px]">{activeCount} active</Badge>}
            {criticalCount > 0 && <Badge className="bg-red-500/20 text-red-400 text-[9px]">{criticalCount} critical</Badge>}
            <Button variant="outline" size="sm" className="gap-2 h-9 text-xs" onClick={handleExportCSV} suppressHydrationWarning>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by keyword, ID, type, or zone..." className="pl-8 h-9 text-xs bg-muted/20 border-border" value={search} onChange={(e) => setSearch(e.target.value)} suppressHydrationWarning />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="attack">Attack</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          {(search || severityFilter !== 'all' || statusFilter !== 'all') && (
            <Button variant="ghost" size="sm" className="h-9 text-xs gap-1 text-muted-foreground" onClick={() => { setSearch(""); setSeverityFilter("all"); setStatusFilter("all") }} suppressHydrationWarning>
              <X className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Audit Trail Repository</CardTitle>
            <Badge variant="outline" className="text-[8px]">{filtered.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Timestamp</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Type</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Severity</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Event Description</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No events match your filters.</TableCell></TableRow>
                  ) : filtered.map((alert) => (
                    <TableRow key={alert.id} className="border-border hover:bg-muted/30 group">
                      <TableCell className="text-xs font-mono">{alert.time}</TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{alert.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[8px] h-4 ${alert.severity === 'critical' || alert.severity === 'attack' ? 'border-red-500/30 text-red-400 bg-red-500/10' : alert.severity === 'warning' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-blue-500/30 text-blue-400 bg-blue-500/10'}`}>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-accent h-7 text-[10px] uppercase font-bold hover:bg-accent/10" onClick={() => setSelectedAlert(alert)} suppressHydrationWarning>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          {alert.status === 'active' && (
                            <Button variant="ghost" size="sm" className="text-emerald-400 h-7 text-[10px] uppercase font-bold hover:bg-emerald-500/10" onClick={() => handleResolve(alert.id)} suppressHydrationWarning>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Event Detail Modal */}
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-widest">Event Detail</DialogTitle>
              <DialogDescription className="text-xs">Full audit record for this system event</DialogDescription>
            </DialogHeader>
            {selectedAlert && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">Event ID</div>
                    <div className="text-xs font-mono font-bold">{selectedAlert.id}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">Timestamp</div>
                    <div className="text-xs font-mono">{selectedAlert.time}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">Type</div>
                    <div className="text-xs font-bold uppercase">{selectedAlert.type}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">Severity</div>
                    <Badge variant="outline" className={`text-[8px] ${selectedAlert.severity === 'critical' || selectedAlert.severity === 'attack' ? 'border-red-500/30 text-red-400' : selectedAlert.severity === 'warning' ? 'border-amber-500/30 text-amber-400' : 'border-blue-500/30 text-blue-400'}`}>
                      {selectedAlert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border">
                  <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1">Description</div>
                  <div className="text-xs">{selectedAlert.message}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${selectedAlert.status === 'resolved' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="text-xs font-bold uppercase">{selectedAlert.status}</span>
                  </div>
                  {selectedAlert.status === 'active' && (
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-8 text-[10px] uppercase" onClick={() => { handleResolve(selectedAlert.id); setSelectedAlert(null) }} suppressHydrationWarning>
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  )
}