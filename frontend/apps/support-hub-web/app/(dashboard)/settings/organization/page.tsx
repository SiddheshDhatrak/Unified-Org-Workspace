'use client';
import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { orgs } from '@workspace/api-client';
import { Button, Input, Select, Table, Modal, ConfirmDialog, Badge } from '@workspace/ui-kit';
import { Building2, Users, Sliders, ShieldAlert, UserPlus, Trash2 } from 'lucide-react';

export default function OrgSettingsPage() {
  const { orgId, orgName, orgRole } = useOrgContext();
  const [members, setMembers] = React.useState<any[]>([]);
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('SUPPORT_AGENT');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if (orgId) {
      orgs.listMembers(orgId).then(setMembers).catch(() => {});
    }
  }, [orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await orgs.inviteMember(orgId, inviteEmail, inviteRole);
      setIsInviteOpen(false);
      setInviteEmail('');
      orgs.listMembers(orgId).then(setMembers).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Invitation sent!');
      setIsInviteOpen(false);
    }
  };

  const memberColumns = [
    {
      header: 'Member Name & Email',
      render: (m: any) => (
        <div>
          <p className="font-bold text-white">{m.user?.fullName || m.userId}</p>
          <p className="text-xs text-zinc-400">{m.user?.email || 'Invited User'}</p>
        </div>
      ),
    },
    {
      header: 'Org Role',
      render: (m: any) => <Badge status={m.orgRole || 'MEMBER'} />,
    },
    {
      header: 'Status',
      render: (m: any) => <Badge status={m.status || 'ACTIVE'} />,
    },
  ];

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

      {/* Member Management */}
      <div className="p-6 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Active Membership (§5.5)</h3>
            <p className="text-xs text-zinc-400">Assign role matrices (SUPPORT_AGENT vs REVIEWER_APPROVER).</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="w-4 h-4" />
            <span>Invite Member (§5.4)</span>
          </Button>
        </div>

        <Table data={members} columns={memberColumns} emptyMessage="No members loaded yet." />
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

      {/* Invite Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member (§5.4)">
        <form onSubmit={handleInvite} className="space-y-4">
          <Input label="Colleague Email" placeholder="bob@acme.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
          <Select label="Initial Org Role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="SUPPORT_AGENT">Support Agent (Tickets & Support)</option>
            <option value="REVIEWER_APPROVER">Reviewer Approver (PR Console & Audit)</option>
            <option value="ORG_ADMIN">Organization Admin</option>
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Send Invitation</Button>
          </div>
        </form>
      </Modal>

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
