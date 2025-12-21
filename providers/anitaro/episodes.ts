import { ProviderContext } from "../types";

interface EpisodeLink {
  title: string;
  link: string;
}

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string;
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const { axios, cheerio, commonHeaders } = providerContext;

  try {
    /* ----------------------------------------
     * 1️⃣ AniTaro DETAILS → TITLE
     * --------------------------------------*/
    const detailRes = await axios.get(url, { headers: commonHeaders });
    const $ = cheerio.load(detailRes.data);

    const title =
      $("h2.film-name").text().trim() ||
      $("h1").first().text().trim();

    if (!title) return [];

    /* ----------------------------------------
     * 2️⃣ SEARCH ON JUSTANIME API
     * --------------------------------------*/
    const searchApi =
      `https://dwnld.justanime.to/api/search?q=` +
      encodeURIComponent(title);

    const searchRes = await axios.get(searchApi);
    const firstResult = searchRes.data?.data?.[0];
    if (!firstResult?.session) return [];

    const animeSession = firstResult.session;

    /* ----------------------------------------
     * 3️⃣ FETCH EPISODES (RELEASES API)
     * --------------------------------------*/
    const releasesApi =
      `https://dwnld.justanime.to/api/${animeSession}/releases?page=1`;

    const releasesRes = await axios.get(releasesApi);
    const releases = releasesRes.data?.data || [];

    if (!releases.length) return [];

    /* ----------------------------------------
     * 4️⃣ BUILD EPISODE BUTTON LINKS
     * --------------------------------------*/
    const episodes: EpisodeLink[] = releases
      .sort((a: any, b: any) => a.episode - b.episode)
      .map((ep: any) => ({
        title: `Episode ${ep.episode}`,
        link:
          `https://dwnld.justanime.to/api/play/` +
          `${animeSession}?episodeId=${ep.session}`,
      }));

    return episodes;
  } catch (err: any) {
    console.error("Episodes API error:", err.message);
    return [];
  }
};
