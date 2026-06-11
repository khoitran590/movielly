// Supabase schema types, hand-written to mirror supabase/*.sql.
// Keep in sync when adding migrations — or regenerate the maintained way once
// you're logged into the Supabase CLI:
//   npx supabase gen types typescript --project-id <project-ref> > src/types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// NOTE: these must be `type` aliases, not `interface`s — supabase-js's type
// resolution needs the implicit index signature that only object type
// literals get, otherwise Insert/Update payloads degrade to `never`.
type TitleListRow = {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  movie_type: string | null;
  added_at: string | null;
};

type TitleListInsert = {
  id?: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster?: string | null;
  movie_type?: string | null;
  added_at?: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          movie_id: number;
          movie_title: string;
          movie_poster: string | null;
          movie_type: string | null;
          rating: number;
          content: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          movie_id: number;
          movie_title: string;
          movie_poster?: string | null;
          movie_type?: string | null;
          rating: number;
          content?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          movie_id?: number;
          movie_title?: string;
          movie_poster?: string | null;
          movie_type?: string | null;
          rating?: number;
          content?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      watchlist: {
        Row: TitleListRow;
        Insert: TitleListInsert;
        Update: Partial<TitleListInsert>;
        Relationships: [];
      };
      favorites: {
        Row: TitleListRow;
        Insert: TitleListInsert;
        Update: Partial<TitleListInsert>;
        Relationships: [];
      };
      shared_lists: {
        Row: {
          id: string;
          user_id: string;
          share_token: string;
          title: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_token: string;
          title?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          share_token?: string;
          title?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
