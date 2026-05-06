import { INVALID_EXTENSIONS } from "@/constants";
import { extractFileExtension } from "@/lib";
import { type Removal } from "@/notification";
import { fetchTorrentFiles } from "@/qBittorrent/client";
import { sendNotification } from "@/resend/client";
import { fetchQueue, removeFromQueue } from "@/sonarr/client";

const isValidFile = (path: string) =>
  !(INVALID_EXTENSIONS as readonly string[]).includes(
    extractFileExtension(path),
  );

const sonarrDownloads = await fetchQueue();

/**
 * bail early if there are no active downloads
 */
if (sonarrDownloads.length === 0) {
  console.log(new Date(), `total: ${sonarrDownloads.length}. exiting.`);
  process.exit(0);
}

const downloadsToRemove = (
  await Promise.all(
    sonarrDownloads.map(async (download): Promise<Removal | null> => {
      /**
       * if the download has a warning it means that it completed.
       * This means that we can verify the output path instead of
       * retrieving the torrent download information
       */
      if (
        download.trackedDownloadStatus === "warning" &&
        download.outputPath &&
        !isValidFile(download.outputPath)
      ) {
        return {
          item: download,
          triggeringFile: download.outputPath,
          extension: extractFileExtension(download.outputPath),
        };
      }

      /**
       * we need to verify the torrent download information
       */
      const torrentFiles = download.downloadId
        ? await fetchTorrentFiles(download.downloadId)
        : null;

      if (!torrentFiles) {
        return null;
      }

      const invalidFile = torrentFiles.find((path) => !isValidFile(path));

      if (invalidFile) {
        return {
          item: download,
          triggeringFile: invalidFile,
          extension: extractFileExtension(invalidFile),
        };
      }

      return null;
    }),
  )
).filter((d): d is Removal => Boolean(d));

const idsToRemove = downloadsToRemove.map((d) => d.item.id);

console.log(
  new Date(),
  `total: ${sonarrDownloads.length} | items with warning: ${downloadsToRemove.length}`,
);
console.log(new Date(), "ids to block:", idsToRemove);

await sendNotification(downloadsToRemove);

if (idsToRemove.length > 0) {
  await removeFromQueue(idsToRemove);
}
