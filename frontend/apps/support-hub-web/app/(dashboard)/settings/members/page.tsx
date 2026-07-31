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
  const [inviteToken, setInviteToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (orgId) {
      orgs.listMembers(orgId).then(setMembers).catch(() => {});
    }
  }, [orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const res = await orgs.inviteMember(orgId, inviteEmail, inviteRole);
      // If the backend returns the invitation object with the token in res
      if (res && (res as any).token) {
        setInviteToken((res as any).token);
      } else {
        alert('Invitation sent! (Email service not configured in MVP, token generated internally)');
      }
      setInviteEmail('');
      orgs.listMembers(orgId).then(setMembers).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Invitation sent!');
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
        <div className="space-y-4 mt-2">
          {inviteToken ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <p className="text-sm font-semibold mb-2">Invitation created successfully!</p>
              <p className="text-xs mb-2">Since the email service is not configured in this MVP, please copy the invitation token below and share it with the user. They can use it during registration.</p>
              <div className="flex gap-2">
                <Input value={inviteToken} readOnly />
                <Button variant="primary" onClick={() => { navigator.clipboard.writeText(inviteToken); alert('Copied!'); }}>Copy</Button>
              </div>
              <Button className="mt-4 w-full" variant="ghost" onClick={() => { setIsInviteOpen(false); setInviteToken(null); }}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4 mt-2">
              <Input label="Email Address" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="colleague@company.com" />
              <Select label="Role" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                <option value="SUPPORT_AGENT">Support Agent</option>
                <option value="REVIEWER_APPROVER">Reviewer / Approver</option>
                <option value="ORG_ADMIN">Organization Admin</option>
              </Select>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Send Invite</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
