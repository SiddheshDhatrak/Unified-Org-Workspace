'use client';
import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { orgs } from '@workspace/api-client';
import { Button, Input, Select, Table, Modal, Badge } from '@workspace/ui-kit';
import { Users, UserPlus } from 'lucide-react';

export default function MembersPage() {
  const { orgId, orgRole, isGuestView } = useOrgContext();
  const isAdmin = orgRole === 'ORG_ADMIN';
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
      // We still get the token back in the response for a manual fallback
      if (res && (res as any).token) {
        setInviteToken((res as any).token);
      } else {
        alert('Invitation sent successfully!');
      }
      setInviteEmail('');
      orgs.listMembers(orgId).then(setMembers).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to send invitation');
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
    {
      header: 'Actions',
      render: (m: any) => (
        /* Actions (Admin Only) */
        isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Edit Role</Button>
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">Remove</Button>
          </div>
        )
      ),
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in-50">

      <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            <span>Organization Members</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>View and manage members of this organization.</p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="p-6 rounded-3xl border border-white/10 bg-zinc-900/50 space-y-4 backdrop-blur-xl">
        <Table data={members} columns={memberColumns} emptyMessage="No members loaded yet." />
      </div>

      {/* Invite Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member (§5.4)">
        <div className="space-y-4 mt-2">
          {inviteToken ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <p className="text-sm font-semibold mb-2">Invitation sent successfully!</p>
              <p className="text-xs mb-4 text-emerald-700 dark:text-emerald-300">An email has been automatically sent to the user with their registration link.</p>
              <p className="text-xs mb-2 text-zinc-500">If they don't receive it, you can manually share this link with them:</p>
              <div className="flex gap-2">
                <Input value={`${typeof window !== 'undefined' ? window.location.origin : ''}/register?token=${inviteToken}`} readOnly />
                <Button variant="primary" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/register?token=${inviteToken}`); alert('Copied!'); }}>Copy Link</Button>
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
