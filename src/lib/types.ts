export type Role = "fan" | "creator" | "admin";
export type Verification = "unverified" | "pending" | "verified" | "rejected";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  role: Role;
  verification_status: Verification;
};

export type CreatorProfile = {
  profile_id: string;
  headline: string;
  about: string;
  categories: string[];
};

export type MediaItem = {
  id: string;
  storage_path: string;
  kind: "image" | "video";
  title: string;
  visibility: "private" | "followers" | "public";
  moderation: "pending" | "approved" | "rejected";
};

export const CATEGORIES = [
  "Fitness", "Art", "Photography", "Fashion", "Music", "Gaming",
  "Cosplay", "Lifestyle", "Travel", "Wellness",
] as const;
