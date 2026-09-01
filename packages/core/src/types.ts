export type TitleType = 'movie' | 'tv';

export interface Genre { id: number; name: string }
export interface CastMember { id: number; name: string; character: string; profile_path: string | null }
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
  media_type?: TitleType | 'person';
  runtime?: number;
  number_of_seasons?: number;
  tagline?: string;
  status?: string;
  credits?: { cast: CastMember[] };
}
export interface TmdbResponse<T> { page: number; results: T[]; total_pages: number; total_results: number }
export interface TrailerItem { youtube_video_id: string; label: string; sublabel: string | null; poster_path: string | null }
export interface WatchProvider { provider_id: number; provider_name: string; logo_path: string | null }
export interface WatchRegion { iso_3166_1: string; english_name: string; native_name: string }
export interface WatchProviders { region: string; link: string | null; stream: WatchProvider[]; rent: WatchProvider[]; buy: WatchProvider[] }
export interface SavedTitle {
  id: string; user_id: string; movie_id: number; movie_title: string; movie_poster: string | null;
  movie_type: TitleType; added_at: string;
}
export interface WatchlistItem extends SavedTitle { title_status: 'planned' | 'watched'; watched_at: string | null }
export type FavoriteItem = SavedTitle;
export interface Review extends SavedTitle { rating: number; content: string | null; created_at: string; updated_at: string; profiles?: { username: string | null; avatar_url: string | null } }
export type TopMovie = { id: number; title: string; poster: string | null; type: TitleType };
export interface FriendProfile { id: string; username: string | null; avatar_url: string | null; bio?: string | null; favorite_genres?: number[]; top_movies?: TopMovie[] }
export interface FriendshipRow { id: string; requester_id: string; addressee_id: string; status: 'pending' | 'accepted'; created_at: string }
export interface SharedList { title: string; owner: { username: string | null; avatar_url: string | null; bio?: string | null } | null; items: FavoriteItem[] }
export interface UserPreferences { region: string; preferred_provider_ids: number[]; updated_at: string | null }
