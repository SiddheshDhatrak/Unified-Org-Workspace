'use client';
import React from 'react';
import { useOrgContext } from '@workspace/hooks';
import { Table, Badge } from '@workspace/ui-kit';
import { Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SharedWithMePage() {
  const { orgName } = useOrgContext();
  const router = useRouter();

  const mockSharedItems = [
    {
      id: 'ticket1',
      title: 'Login authentication timeout spikes (From Acme Corp)',
      type: 'TICKET',
      status: 'OPEN',
      partnerOrg: 'Acme Corp (§13.3)',
      sharedBy: 'Alice Acme',
    },
  ];

  const columns = [
    {
      header: 'Item & Origin Partner',
      render: (item: any) => (
        <div>
          <p className="font-bold text-white">{item.title}</p>
          <p className="text-xs text-zinc-400">Shared by {item.sharedBy} from <span className="text-cyan-400 font-semibold">{item.partnerOrg}</span></p>
        </div>
      ),
    },
    { header: 'Resource Type', accessorKey: 'type' },
    { header: 'Status', render: (item: any) => <Badge status={item.status} /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in-50">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Share2 className="w-6 h-6 text-cyan-400" />
          <span>Partner Shared Items (§13.3 / §18.1)</span>
        </h1>
        <p className="text-xs text-zinc-400">Items shared across organization boundaries. Clicking an item triggers Restricted Guest View Mode.</p>
      </div>

      <Table data={mockSharedItems} columns={columns} onRowClick={(item) => router.push(`/tickets/${item.id}`)} />
    </div>
  );
}
