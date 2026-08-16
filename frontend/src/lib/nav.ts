import { BookmarkCheck, Heart, Home, Users } from 'lucide-react';

// `/watchlist` stays as the route so shared links keep working; the visible
// word is Watched, because that is what the feature is.
export const NAV_ITEMS = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Watched', url: '/watchlist', icon: BookmarkCheck },
  { name: 'Favorites', url: '/favorites', icon: Heart },
  { name: 'Friends', url: '/friends', icon: Users },
] as const;
