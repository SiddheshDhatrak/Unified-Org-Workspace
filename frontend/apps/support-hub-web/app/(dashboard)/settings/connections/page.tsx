'use client';
import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { connections } from '@workspace/api-client';
import { Button, Input, Table, Modal, Badge } from '@workspace/ui-kit';
import { Network, Search, Link as LinkIcon } from 'lucide-react';

export default function ConnectionsPage() {
  const { orgId } = useOrgContext();
  const [conns, setConns] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRequestOpen, setIsRequestOpen] = React.useState(false);
  const [partnerSlug, setPartnerSlug] = React.useState('');

  React.useEffect(() => {
    if (orgId) {
      connections.list(orgId).then(data => {
        setConns(data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  }, [orgId]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerSlug) return;
    try {
      await connections.request(orgId, partnerSlug);
      setIsRequestOpen(false);
      setPartnerSlug('');
      connections.list(orgId).then(setConns).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Connection requested');
      setIsRequestOpen(false);
    }
  };

  const columns = [
    {
      header: 'Partner Organization',
      render: (c: any) => {
        const partner = c.requestingOrgId === orgId ? c.partnerOrg : c.requestingOrg;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center font-medium">
              {partner?.name?.[0] || '?'}
            </div>
            <div>
              <p className="font-medium text-sm">{partner?.name || 'Unknown'}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{partner?.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Direction',
      render: (c: any) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {c.requestingOrgId === orgId ? 'Outbound (Sent)' : 'Inbound (Received)'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (c: any) => <Badge status={c.status} />,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Network className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            <span>Cross-Org Connections</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage federated trust and B2B connections.</p>
        </div>
        <Button variant="primary" onClick={() => setIsRequestOpen(true)}>
          <LinkIcon className="w-4 h-4 mr-2" />
          Request Connection
        </Button>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
        <Table data={conns} columns={columns} isLoading={isLoading} />
        {!isLoading && conns.length === 0 && (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            No connections found.
          </div>
        )}
      </div>

      <Modal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} title="Request Connection">
        <form onSubmit={handleRequest} className="space-y-4 mt-2">
          <Input label="Partner Organization Slug" value={partnerSlug} onChange={e => setPartnerSlug(e.target.value)} required placeholder="e.g. acme-corp-1234" />
          <p className="text-xs text-[var(--text-tertiary)]">Ask the partner for their organization slug to connect with them.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Send Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
