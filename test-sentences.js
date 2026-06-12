const text = "Gustave, Joseph, Boubou et Misa sont confortablement allongés. Le sol en bois est ferme! Leurs bras et leurs jambes sont totalement relâchés, s'étalant tranquillement comme de petites étoiles de mer. Tout est calme dans la maison.";

// Split by sentences using positive lookbehind to keep the punctuation
const sentences = text
  .split(/(?<=[.!?])\s+/)
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log("Sentences count:", sentences.length);
sentences.forEach((s, idx) => {
  console.log(`S${idx}: ${JSON.stringify(s)}`);
});
