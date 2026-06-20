"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AccountSection() {
  const router = useRouter();
  const supabase = createClient();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match.");
      return;
    }

    setPasswordSaving(true);

    // Re-authenticate with current password first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setPasswordError("Unable to verify account."); setPasswordSaving(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError("Current password is incorrect.");
      setPasswordSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSaved(true);
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete account.");
      }
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div>
      <h2 className="text-base font-medium mb-4">Account</h2>

      <div className="space-y-4">
        {/* Change password */}
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--brand-line)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--brand-charcoal-soft)" }}>
                Change your account password
              </p>
            </div>
            <button onClick={() => { setShowChangePassword(!showChangePassword); setPasswordError(null); setPasswordSaved(false); }}
              className="text-sm underline"
              style={{ color: "var(--brand-green-dark)" }}>
              {showChangePassword ? "Cancel" : "Change"}
            </button>
          </div>

          {showChangePassword && (
            <form onSubmit={handleChangePassword} className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: "var(--brand-line)" }}>
              <div>
                <label className="block text-xs font-medium mb-1">Current password</label>
                <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--brand-line)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">New password</label>
                <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--brand-line)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Confirm new password</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: "var(--brand-line)" }} />
              </div>
              {passwordError && <p className="text-xs" style={{ color: "#A32D2D" }}>{passwordError}</p>}
              {passwordSaved && <p className="text-xs" style={{ color: "var(--brand-green-dark)" }}>Password updated.</p>}
              <button type="submit" disabled={passwordSaving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{ background: "var(--brand-green)" }}>
                {passwordSaving ? "Saving..." : "Update password"}
              </button>
            </form>
          )}
        </div>

        {/* Help & Support */}
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--brand-line)" }}>
          <p className="text-sm font-medium mb-1">Help & Support</p>
          <p className="text-xs mb-2" style={{ color: "var(--brand-charcoal-soft)" }}>
            Questions, bugs, or billing issues?
          </p>
          <div className="flex gap-3">
            <a href="/contact" className="text-sm underline" style={{ color: "var(--brand-green-dark)" }}>
              Contact support
            </a>
            <span style={{ color: "var(--brand-line)" }}>·</span>
            <a href="mailto:support@vendorbeacon.app" className="text-sm underline" style={{ color: "var(--brand-green-dark)" }}>
              support@vendorbeacon.app
            </a>
          </div>
        </div>

        {/* Legal */}
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--brand-line)" }}>
          <p className="text-sm font-medium mb-2">Legal</p>
          <div className="flex gap-4 flex-wrap">
            <a href="/terms" className="text-sm underline" style={{ color: "var(--brand-charcoal-soft)" }}>Terms of Service</a>
            <a href="/privacy" className="text-sm underline" style={{ color: "var(--brand-charcoal-soft)" }}>Privacy Policy</a>
            <a href="/refund" className="text-sm underline" style={{ color: "var(--brand-charcoal-soft)" }}>Refund Policy</a>
            <a href="/guidelines" className="text-sm underline" style={{ color: "var(--brand-charcoal-soft)" }}>Community Guidelines</a>
          </div>
        </div>

        {/* Delete account */}
        <div className="rounded-lg border p-4" style={{ borderColor: "#FCA5A5" }}>
          <p className="text-sm font-medium mb-1" style={{ color: "#991B1B" }}>Delete account</p>
          <p className="text-xs mb-3" style={{ color: "var(--brand-charcoal-soft)" }}>
            Permanently delete your account and all data. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="text-sm underline" style={{ color: "#A32D2D" }}>
              Delete my account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-medium" style={{ color: "#A32D2D" }}>
                Type DELETE to confirm permanent account deletion:
              </p>
              <input type="text" value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#FCA5A5" }} />
              {deleteError && <p className="text-xs" style={{ color: "#A32D2D" }}>{deleteError}</p>}
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} disabled={deleting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "#A32D2D" }}>
                  {deleting ? "Deleting..." : "Delete permanently"}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); setDeleteError(null); }}
                  className="rounded-lg px-4 py-2 text-sm border"
                  style={{ borderColor: "var(--brand-line)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
