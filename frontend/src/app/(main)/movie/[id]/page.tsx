'use client';

import { useParams } from 'next/navigation';
import TitleDetail from '@/components/movie/TitleDetail';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <TitleDetail type="movie" id={Number(id)} />;
}
