import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { getChateraCredentialStatus } from "@/lib/chatera-credentials.functions";

import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan | Purworejo Chatera Assistant" },
      { name: "description", content: "Pengaturan integrasi Chatera, daftar agent, dan informasi aplikasi Purworejo Chatera Assistant." },
      { property: "og:title", content: "Pengaturan | Purworejo Chatera Assistant" },
      { property: "og:description", content: "Kelola integrasi, agent, dan info aplikasi Purworejo Chatera Assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PengaturanPage,
});

const WEBHOOK_URL = "https://project--606262d1-7104-4cac-b190-d560feb63457-dev.lovable.app/api/public/webhooks/chatera";

type Agent = { name: string; initials: string; role: "Admin" | "Agent"; email: string; online: boolean };

const DUMMY_AGENTS: Agent[] = [
  { name: "Rani Wulandari", initials: "RW", role: "Admin", email: "rani.w@purworejokab.go.id", online: true },
  { name: "Bagus Prasetyo", initials: "BP", role: "Agent", email: "bagus.p@purworejokab.go.id", online: true },
  { name: "Sari Puspita", initials: "SP", role: "Agent", email: "sari.p@purworejokab.go.id", online: false },
  { name: "Dimas Aji", initials: "DA", role: "Agent", email: "dimas.a@purworejokab.go.id", online: false },
];

function PengaturanPage() {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(DUMMY_AGENTS);
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: "", email: "", role: "Agent" as Agent["role"] });

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia; abaikan
    }
  }

  function addAgent() {
    if (!agentForm.name.trim()) return;
    const initials = agentForm.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    setAgents((current) => [...current, { ...agentForm, name: agentForm.name.trim(), initials, online: false }]);
    setAgentForm({ name: "", email: "", role: "Agent" });
    setAgentOpen(false);
  }

  return (
    <AppShell title="Pengaturan" subtitle="Integrasi, tim agent, dan informasi aplikasi (tampilan data contoh, belum tersimpan)">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kredensial Chatera</CardTitle>
            <CardDescription>
              Kunci API dan secret webhook disimpan sebagai secret di server. Nilainya tidak pernah
              disimpan di database maupun ditampilkan di halaman ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">CHATERA_API_KEY</p>
                <p className="text-xs text-muted-foreground">Dipakai server untuk mengirim balasan WhatsApp.</p>
              </div>
              <CredentialBadge ok={status?.apiKeyConfigured} loading={isLoading} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">CHATERA_WEBHOOK_SECRET</p>
                <p className="text-xs text-muted-foreground">Dipakai server untuk memverifikasi pesan masuk.</p>
              </div>
              <CredentialBadge ok={status?.webhookSecretConfigured} loading={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL Webhook</Label>
              <div className="flex gap-2">
                <Input id="webhook-url" value={WEBHOOK_URL} readOnly className="font-mono text-xs sm:text-sm" />
                <Button type="button" variant="outline" size="icon" aria-label="Salin URL webhook" onClick={copyWebhook}>
                  {copied ? <Check className="text-green-600" /> : <Copy />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Pasang URL ini di pengaturan webhook Chatera dengan event message.inbound.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Periksa ulang status
            </Button>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Daftar Agent/Admin</CardTitle>
              <CardDescription>Tim yang menangani percakapan dari warga</CardDescription>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setAgentOpen(true)}>
              <Plus className="size-4" />
              Tambah Agent
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-28">Role</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.email || agent.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 border border-border">
                          <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">{agent.initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{agent.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{agent.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={agent.role === "Admin" ? "default" : "secondary"}>{agent.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 text-xs">
                        <span className={cn("size-2 rounded-full", agent.online ? "bg-green-500" : "bg-muted-foreground/40")} />
                        <span className={agent.online ? "font-medium text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                          {agent.online ? "Online" : "Offline"}
                        </span>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Info Aplikasi</CardTitle>
            <CardDescription>Identitas instansi dan jam layanan yang ditampilkan ke warga</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instansi">Nama Instansi</Label>
              <Input id="instansi" defaultValue="Pemerintah Kabupaten Purworejo" readOnly />
            </div>
            <div className="space-y-2">
              <Label>Logo Instansi</Label>
              <div className="flex h-28 items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                <Upload className="size-4" />
                Unggah logo (placeholder)
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="jam-buka">Jam Operasional Mulai</Label>
                <Input id="jam-buka" defaultValue="08:00" readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jam-tutup">Jam Operasional Selesai</Label>
                <Input id="jam-tutup" defaultValue="15:30" readOnly />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Agent</DialogTitle>
            <DialogDescription>Formulir contoh — data belum disimpan ke server.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Nama</Label>
              <Input id="agent-name" value={agentForm.name} onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-email">Email</Label>
              <Input id="agent-email" type="email" value={agentForm.email} onChange={(e) => setAgentForm((f) => ({ ...f, email: e.target.value }))} placeholder="nama@purworejokab.go.id" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={agentForm.role} onValueChange={(v) => setAgentForm((f) => ({ ...f, role: v as Agent["role"] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgentOpen(false)}>Batal</Button>
            <Button onClick={addAgent}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
