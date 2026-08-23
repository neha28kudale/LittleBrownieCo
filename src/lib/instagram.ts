import { supabase } from "@/lib/supabase";

export type InstagramPost = {
  id: string;
  caption: string;
  mediaType: "IMAGE" | "CAROUSEL_ALBUM" | "VIDEO";
  imageUrl: string;
  permalink: string;
  timestamp: string;
};

export async function getInstagramFeed(): Promise<{
  posts: InstagramPost[];
  configured: boolean;
}> {
  try {
    const { data, error } = await supabase.functions.invoke("instagram-feed");
    if (error || !data) {
      return { posts: [], configured: false };
    }
    return { posts: data.posts ?? [], configured: !!data.configured };
  } catch (err) {
    console.error("[instagram] getInstagramFeed", err);
    return { posts: [], configured: false };
  }
}
