import type { Metadata } from 'next';
import { titleMetadata } from '@/lib/publicMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return titleMetadata('movie', id);
}

export default function MovieLayout({ children }: { children: React.ReactNode }) {
  return children;
}
