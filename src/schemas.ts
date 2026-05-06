import { z } from "zod";

// Each entry in GET /api/v2/torrents/files?hash={hash}
export const QBittorrentFileSchema = z.object({
  // Relative path within the torrent, e.g. "Show.S01E01/Show.S01E01.exe"
  name: z.string(),
  size: z.number(),
  progress: z.number(),
});

export const QBittorrentFilesSchema = z.array(QBittorrentFileSchema);

export type QBittorrentFiles = z.infer<typeof QBittorrentFilesSchema>;

const StatusMessageSchema = z.object({
  title: z.string(),
  messages: z.array(z.string()),
});

/**
 * This schema contains the bare minimum props to identify invalid or dangerous
 * downloads.
 */
export const SonarrQueueItemSchema = z.object({
  id: z.number(),
  title: z.string().nullish(),
  trackedDownloadStatus: z.enum(["ok", "warning", "error"]),
  statusMessages: z.array(StatusMessageSchema),
  // downloadId is the torrent hash — matches qBittorrent's hash field (case-insensitive)
  downloadId: z.string().optional(),
  // outputPath reflects the final file path Sonarr resolved; often already shows the bad ext
  outputPath: z.string().optional(),
});

export type SonarrQueueItem = z.infer<typeof SonarrQueueItemSchema>;

export const SonarrQueueResponseSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  totalRecords: z.number(),
  records: z.array(SonarrQueueItemSchema),
});
