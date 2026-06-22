import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { sb } from "@/lib/sb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/")({
  head: () => ({ meta: [{ title: "الرسائل | منصة الأصول" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const { data } = useQuery(queryOptions({
    queryKey: ["messages-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: msgs }, { data: profs }] = await Promise.all([
        sb("messages").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("profiles").select("id, full_name"),
      ]);
      return { msgs: msgs ?? [], profs: profs ?? [] };
    },
  }));

  const profName = (id: string) => (data?.profs ?? []).find((p: any) => p.id === id)?.full_name ?? id.slice(0, 8);

  async function send() {
    if (!recipient || !body) return toast.error("اختر مستلماً واكتب رسالة");
    setSending(true);
    const { error } = await sb("messages").insert({ sender_id: user!.id, recipient_id: recipient, subject, body });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("تم إرسال الرسالة");
    setSubject(""); setBody("");
    qc.invalidateQueries({ queryKey: ["messages-list"] });
  }

  async function markRead(id: string) {
    await sb("messages").update({ read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["messages-list"] });
  }

  return (
    <DashboardLayout title="الرسائل الداخلية" icon={<div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><MessageSquare className="h-6 w-6" /></div>}>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 lg:col-span-1">
          <h3 className="text-sm font-extrabold">رسالة جديدة</h3>
          <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={recipient} onChange={(e) => setRecipient(e.target.value)}>
            <option value="">— اختر المستلم —</option>
            {(data?.profs ?? []).filter((p: any) => p.id !== user?.id).map((p: any) => (
              <option key={p.id} value={p.id}>{p.full_name ?? p.id.slice(0, 8)}</option>
            ))}
          </select>
          <Input placeholder="الموضوع" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Textarea placeholder="نص الرسالة" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          <Button onClick={send} disabled={sending} className="w-full"><Send className="h-4 w-4 ml-2" />{sending ? "..." : "إرسال"}</Button>
        </div>
        <div className="rounded-2xl border border-border bg-card lg:col-span-2 overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-sm font-extrabold">صندوق الرسائل</div>
          <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
            {(data?.msgs ?? []).map((m: any) => {
              const incoming = m.recipient_id === user?.id;
              return (
                <div key={m.id} className={`p-4 ${incoming && !m.read ? "bg-primary/5" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold">{incoming ? `من: ${profName(m.sender_id)}` : `إلى: ${profName(m.recipient_id)}`}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleString("ar")}</div>
                  </div>
                  {m.subject && <div className="mt-1 text-sm font-semibold">{m.subject}</div>}
                  <p className="mt-1 text-sm text-foreground/85 whitespace-pre-wrap">{m.body}</p>
                  {incoming && !m.read && (
                    <button onClick={() => markRead(m.id)} className="mt-2 text-xs font-bold text-primary hover:underline">تعليم كمقروء</button>
                  )}
                </div>
              );
            })}
            {(data?.msgs ?? []).length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">لا توجد رسائل</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
