import { Suspense } from 'react';
import { PublicInvitationView } from '@/components/everrae/public-invitation-view';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5] text-slate-500 text-xs">
        Memuat undangan digital...
      </div>
    }>
      <PublicInvitationView />
    </Suspense>
  );
}
