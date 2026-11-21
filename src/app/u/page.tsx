import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PublicInvitationView } from '@/components/everrae/public-invitation-view';

export const metadata: Metadata = {
  title: 'The Wedding Invitation — Pocket Wedding',
  description: 'Undangan Pernikahan Digital. Buka undangan untuk melihat detail acara, lokasi akad & resepsi, dan kirim doa restu.',
  alternates: {
    canonical: '/u',
  },
  openGraph: {
    title: 'The Wedding Invitation — Pocket Wedding',
    description: 'Undangan Pernikahan Digital. Buka undangan untuk melihat detail acara dan RSVP.',
    url: 'https://pocketwedding.id/u',
    siteName: 'Pocket Wedding',
    images: [
      {
        url: 'https://pocketwedding.id/images/wedding-flowers.jpg',
        width: 1200,
        height: 630,
        alt: 'Undangan Pernikahan Pocket Wedding',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Wedding Invitation — Pocket Wedding',
    description: 'Undangan Pernikahan Digital. Buka undangan untuk melihat detail acara dan RSVP.',
    images: ['https://pocketwedding.id/images/wedding-flowers.jpg'],
  },
};

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
