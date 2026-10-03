/**
 * Video & live stream URL parser for YouTube, Twitch, Vimeo, and direct MP4/R2 media.
 * Runs on both server and client with zero external dependencies.
 */

export type VideoProvider = "youtube" | "twitch" | "vimeo" | "direct";

export interface ParsedVideo {
  provider: VideoProvider;
  originalUrl: string;
  embedUrl: string;
}

export function parseVideoUrl(rawUrl: string | null | undefined): ParsedVideo | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url) return null;

  try {
    // 1. YouTube Live / Standard / Shorts / Embeds
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    );
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      return {
        provider: "youtube",
        originalUrl: url,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`,
      };
    }

    // 2. Twitch Video VOD
    const twitchVideoMatch = url.match(/twitch\.tv\/videos\/(\d+)/i);
    if (twitchVideoMatch && twitchVideoMatch[1]) {
      const videoId = twitchVideoMatch[1];
      const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
      return {
        provider: "twitch",
        originalUrl: url,
        embedUrl: `https://player.twitch.tv/?video=${videoId}&parent=${host}&autoplay=true&muted=true`,
      };
    }

    // 3. Twitch Live Channel
    const twitchChannelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]{3,25})/i);
    if (
      twitchChannelMatch &&
      twitchChannelMatch[1] &&
      !["directory", "p", "downloads", "videos"].includes(twitchChannelMatch[1].toLowerCase())
    ) {
      const channel = twitchChannelMatch[1];
      const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
      return {
        provider: "twitch",
        originalUrl: url,
        embedUrl: `https://player.twitch.tv/?channel=${channel}&parent=${host}&autoplay=true&muted=true`,
      };
    }

    // 4. Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
    if (vimeoMatch && (vimeoMatch[3] || vimeoMatch[1])) {
      const videoId = vimeoMatch[3] || vimeoMatch[1];
      return {
        provider: "vimeo",
        originalUrl: url,
        embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&dnt=1`,
      };
    }

    // 5. Direct MP4 / WebM / Cloudflare R2 / S3
    if (/\.(mp4|webm|ogg|mov)($|\?)/i.test(url) || url.includes("r2.cloudflarestorage.com") || url.includes("r2.dev")) {
      return {
        provider: "direct",
        originalUrl: url,
        embedUrl: url,
      };
    }

    // 6. Generic embed URL if explicitly provided
    if (/^https?:\/\//i.test(url) && url.includes("/embed")) {
      return {
        provider: "direct",
        originalUrl: url,
        embedUrl: url,
      };
    }

    return null;
  } catch {
    return null;
  }
}
