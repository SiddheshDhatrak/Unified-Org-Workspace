'use client';
import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { orgs } from '@workspace/api-client';
import { Button, Input, Select, Table, Modal, Badge } from '@workspace/ui-kit';
import { Users, UserPlus } from 'lucide-react';

export default function MembersSettingsPage() {
  const { orgId } = useOrgContext();
  const [members, setMembers] = React.useState<any[]>([]);
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState('SUPPORT_AGENT');

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
          <Users className="w-6 h-6 text-indigo-400" />
          <span>Members Administration (§5.5)</span>
        </h1>
        <p className="text-xs text-zinc-400">Manage tenancy membership, invitations, and roles.</p>
      </div>

      <div className="p-6 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Active Membership</h3>
            <p className="text-xs text-zinc-400">Assign role matrices (SUPPORT_AGENT vs REVIEWER_APPROVER).</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="w-4 h-4" />
            <span>Invite Member (§5.4)</span>
          </Button>
        </div>

        <Table data={members} columns={memberColumns} emptyMessage="No members loaded yet." />
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
    </div>
  );
}
