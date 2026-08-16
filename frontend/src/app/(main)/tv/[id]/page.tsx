'use client';

import { useParams } from 'next/navigation';
import TitleDetail from '@/components/movie/TitleDetail';

export default function TvDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <TitleDetail type="tv" id={Number(id)} />;
}
