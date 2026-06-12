const text1 = "[MODULATION : Parler doucement]\n\nGustave, Joseph, Boubou et Misa...";
console.log("text1 length:", text1.split(/\r?\n\s*\r?\n/).length);
console.log("text1 split:", text1.split(/\r?\n\s*\r?\n/));

const text2 = "[MODULATION : Parler doucement]\r\n\r\nGustave, Joseph, Boubou et Misa...";
console.log("text2 length:", text2.split(/\r?\n\s*\r?\n/).length);
console.log("text2 split:", text2.split(/\r?\n\s*\r?\n/));

const text3 = "[MODULATION : Parler doucement]\r\n   \r\nGustave, Joseph, Boubou et Misa...";
console.log("text3 length:", text3.split(/\r?\n\s*\r?\n/).length);
console.log("text3 split:", text3.split(/\r?\n\s*\r?\n/));
