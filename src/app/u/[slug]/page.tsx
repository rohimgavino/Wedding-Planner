import { Suspense } from 'react';
import { PublicInvitationView } from '@/components/everrae/public-invitation-view';

export function generateStaticParams() {
  return [
    { slug: 'preview' },
    { slug: 'undangan-kami' },
    { slug: 'rohim-wiwit' },
  ];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5] text-slate-500 text-xs">
        Memuat undangan digital...
      </div>
    }>
      <PublicInvitationView slug={resolvedParams?.slug} />
    </Suspense>
  );
}
