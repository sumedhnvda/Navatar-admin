import { createUploadthing } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  doctorImage: f({
    image: {
      maxFileSize: "200KB",
      maxFileCount: 1,
      contentTypes: ["image/png"],
    },
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.ufsUrl);
      return { uploadedBy: "admin", url: file.ufsUrl };
    }),
};
