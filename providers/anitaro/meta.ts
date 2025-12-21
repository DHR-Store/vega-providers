import { Info, ProviderContext } from "../types";

const headers = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-store",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

export const getMeta = ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> => {
  const { axios, cheerio } = providerContext;

  const empty: Info = {
    title: "",
    synopsis: "",
    image: "",
    imdbId: "",
    type: "series",
    linkList: [],
  };

  return axios
    .get(link, { headers })
    .then((res: any) => {
      const $ = cheerio.load(res.data || "");

      // ---------------- TITLE ----------------
      const title =
        $("h2.film-name").first().text().trim() ||
        $("li.breadcrumb-item.active").text().trim() ||
        "";

      // ---------------- IMAGE ----------------
      let image =
        $(".film-poster-img").first().attr("src") ||
        $(".anis-cover").css("background-image")?.replace(/url\(['"]?|['"]?\)/g, "") ||
        "";

      if (image.startsWith("//")) image = "https:" + image;

      // ---------------- SYNOPSIS ----------------
      const synopsis =
        $(".film-description .text").clone().children().remove().end().text().trim() ||
        $(".item-head:contains('Overview')")
          .next(".text")
          .text()
          .trim() ||
        "";

      // ---------------- TYPE ----------------
      const typeText = $(".film-stats .item").first().text().trim().toLowerCase();
      const type =
        typeText.includes("movie") ? "movie" : "series";

      const info: Info = {
        title,
        synopsis,
        image,
        imdbId: "",
        type,
        linkList: [],
      };

      // ---------------- MORE SEASONS ----------------
      $(".block_area-seasons .os-item").each((_, el) => {
        const season = $(el);

        const seasonTitle =
          season.find(".title").text().trim() ||
          season.attr("title") ||
          "Season";

        let seasonLink = season.attr("href") || "";
        if (!seasonLink) return;

        if (!seasonLink.startsWith("http")) {
          seasonLink = new URL(seasonLink, link).href;
        }

        info.linkList.push({
          title: seasonTitle,
          quality: seasonTitle,
          episodesLink: seasonLink,
          directLinks: [],
        });
      });

      // ---------------- FALLBACK (NO SEASONS FOUND) ----------------
      if (info.linkList.length === 0) {
        info.linkList.push({
          title: "Season 1",
          quality: "Season 1",
          episodesLink: link,
          directLinks: [],
        });
      }

      return info;
    })
    .catch((err: any) => {
      console.error("meta error:", err?.message || err);
      return empty;
    });
};
