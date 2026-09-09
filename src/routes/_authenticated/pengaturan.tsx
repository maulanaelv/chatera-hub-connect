import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Loader2, Lock, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getChateraCredentialStatus } from "@/lib/chatera-credentials.functions";
import { createAdminUser, deleteAdminUser, listAppUsers } from "@/lib/auth.functions";
import { initialsOf, useAuth } from "@/lib/auth-context";

import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan | Purworejo chatbot Apps" },
      { name: "description", content: "Pengaturan integrasi Chatera, akun Owner/Admin, dan informasi aplikasi Purworejo chatbot Apps." },
      { property: "og:title", content: "Pengaturan | Purworejo chatbot Apps" },
      { property: "og:description", content: "Kelola integrasi, akun petugas, dan info aplikasi Purworejo chatbot Apps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PengaturanPage,
});

const WEBHOOK_URL =
  "https://project--8036df0d-241f-4111-9f81-c27d499588bd-dev.lovable.app/api/public/webhooks/chatera";

function CredentialBadge({ ok, loading }: { ok: boolean | undefined; loading: boolean }) {
  if (loading) return <Badge variant="secondary">Memeriksa…</Badge>;
  return ok ? (
    <Badge className="bg-green-600 text-white hover:bg-green-600">Tersimpan</Badge>
  ) : (
    <Badge variant="destructive">Belum diatur</Badge>
  );
}

function IntegrationCard() {
  const { data: status, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["chatera-credential-status"],
    queryFn: () => getChateraCredentialStatus(),
  });
  const [copied, setCopied] = useState(false);

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard tidak tersedia; abaikan
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrasi Chatera</CardTitle>
        <CardDescription>
          Kunci API dan secret webhook disimpan sebagai secret di server. Nilainya tidak pernah disimpan
          di database maupun ditampilkan di halaman ini.
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
          <p className="text-xs text-muted-foreground">
            Pasang URL ini di pengaturan webhook Chatera dengan event message.inbound.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          Periksa ulang status
        </Button>
      </CardContent>
    </Card>
  );
}

function UsersCard() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });

  const usersQuery = useQuery({
    queryKey: ["app-users"],
    queryFn: () => listAppUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (input: { fullName: string; email: string; password: string }) =>
      createAdminUser({ data: input }),
    onSuccess: async () => {
      toast.success("Akun Admin berhasil dibuat");
      setForm({ fullName: "", email: "", password: "" });
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["app-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteAdminUser({ data: { userId } }),
    onSuccess: async () => {
      toast.success("Akun Admin dihapus");
      await queryClient.invalidateQueries({ queryKey: ["app-users"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const users = usersQuery.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Owner & Admin</CardTitle>
          <CardDescription>Akun yang bisa masuk ke aplikasi ini</CardDescription>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Tambah Admin
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {usersQuery.isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Memuat daftar akun…</p>
        ) : usersQuery.error ? (
          <p className="p-4 text-sm text-destructive">{(usersQuery.error as Error).message}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="w-28">Role</TableHead>
                <TableHead className="w-20 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8 border border-border">
                        <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">
                          {initialsOf(account.full_name || account.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{account.full_name || "(tanpa nama)"}</p>
                        <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={account.role === "owner" ? "default" : "secondary"} className="capitalize">
                      {account.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {account.role === "admin" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Hapus ${account.full_name || account.email}`}
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(account.id)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Admin</DialogTitle>
            <DialogDescription>
              Akun dibuat langsung di sistem login. Berikan password sementara ini ke Admin dan minta
              menggantinya setelah masuk.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Nama</Label>
              <Input
                id="admin-name"
                value={form.fullName}
                onChange={(event) => setForm((f) => ({ ...f, fullName: event.target.value }))}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
                placeholder="nama@purworejokab.go.id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password sementara</Label>
              <Input
                id="admin-password"
                type="text"
                value={form.password}
                onChange={(event) => setForm((f) => ({ ...f, password: event.target.value }))}
                placeholder="Minimal 8 karakter"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PengaturanPage() {
  const { isOwner, loading } = useAuth();

  return (
    <AppShell title="Pengaturan" subtitle="Integrasi, akun petugas, dan informasi aplikasi">
      <div className="mx-auto max-w-4xl space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Memeriksa hak akses…</p>
        ) : isOwner ? (
          <>
            <IntegrationCard />
            <UsersCard />
          </>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-start gap-3">
              <Lock className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Hanya Owner yang bisa mengubah pengaturan ini</CardTitle>
                <CardDescription>
                  Integrasi Chatera (API Key & Webhook) serta pengelolaan akun Admin hanya tersedia untuk
                  Owner.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

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
    </AppShell>
  );
}
