export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  media_type?: 'movie' | 'tv' | 'person';
  runtime?: number;
  number_of_seasons?: number;
  tagline?: string;
  status?: string;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  similar?: { results: Movie[] };
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  type: string;
  site: string;
}

export interface Review {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: 'movie' | 'tv';
  rating: number;
  content: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { username: string | null; avatar_url: string | null };
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: 'movie' | 'tv';
  added_at: string;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: 'movie' | 'tv';
  added_at: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface SharedList {
  title: string;
  owner: { username: string | null; avatar_url: string | null } | null;
  items: FavoriteItem[];
}

export interface TrailerItem {
  youtube_video_id: string;
  label: string;
  sublabel: string | null;
  poster_path: string | null;
}

export interface TmdbResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
