"use client"

import { useEffect, useState, useMemo } from "react"
import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useGridStore } from "@/lib/grid-store"
import { Smartphone, Zap, Battery, Car, Thermometer, Wifi, Search, Filter, Plus, Trash2, ToggleLeft, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DevicesPage() {
  const { devices, deviceMix, assetsReachable, onlineDevices, offlineDevices, controllableLoad, deviceLoadHistory, initializeSystemData } = useGridStore()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    initializeSystemData()
  }, [initializeSystemData])

  const filtered = useMemo(() => {
    return devices.filter(d => {
      const matchSearch = !search || d.id.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase())
      const matchType = typeFilter === 'all' || d.type.toLowerCase().includes(typeFilter.toLowerCase())
      return matchSearch && matchType
    })
  }, [devices, search, typeFilter])

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold text-foreground">Edge Asset Management</h2>
            <p className="text-muted-foreground text-sm">Real-time status and telemetry for individual IoT grid assets.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search device ID or type..." className="pl-8 h-9 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} suppressHydrationWarning />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[110px] h-9 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ev">EVs</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Device Mix</CardDescription>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><Car className="h-3 w-3 text-primary" /> EVs</div>
                <span className="font-bold">{deviceMix.evPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1"><div className="bg-primary h-full rounded-full" style={{ width: `${deviceMix.evPercent}%` }} /></div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><Thermometer className="h-3 w-3 text-accent" /> HVAC</div>
                <span className="font-bold">{deviceMix.hvacPercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1"><div className="bg-accent h-full rounded-full" style={{ width: `${deviceMix.hvacPercent}%` }} /></div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><Battery className="h-3 w-3 text-emerald-400" /> Storage</div>
                <span className="font-bold">{deviceMix.storagePercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1"><div className="bg-emerald-400 h-full rounded-full" style={{ width: `${deviceMix.storagePercent}%` }} /></div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Global Status</CardDescription>
              <Wifi className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-2">
              <div className="text-3xl font-headline font-black text-emerald-400">{assetsReachable.toFixed(1)}%</div>
              <div className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Assets Reachable</div>
              <div className="mt-3 flex gap-4">
                <div className="text-center">
                  <div className="text-xs font-bold">{onlineDevices.toLocaleString()}</div>
                  <div className="text-[8px] text-muted-foreground uppercase">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-red-400">{offlineDevices.toLocaleString()}</div>
                  <div className="text-[8px] text-muted-foreground uppercase">Offline</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Controllable Load</CardDescription>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-2">
              <div className="text-3xl font-headline font-black text-primary">{controllableLoad >= 0 ? '+' : ''}{controllableLoad.toFixed(1)}<span className="text-lg">MW</span></div>
              <div className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Aggregated Dispatch</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">Batch Controls</CardDescription>
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-[10px] h-7" suppressHydrationWarning>
                <Plus className="h-3 w-3" /> Simulate Add Device
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-[10px] h-7 border-red-500/20 text-red-400 hover:text-red-300" suppressHydrationWarning>
                <Trash2 className="h-3 w-3" /> Simulate Remove Device
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-[10px] h-7 border-amber-500/20 text-amber-400 hover:text-amber-300" suppressHydrationWarning>
                <Zap className="h-3 w-3" /> Force All Respond
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Load History Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Device Load Contribution History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deviceLoadHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} unit=" MW" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="ev" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="EV" />
                  <Line type="monotone" dataKey="hvac" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="HVAC" />
                  <Line type="monotone" dataKey="storage" stroke="#34d399" strokeWidth={2} dot={false} name="Storage" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest">Edge Asset Directory</CardTitle>
            <Badge variant="outline" className="text-[8px]">{filtered.length} of {devices.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Asset ID</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Type</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Cluster</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Cur. Load</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Latency</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((device) => (
                    <TableRow key={device.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-mono text-xs font-bold">{device.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          {device.type.includes('EV') ? <Car className="h-3 w-3" /> : device.type.includes('HVAC') ? <Thermometer className="h-3 w-3" /> : <Battery className="h-3 w-3" />}
                          {device.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[8px] h-4 ${device.status === 'online' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : device.status === 'responding' ? 'border-primary/30 text-primary bg-primary/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                          {device.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{device.cluster}</TableCell>
                      <TableCell className={`text-xs font-bold ${device.load.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{device.load}</TableCell>
                      <TableCell className="text-xs font-mono">{device.latency}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-accent h-7 text-[10px] uppercase font-bold" suppressHydrationWarning>Inspect</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}