import { log } from "../../log.js";
import { withRetry } from "../../utils/retry.js";
import type { YouTubeChannel } from "./types.js";
import type { YouTubeClient } from "./youtube-client.js";

const SEARCH_QUOTA_COST = 100;
const CHANNEL_DETAILS_QUOTA_COST = 1;

export async function searchChannels(
  client: YouTubeClient,
  query: string,
  maxResults = 10
): Promise<YouTubeChannel[]> {
  try {
    log("youtube_search_channels_start", { query, maxResults });

    const searchResponse = await withRetry(() =>
      client.youtube.search.list({
        part: ["snippet"],
        q: query,
        type: ["channel"],
        maxResults,
      })
    );

    const channels: YouTubeChannel[] = [];

    for (const item of searchResponse.data?.items || []) {
      if (item.snippet && item.id?.channelId) {
        const channelId = item.id.channelId;
        const channelDetails = await withRetry(() =>
          client.youtube.channels.list({
            part: ["contentDetails"],
            id: [channelId],
          })
        );

        const uploadsPlaylistId =
          channelDetails.data.items?.[0]?.contentDetails?.relatedPlaylists
            ?.uploads;

        if (uploadsPlaylistId) {
          channels.push({
            channelId,
            title: item.snippet.title || "",
            description: item.snippet.description || "",
            uploadsPlaylistId,
          });
        }
      }
    }

    log("youtube_search_channels_complete", {
      query,
      channelsFound: channels.length,
      quotaUsed:
        SEARCH_QUOTA_COST + channels.length * CHANNEL_DETAILS_QUOTA_COST,
    });

    return channels;
  } catch (error) {
    log(
      "youtube_search_channels_error",
      {
        query,
        error: String(error),
      },
      "error"
    );
    throw error;
  }
}
