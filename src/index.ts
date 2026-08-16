import { extractFileExtension, isValidFile, log } from "@/lib";
import { type Removal } from "@/notification";
import { fetchTorrentFiles } from "@/qBittorrent/client";
import { sendNotification } from "@/resend/client";
import { fetchQueue, removeFromQueue } from "@/sonarr/client";

log("------------------------------------------------------");

const sonarrDownloads = await fetchQueue();

/**
 * bail early if there are no active downloads
 */
if (sonarrDownloads.length === 0) {
  log("");
  log(`Nothing to do, exiting.`);
  log("------------------------------------------------------");
  process.exit(0);
}

/**
 * for each download, check if it has a warning. Otherwise,
 * download file list from QBT.
 */
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
        log(`Possible completed download: "${download.title}"`);

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
        log(`Invalid file found for "${download.title}".`);
        return {
          item: download,
          triggeringFile: invalidFile,
          extension: extractFileExtension(invalidFile),
        };
      }

      log(`File is valid for "${download.title}".`);
      return null;
    }),
  )
).filter((d): d is Removal => Boolean(d));

const idsToRemove = downloadsToRemove.map((d) => d.item.id);

log(
  `Download count: ${sonarrDownloads.length} | Items to remove: ${downloadsToRemove.length}`,
);

if (idsToRemove.length > 0) {
  /**
   * bulk remove all the downloads from the queue via Sonarr
   */
  await removeFromQueue(idsToRemove);

  /**
   * send email notification of the removal
   */
  await sendNotification(downloadsToRemove);
}

log("------------------------------------------------------");
