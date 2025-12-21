import { Stream, ProviderContext } from "../types";

export const getStream = async function ({
  link: apiUrl,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const { axios } = providerContext;
  const streams: Stream[] = [];

  try {
    /* ----------------------------------------
     * 1️⃣ CALL JUSTANIME PLAY API
     * --------------------------------------*/
    const res = await axios.get(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
    });

    const downloads = res.data?.downloads || [];
    if (!downloads.length) return [];

    /* ----------------------------------------
     * 2️⃣ PUSH ONLY DOWNLOAD LINKS + SIZE
     * --------------------------------------*/
    for (const item of downloads) {
      if (!item.download) continue;

      streams.push({
        server: "anitaro",
        link: item.download,
        type: "mp4",
        quality: item.quality, // e.g. "720p"   // e.g. "98MB"
      });
    }

    return streams;
  } catch (err: any) {
    console.error("Download extraction failed:", err.message);
    return [];
  }
};
