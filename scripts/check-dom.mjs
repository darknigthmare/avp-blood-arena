import fs from 'node:fs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=fs.readFileSync(new URL('../game.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
const idset=new Set(ids);
if(ids.length!==idset.size)throw Error('ID HTML en double');
for(const m of code.matchAll(/\bbyId\('([^']+)'\)/g))if(!idset.has(m[1]))throw Error('HTML id manquant : '+m[1]);
for(const file of ['alien-base.snapshot.json','blood-arena.profiles.json','cross-game-references.json']){
 if(!code.includes(file))throw Error('Fichier non chargé : '+file);
 if(!fs.existsSync(new URL('../data/'+file,import.meta.url)))throw Error('Données manquantes : '+file);
}
for(const fn of ['startMatch','endTurn','renderCodex','syncCodexTypes','render','aiTurn']){
 if(!code.includes('function '+fn+'(')&&!code.includes('async function '+fn+'('))throw Error('Fonction manquante : '+fn);
}
if(!/canvas\s+id="field"\s+width="1008"\s+height="588"/.test(html))throw Error('Taille terrain modifiée sans contrôle');
if(!css.includes('@media(max-width:620px)'))throw Error('Feuille tactile manquante');
console.log('OK DOM/ressources/fonctions : '+ids.length+' IDs.');
