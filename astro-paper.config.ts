import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://sarperbey.github.io/",
    title: "sarperbey",
    description: "text, images and links",
    author: "sarperbey",
    profile: "https://github.com/sarperbey",
    ogImage: "default-og.jpg",
    lang: "en",
    timezone: "Europe/Rome",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/sarperbey/sarperbey.github.io/edit/main/",
    },
    search: "pagefind",
    toc: true,
  },
  socials: [
    { name: "github",   url: "https://github.com/sarperbey" },
  ],
  shareLinks: [
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x",        url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});