// Client-side image resize to keep avatar uploads small on slow connections.
// Returns a Promise<File>. On any failure, resolves with the original input
// (we'd rather upload a big file than block the user).

const DEFAULTS = { maxW: 512, maxH: 512, quality: 0.85 };

export const resizeImage = (file, options = {}) => {
  const { maxW, maxH, quality } = { ...DEFAULTS, ...options };

  return new Promise((resolve) => {
    if (!file || typeof file !== "object") {
      resolve(file);
      return;
    }
    const type = file.type || "";
    if (!type.startsWith("image/")) {
      resolve(file);
      return;
    }

    let objectUrl = null;
    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (_) {}
      }
    };

    try {
      objectUrl = URL.createObjectURL(file);
    } catch (_) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxW / img.width, maxH / img.height);
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              resolve(file);
              return;
            }
            try {
              const baseName = (file.name || "avatar").replace(/\.\w+$/, "");
              const resized = new File([blob], `${baseName}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(resized);
            } catch (_) {
              resolve(file);
            }
          },
          "image/jpeg",
          quality
        );
      } catch (_) {
        cleanup();
        resolve(file);
      }
    };
    img.onerror = () => {
      cleanup();
      resolve(file);
    };
    img.src = objectUrl;
  });
};

export default resizeImage;
