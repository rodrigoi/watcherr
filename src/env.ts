import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    SONARR_URL: z.url(),
    SONARR_API_KEY: z.string().min(1),
    RADARR_URL: z.url(),
    RADARR_API_KEY: z.string().min(1),
    QBITTORRENT_URL: z.url(),
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string(),
    EMAIL_FROM_NAME: z.string(),
    EMAIL_TO: z.string(),
  },
  runtimeEnv: process.env,
});
