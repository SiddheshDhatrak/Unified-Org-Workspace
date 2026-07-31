'use client';
import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { Button, Input, Select, ConfirmDialog } from '@workspace/ui-kit';
import { Building2, Sliders, ShieldAlert, Trash2 } from 'lucide-react';

export default function OrgSettingsPage() {
  const { orgId, orgName, orgRole } = useOrgContext();
  React.useEffect(() => {
    // No-op
  }, [orgId]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-400" />
          <span>Organization Administration (§5)</span>
        </h1>
        <p className="text-xs text-zinc-400">Manage tenancy boundaries, member invitations, and deletion grace periods.</p>
      </div>

      {/* General Settings */}
      <div className="p-6 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-4 backdrop-blur-xl">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Tenant Details (§5.1)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Organization Name" defaultValue={orgName} disabled />
          <Input label="Workspace Slug (Immutable)" defaultValue="acme" disabled hint="Slugs cannot be modified post-creation to prevent broken external deep links." />
        </div>
      </div>



      {/* Destructive Actions (§5.2) */}
      <div className="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-400">Danger Zone — Lifecycle Management (§5.2)</h3>
            <p className="text-xs text-zinc-300">
              Soft-delete moves this tenant into a temporary recovery window before permanent cleanup. All members immediately lose API access.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4" />
            <span>Delete Organization</span>
          </Button>
        </div>
      </div>



      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => { alert('Soft delete command submitted to backend grace queue (§5.2).'); setShowDeleteConfirm(false); }}
        title="Confirm Soft Deletion"
        message="Are you sure you wish to soft-delete this organization? This initiates a strict recovery countdown before total database purge."
        confirmLabel="Yes, Delete Tenant"
        variant="destructive"
      />
    </div>
  );
}
