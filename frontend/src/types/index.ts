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
  profiles?: { username: string | null; avatar_url: string | null; bio?: string | null };
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: 'movie' | 'tv';
  added_at: string;
  title_status: 'planned' | 'watched';
  watched_at: string | null;
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
  owner: { username: string | null; avatar_url: string | null; bio?: string | null } | null;
  items: FavoriteItem[];
}

// One entry in a profile's all-time top five. Denormalized (title + poster
// path) so rendering a profile never needs a TMDB round-trip.
// A `type` alias, not an `interface`: only object type literals get the
// implicit index signature that the jsonb (Json) column type requires.
export type TopMovie = {
  id: number;
  title: string;
  poster: string | null;
  type: 'movie' | 'tv';
};

export interface FriendProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio?: string | null;
  favorite_genres?: number[];
  top_movies?: TopMovie[];
}

export interface FriendEntry {
  friendshipId: string;
  profile: FriendProfile;
  since: string;
  shareToken?: string | null;
}

// One item in the friends activity feed: a friend either reviewed or watched a title.
interface FeedEntryBase {
  id: string;
  at: string;
  profile: FriendProfile;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: 'movie' | 'tv';
}

export type FeedEntry =
  | (FeedEntryBase & { kind: 'review'; rating: number; content: string | null })
  | (FeedEntryBase & { kind: 'watched' });

export interface TrailerItem {
  youtube_video_id: string;
  label: string;
  sublabel: string | null;
  poster_path: string | null;
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface WatchRegion {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

export interface UserPreferences {
  region: string;
  preferred_provider_ids: number[];
  updated_at: string | null;
}

export interface WatchProviders {
  region: string;
  link: string | null;
  stream: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface TmdbResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
