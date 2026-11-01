import fs from 'node:fs';
const c=JSON.parse(fs.readFileSync(new URL('../data/alien-base.snapshot.json',import.meta.url),'utf8'));
const p=JSON.parse(fs.readFileSync(new URL('../data/blood-arena.profiles.json',import.meta.url),'utf8'));
const ids=new Set(c.entities.map(e=>e.id)),pids=new Set();
if(c.entities.length!==ids.size)throw Error('Doublon canon');
for(const e of c.entities)for(const s of e.sourceIds)if(!c.sources[s])throw Error('Source absente '+s);
for(const e of p.records){if(pids.has(e.id))throw Error('Doublon profil '+e.id);pids.add(e.id);if(!ids.has(e.entityId))throw Error('Entité absente '+e.id+' -> '+e.entityId);for(const k of ['movement','hp','strength','agility','technique','armor'])if(!Number.isInteger(e.stats[k]))throw Error('Stat invalide '+e.id);}
if(p.totalRecords!==p.records.length||p.scope!=='partial_verified_extract')throw Error('Couverture non représentée honnêtement');
console.log('OK, '+ids.size+' références et '+pids.size+' profils (partiels).');
