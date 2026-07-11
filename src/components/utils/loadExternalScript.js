const loadedScripts = new Map();

export function loadExternalScript(src) {
  if (loadedScripts.has(src)) {
    return loadedScripts.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`
    );

    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", resolve, {
        once: true,
      });

      existing.addEventListener(
        "error",
        reject,
        {
          once: true,
        }
      );

      return;
    }

    const script = document.createElement("script");

    script.src = src;
    script.async = true;

    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };

    script.onerror = () => {
      loadedScripts.delete(src);

      reject(
        new Error(
          `No fue posible cargar el script: ${src}`
        )
      );
    };

    document.head.appendChild(script);
  });

  loadedScripts.set(src, promise);

  return promise;
}