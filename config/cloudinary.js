import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  secure: true,
});

export async function uploadImage(buffer, folder, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `gysc/${folder}`, public_id: publicId, overwrite: true, resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export async function uploadFile(buffer, folder, publicId, resourceType = "auto") {
  const isRawPdf = resourceType === "raw";
  const id = isRawPdf && !publicId.endsWith(".pdf") ? `${publicId}.pdf` : publicId;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `gysc/${folder}`,
        public_id: id,
        overwrite: true,
        resource_type: resourceType,
        access_mode: "public",
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId, resourceType = "image") {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (e) {
    console.warn("Cloudinary delete warning:", e.message);
  }
}

export default cloudinary;
