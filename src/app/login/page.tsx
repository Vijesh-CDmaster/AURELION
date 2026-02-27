"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Zap, ShieldCheck, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col items-center justify-center p-6">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center glow-primary mb-6">
          <Zap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-headline font-black tracking-tight text-foreground mb-2">
          GridEntropy<span className="text-accent">Sentinel</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Securing the next generation of decentralized power grids with MARL-driven stability and adversarial defense.
        </p>
      </div>

      <Card className="w-full max-w-md bg-card border-border shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline font-bold">System Access</CardTitle>
          <CardDescription>Enter your credentials to access the Sentinel console.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs font-bold uppercase text-muted-foreground">Operator ID</Label>
            <Input id="username" placeholder="OP-42-SENTINEL" className="bg-muted/20 border-border h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pass" className="text-xs font-bold uppercase text-muted-foreground">Encrypted Token</Label>
            <Input id="pass" type="password" placeholder="••••••••" className="bg-muted/20 border-border h-10" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Access Level</Label>
            <Select defaultValue="operator">
              <SelectTrigger className="bg-muted/20 border-border h-10">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">System Administrator</SelectItem>
                <SelectItem value="operator">Grid Operator</SelectItem>
                <SelectItem value="viewer">Security Auditor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 uppercase tracking-widest text-xs">
            <Link href="/">Initialize Session</Link>
          </Button>
          <div className="text-[10px] text-center text-muted-foreground italic px-6">
            Access to this system is restricted to authorized personnel. All actions are logged under the GridEntropy Security Protocol.
          </div>
        </CardFooter>
      </Card>

      <div className="mt-12 flex gap-8">
        <div className="flex items-center gap-2 text-muted-foreground opacity-50">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Adversarial Defense v2.4</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground opacity-50">
          <Activity className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">MARL Sync v1.8</span>
        </div>
      </div>
    </div>
  )
}
