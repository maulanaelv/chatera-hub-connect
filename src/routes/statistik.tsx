import { createFileRoute } from "@tanstack/react-router";
import { Clock, MessagesSquare, TrendingUp, UserRound } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/statistik")({
  head: () => ({
    meta: [
      { title: "Statistik Layanan | Purworejo Chatera Assistant" },
      { name: "description", content: "Ringkasan percakapan, tren pesan masuk, distribusi kategori pertanyaan, dan kinerja agent layanan Kabupaten Purworejo." },
      { property: "og:title", content: "Statistik Layanan | Purworejo Chatera Assistant" },
      { property: "og:description", content: "Dashboard statistik percakapan dan kinerja agent Purworejo Chatera Assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatistikPage,
});

const DAILY_MESSAGES = [
  { day: "Sen", pesan: 42 },
  { day: "Sel", pesan: 57 },
  { day: "Rab", pesan: 38 },
  { day: "Kam", pesan: 64 },
  { day: "Jum", pesan: 71 },
  { day: "Sab", pesan: 29 },
  { day: "Min", pesan: 33 },
];

const CATEGORY_DIST = [
  { name: "PORJO", value: 96, color: "#2563eb" },
  { name: "RSUD & Puskesmas", value: 64, color: "#0d9488" },
  { name: "Disdukcapil", value: 52, color: "#d97706" },
  { name: "DPMPTSP", value: 38, color: "#7c3aed" },
  { name: "BPPKAD", value: 21, color: "#db2777" },
  { name: "CCTV", value: 14, color: "#65a30d" },
  { name: "Umum", value: 49, color: "#64748b" },
];

const ACTIVE_AGENTS = [
  { name: "Rani Wulandari", initials: "RW", chats: 34, avgResponse: "2 mnt 10 dtk" },
  { name: "Bagus Prasetyo", initials: "BP", chats: 27, avgResponse: "3 mnt 45 dtk" },
  { name: "Sari Puspita", initials: "SP", chats: 19, avgResponse: "4 mnt 02 dtk" },
  { name: "Dimas Aji", initials: "DA", chats: 11, avgResponse: "5 mnt 18 dtk" },
];

const WAITING_AGENT = 3;

function StatistikPage() {
  const summary = useMemo(
    () => [
      { label: "Total Percakapan Hari Ini", value: "33", icon: MessagesSquare, hint: "+12% dari kemarin" },
      { label: "Percakapan Minggu Ini", value: "214", icon: TrendingUp, hint: "+8% dari minggu lalu" },
      {
        label: "Menunggu Agent",
        value: String(WAITING_AGENT),
        icon: UserRound,
        hint: WAITING_AGENT > 0 ? "Perlu tindak lanjut" : "Semua tertangani",
        alert: WAITING_AGENT > 0,
      },
      { label: "Rata-rata Waktu Respon Agent", value: "3 mnt 21 dtk", icon: Clock, hint: "Target di bawah 5 menit" },
    ],
    [],
  );

  return (
    <AppShell title="Statistik" subtitle="Ringkasan aktivitas layanan 7 hari terakhir (data contoh)">
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(({ label, value, icon: Icon, hint, alert }) => (
            <Card key={label} className={cn(alert && "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20")}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardDescription className="text-xs font-medium uppercase">{label}</CardDescription>
                <Icon className={cn("size-4 shrink-0", alert ? "text-amber-600" : "text-muted-foreground")} />
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-bold", alert && "text-amber-700 dark:text-amber-400")}>{value}</p>
                <p className={cn("mt-1 text-xs", alert ? "text-amber-600" : "text-muted-foreground")}>{hint}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Pesan Masuk per Hari</CardTitle>
              <CardDescription>7 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={DAILY_MESSAGES} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip formatter={(v) => [`${v} pesan`, "Pesan masuk"]} />
                  <Line type="monotone" dataKey="pesan" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Kategori Pertanyaan Terbanyak</CardTitle>
              <CardDescription>Distribusi 7 hari terakhir</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CATEGORY_DIST} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="70%" paddingAngle={2}>
                    {CATEGORY_DIST.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} pertanyaan`, name]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Teraktif</CardTitle>
            <CardDescription>Berdasarkan jumlah chat yang ditangani minggu ini</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="w-40">Chat Ditangani</TableHead>
                  <TableHead className="w-48">Rata-rata Respon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ACTIVE_AGENTS.map((agent, index) => (
                  <TableRow key={agent.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 border border-border">
                          <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">{agent.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{agent.name}</span>
                        {index === 0 ? <Badge className="ml-1">Paling aktif</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{agent.chats}</TableCell>
                    <TableCell className="text-muted-foreground">{agent.avgResponse}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
