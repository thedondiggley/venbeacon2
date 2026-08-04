"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, Section, useToast } from "@/components/ui";
import { useRouter } from "next/navigation";

export function AccountSection() {
  const { toast } = useToast();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast("Passwords don't match", "error"); return; }
    if (newPassword.length < 6) { toast("Password must be at least 6 characters", "error"); return; }
    setChangingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast("Password updated");
      setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update password", "error");
    } finally {
      setChangingPw(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") { toast("Type DELETE to confirm", "error"); return; }
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete account", "error");
      setDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      <Section title="Change password">
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="New password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" required />
          <Input label="Confirm password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Same password again" required />
          <Button type="submit" loading={changingPw} variant="secondary">Update password</Button>
        </form>
      </Section>

      <Section title="Danger zone">
        {!showDelete ? (
          <Button variant="danger" onClick={() => setShowDelete(true)}>
            Delete account
          </Button>
        ) : (
          <Card variant="default" style={{ border: "1px solid #FFCCCC" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--red)", marginBottom: 8 }}>This action is permanent</p>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 16, lineHeight: 1.6 }}>
              Deleting your account removes your profile, schedule, bookings, and all data. This cannot be undone.
            </p>
            <Input
              label='Type "DELETE" to confirm'
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              style={{ marginBottom: 12 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost" onClick={() => { setShowDelete(false); setDeleteConfirm(""); }}>Cancel</Button>
              <Button variant="danger" loading={deleting} onClick={handleDeleteAccount}>Delete my account</Button>
            </div>
          </Card>
        )}
      </Section>

    </div>
  );
}
