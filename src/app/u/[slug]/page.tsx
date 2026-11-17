import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PublicInvitationView } from '@/components/everrae/public-invitation-view';

export function generateStaticParams() {
  return [
    { slug: 'preview' },
    { slug: 'undangan-kami' },
    { slug: 'rohim-wiwit' },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug || '';

  let title = 'The Wedding Invitation — Pocket Wedding';
  let description = 'Undangan Pernikahan Digital. Buka undangan untuk melihat detail acara dan kirim doa restu.';

  if (slug === 'rohim-wiwit') {
    title = 'The Wedding of Rohim & Wiwit — Undangan Pernikahan';
    description = 'Tanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu di hari bahagia kami.';
  } else if (slug === 'preview' || slug === 'undangan-kami') {
    title = 'The Wedding of Romeo & Juliet — Undangan Pernikahan';
    description = 'Pratinjau Undangan Pernikahan Digital. Rangkaian momen bahagia, lokasi akad & resepsi, serta ucapan doa restu.';
  }

  const url = `https://pocketwedding.id/u/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Pocket Wedding',
      images: [
        {
          url: 'https://pocketwedding.id/images/wedding-flowers.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://pocketwedding.id/images/wedding-flowers.jpg'],
    },
  };
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
