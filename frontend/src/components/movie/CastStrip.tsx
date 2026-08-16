import Image from 'next/image';
import type { CastMember } from '@/types';
import SectionHeading from '@/components/ui/SectionHeading';

// A credits roll, not a social-app grid: one horizontal strip of faces.
export default function CastStrip({ cast }: { cast: CastMember[] }) {
  if (cast.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeading>Cast</SectionHeading>
      <ul aria-label="Cast" className="no-scrollbar flex gap-5 overflow-x-auto pb-1">
        {cast.map(member => (
          <li key={member.id} className="w-16 shrink-0 text-center">
            <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-full bg-velvet">
              {member.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <span className="flex h-full items-center justify-center text-title text-fog">
                  {member.name[0]}
                </span>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-meta font-medium leading-tight text-screen">{member.name}</p>
            {member.character && (
              <p className="mt-0.5 line-clamp-2 text-meta leading-tight text-fog">{member.character}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
