import Image from 'next/image';

// Three vertically-scrolling columns of popular movie posters.
export default function PosterWall({ posters }: { posters: string[] }) {
  if (posters.length === 0) return null;

  const columns = [0, 1, 2].map(c => posters.filter((_, i) => i % 3 === c));
  const animations = ['posterScrollUp', 'posterScrollDown', 'posterScrollUp'];
  const durations = ['58s', '74s', '64s'];

  return (
    <div className="absolute inset-0 flex gap-3 p-3">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-1 overflow-hidden">
          <div
            className="flex flex-col will-change-transform"
            style={{ animation: `${animations[ci]} ${durations[ci]} linear infinite` }}
          >
            {[...col, ...col].map((url, i) => (
              <div key={`${url}-${i}`} className="relative mb-3 aspect-[2/3] w-full overflow-hidden rounded-poster">
                <Image
                  src={url}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="16vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
