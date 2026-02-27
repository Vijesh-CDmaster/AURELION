import { Shell } from "@/components/layout/Shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HistoryPage() {
  const logs = [
    { id: "EVT-902", time: "2024-05-20 14:22:10", event: "Frequency Dip", severity: "Medium", status: "Resolved", vpp: "+240MW" },
    { id: "EVT-899", time: "2024-05-20 09:15:33", event: "Demand Spike", severity: "High", status: "Resolved", vpp: "+510MW" },
    { id: "EVT-885", time: "2024-05-19 18:44:02", event: "Cloud Shading", severity: "Low", status: "Mitigated", vpp: "+45MW" },
    { id: "EVT-872", time: "2024-05-19 11:02:15", event: "VPP Handshake Failure", severity: "Medium", status: "Resolved", vpp: "N/A" },
    { id: "EVT-850", time: "2024-05-18 22:12:44", event: "Grid Baseline Shift", severity: "Low", status: "Normal", vpp: "-12MW" },
  ]

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-2 text-foreground">Historical Logs</h2>
            <p className="text-muted-foreground">Browse past grid performance data, VPP actions, and autonomous response records.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Past 7 Days
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="gap-2 bg-primary text-white font-bold">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Event Analysis Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs uppercase font-bold text-muted-foreground">ID</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-muted-foreground">Event Type</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-muted-foreground">Severity</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-muted-foreground">VPP Support</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs uppercase font-bold text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{log.id}</TableCell>
                    <TableCell className="text-xs">{log.time}</TableCell>
                    <TableCell className="text-sm font-semibold">{log.event}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          log.severity === 'High' ? 'border-red-500/50 text-red-400 bg-red-500/10' : 
                          log.severity === 'Medium' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 
                          'border-blue-500/50 text-blue-400 bg-blue-500/10'
                        }
                      >
                        {log.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-primary">{log.vpp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs">{log.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-accent hover:text-accent hover:bg-accent/10">View Details</Button>
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