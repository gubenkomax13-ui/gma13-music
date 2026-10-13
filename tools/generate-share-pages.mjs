import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const template = fs.readFileSync(path.join(root, "index.html"), "utf8");
const albums = JSON.parse(fs.readFileSync(path.join(root, "albums.json"), "utf8"));
const site = "https://gubenkomax13-ui.github.io/gma13-music";

const plain = (value) => value.replace(/<br\s*\/?>/gi, " ").replace(/\s*\n\s*/g, " ").trim();
const escapeAttribute = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function render({ album, track = null, trackNumber = null }) {
  const albumTitle = plain(album.title) + (album.subtitle ? ` · ${plain(album.subtitle)}` : "");
  const title = track ? `${plain(track.title)} · ${albumTitle} · ${album.artist}` : `${albumTitle} · ${album.artist}`;
  const description = track
    ? `${plain(track.title)} — композиция из альбома «${albumTitle}». Слушайте онлайн.`
    : `${plain(album.note)} Слушайте альбом «${albumTitle}» онлайн.`;
  const relativeImage = track ? (track.cover || track.thumb || album.cover) : album.cover;
  const image = `${site}/${encodeURI(relativeImage)}`;
  const url = trackNumber
    ? `${site}/album/${encodeURIComponent(album.id)}/track/${trackNumber}/`
    : `${site}/album/${encodeURIComponent(album.id)}/`;

  return template
    .replace('<base href="./" />', '<base href="/gma13-music/" />')
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeAttribute(description)}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeAttribute(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeAttribute(description)}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${escapeAttribute(image)}" />`)
    .replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="${track ? "music.song" : "music.album"}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeAttribute(url)}" />`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(title)}</title>`);
}

for (const album of albums) {
  const albumDir = path.join(root, "album", album.id);
  fs.mkdirSync(albumDir, { recursive: true });
  fs.writeFileSync(path.join(albumDir, "index.html"), render({ album }));

  album.tracks.forEach((track, index) => {
    const trackDir = path.join(albumDir, "track", String(index + 1));
    fs.mkdirSync(trackDir, { recursive: true });
    fs.writeFileSync(path.join(trackDir, "index.html"), render({ album, track, trackNumber: index + 1 }));
  });
}
