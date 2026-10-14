(() => {
  "use strict";

  const storageKey = "memeboard.memes";
  const maxImageSize = 3 * 1024 * 1024;
  const imagePattern = /^data:image\/(?:png|jpeg|gif|webp|avif);base64,[A-Za-z0-9+/]+={0,2}$/;
  const form = document.getElementById("meme-form");
  const fileInput = document.getElementById("image");
  const description = document.getElementById("description");
  const preview = document.getElementById("preview");
  const addButton = document.getElementById("add-button");
  const grid = document.getElementById("memes");
  const empty = document.getElementById("empty");
  const status = document.getElementById("status");
  let memes = [];
  let selectedImage = "";
  let selectionVersion = 0;
  let storageReady = false;

  function announce(message) {
    status.textContent = message;
  }

  function isMeme(meme) {
    return meme && typeof meme.id === "string" && /^m-[a-z0-9-]+$/.test(meme.id) &&
      typeof meme.image === "string" && imagePattern.test(meme.image) &&
      meme.image.length <= maxImageSize * 4 / 3 + 100 &&
      typeof meme.description === "string" && meme.description.length <= 500;
  }

  function createCard(meme) {
    const card = document.createElement("article");
    card.className = "meme";
    card.id = meme.id;
    const image = document.createElement("img");
    image.src = meme.image;
    image.alt = meme.description || "Saved meme";
    image.loading = "lazy";
    const text = document.createElement("p");
    text.textContent = meme.description;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", meme.description ? `Delete meme: ${meme.description}` : "Delete meme");
    remove.setAttribute("hx-delete", `memes/${meme.id}`);
    remove.setAttribute("hx-swap", "none");
    card.append(image, text, remove);
    return card;
  }

  function readSavedMemes() {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(saved) || !saved.every(isMeme) ||
        new Set(saved.map((meme) => meme.id)).size !== saved.length) {
      throw new Error("Invalid saved memes");
    }
    return saved;
  }

  function render() {
    htmx.swap(grid, memes.map((meme) => createCard(meme).outerHTML).join(""), { swapStyle: "innerHTML" });
    empty.hidden = memes.length > 0;
  }

  function save(update) {
    if (!storageReady) {
      announce("Browser storage is unavailable or unreadable. Check this site's storage settings before making changes.");
      return false;
    }
    try {
      const nextMemes = update(readSavedMemes());
      localStorage.setItem(storageKey, JSON.stringify(nextMemes));
      memes = nextMemes;
      return true;
    } catch {
      announce("Could not save. Browser storage may be full or disabled. Try a smaller image or delete a meme to free space.");
      return false;
    }
  }

  function selectImage(file) {
    const version = ++selectionVersion;
    selectedImage = "";
    preview.hidden = true;
    preview.removeAttribute("src");
    addButton.disabled = false;
    if (!file) return;
    if (!/^image\/(?:png|jpeg|gif|webp|avif)$/.test(file.type)) {
      announce("Choose a PNG, JPEG, GIF, WebP or AVIF image.");
      return;
    }
    if (file.size > maxImageSize) {
      announce("That image is too large. Choose one no larger than 3 MiB.");
      return;
    }
    addButton.disabled = true;
    announce("Reading image…");
    const reader = new FileReader();
    reader.onload = () => {
      if (version !== selectionVersion) return;
      addButton.disabled = false;
      if (typeof reader.result !== "string" || !imagePattern.test(reader.result)) {
        announce("Could not read that image. Please choose another.");
        return;
      }
      selectedImage = reader.result;
      preview.src = selectedImage;
      preview.hidden = false;
      announce("Image ready. Add an optional description, then save.");
    };
    reader.onerror = () => {
      if (version !== selectionVersion) return;
      addButton.disabled = false;
      announce("Could not read that image. Please try again.");
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener("change", () => selectImage(fileInput.files[0]));
  document.addEventListener("paste", (event) => {
    const item = Array.from(event.clipboardData?.items || []).find((item) =>
      item.kind === "file" && item.type.startsWith("image/"));
    if (!item) return;
    event.preventDefault();
    fileInput.value = "";
    selectImage(item.getAsFile());
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!window.htmx) announce("HTMX could not load. Reload the page to try again.");
  });

  document.body.addEventListener("htmx:configRequest", (event) => {
    event.preventDefault();
    const { elt, verb } = event.detail;
    if (elt === form && verb === "post") {
      if (!selectedImage || addButton.disabled) {
        announce("Choose or paste an image first.");
        return;
      }
      const meme = {
        id: `m-${crypto.randomUUID()}`,
        image: selectedImage,
        description: description.value.trim()
      };
      if (!save((saved) => [meme, ...saved])) return;
      render();
      form.reset();
      ++selectionVersion;
      selectedImage = "";
      preview.hidden = true;
      preview.removeAttribute("src");
      announce("Meme added.");
    } else if (verb === "delete" && grid.contains(elt)) {
      const card = elt.closest(".meme");
      if (!card || !save((saved) => saved.filter((meme) => meme.id !== card.id))) return;
      render();
      announce("Meme deleted.");
    }
  });

  function load() {
    try {
      memes = readSavedMemes();
      storageReady = true;
      grid.replaceChildren(...memes.map(createCard));
      empty.hidden = memes.length > 0;
      if (window.htmx) htmx.process(grid);
    } catch {
      storageReady = false;
      announce("Saved memes could not be loaded. Storage may be disabled or damaged. Existing data has not been overwritten.");
    }
  }

  window.addEventListener("storage", (event) => {
    if (event.storageArea === localStorage && (event.key === storageKey || event.key === null)) load();
  });
  load();
})();
