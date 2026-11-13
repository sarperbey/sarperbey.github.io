import { defineConfig } from "tinacms";

const branch = process.env.GITHUB_BRANCH || process.env.HEAD || "main";

export default defineConfig({
  branch,
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: { outputFolder: "admin", publicFolder: "public" },
  media: { tina: { mediaRoot: "images", publicFolder: "public" } },

  schema: {
    collections: [
      {
        name: "posts",
        label: "Posts",
        path: "src/content/posts",
        format: "md",
        ui: {
          filename: {
            slugify: values =>
              (values?.title || "untitled")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "datetime", name: "pubDatetime", label: "Published", required: true },
          { type: "string", name: "description", label: "Short note", required: true, ui: { component: "textarea" } },
          { type: "string", name: "link", label: "Link (leave empty for a normal post)" },
          { type: "string", name: "tags", label: "Tags", list: true },
          { type: "boolean", name: "featured", label: "Featured" },
          { type: "boolean", name: "draft", label: "Draft" },
          { type: "datetime", name: "modDatetime", label: "Modified" },
          { type: "image", name: "ogImage", label: "Social image" },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },
    ],
  },
});
