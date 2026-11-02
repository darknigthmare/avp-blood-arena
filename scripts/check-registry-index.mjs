import fs from 'node:fs';
const read = name => JSON.parse(fs.readFileSync(new URL('../data/'+name, import.meta.url), 'utf8'));
const index = read('alien-base.registry-index.json');
const bridge = read('alien-base.unified-blood.json');
const game = read('blood-arena.profiles.json');
if (index.schemaVersion !== '1.0.0' || index.consumer !== 'avp-blood-arena' ||
    index.scope !== 'documentary-identities-only; not playable; no auto-unlock') throw Error('invalid index scope');
if (index.records.length !== 494 || index.registry.entityCount !== 652 || index.registry.gameCards !== 158 ||
    index.registry.documentaryCount !== index.records.length) throw Error('registry index count drift');
if (bridge.registry?.entityBlobSha !== index.registry.entityBlobSha ||
    bridge.registry.entityCount !== index.registry.entityCount ||
    bridge.registry.aliasCount !== 1679 || !/^[a-f0-9]{40}$/.test(index.registry.entityBlobSha)) throw Error('registry source mismatch');
if (index.registry.sourceStatus !== 'unmerged-unified-registry-preview' ||
    bridge.registry.sourceStatus !== index.registry.sourceStatus) throw Error('PR provenance not disclosed');
const byId = new Map(index.records.map(x => [x.id,x]));
if (byId.size !== index.records.length) throw Error('duplicate unified IDs');
for (const x of index.records) {
 if (x.category === 'game-card') throw Error('gameplay cards duplicated into documentary index');
 if (Object.keys(x).sort().join('|') !== 'category|classification|id|name') throw Error('nonpublic field: '+x.id);
 if (!x.id || !x.name || !x.category) throw Error('incomplete documentary record');
}
const sorted = [...byId.keys()].sort();
if (sorted.some((v,i) => index.records[i].id !== v)) throw Error('registry index order changed');
for(const p of bridge.profiles) {
 const target=byId.get(p.identityId);
 if(!target || target.name !== p.identityName || target.category !== p.identityCategory) throw Error('stale cross-game link '+p.localId);
}
if(bridge.profiles.length+bridge.unresolved.length!==game.records.length)throw Error('local coverage mismatch');
const raw = JSON.stringify(index);
if(/darknigthmare\/|sourceRefs|private|sourceUrl|health|damage|\"stats\"/.test(raw))throw Error('private/gameplay fields leaked to public index');
console.log('OK unified index: '+index.records.length+' public documentary records / '+index.registry.entityCount+' source entities; 7 links preserved.');
