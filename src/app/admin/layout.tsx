import type { Metadata } from 'next';
export const metadata: Metadata = {
 title: 'Pocket Planner — Admin',
 description: 'Administrasi operasional Pocket Planner. DOKU belum terintegrasi.',
 robots: { index: false, follow: false },
};
export default function AdminLayout({children}: {children: React.ReactNode}) {return children;}
