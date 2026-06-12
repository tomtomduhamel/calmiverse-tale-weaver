const text = `[MODULATION : Parler doucement]

Gustave, Joseph, Boubou et Misa sont confortablement installés. [MODULATION : chuchoter] Ils dorment déjà.

[MODULATION : Fin]`;

const paragraphs = text
  .split(/\r?\n\s*\r?\n/)
  .map(p => p.trim())
  .filter(p => p.length > 0)
  .filter(p => !p.startsWith('[') || !p.endsWith(']'))
  .map(p => p.replace(/\[.*?\]/g, "").trim())
  .filter(p => p.length > 0);

console.log("Paragraphs count:", paragraphs.length);
paragraphs.forEach((p, idx) => {
  console.log(`P${idx}: ${JSON.stringify(p)}`);
});
