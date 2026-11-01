import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../data/alien-base.unified-blood.json',import.meta.url),'utf8'));
const profiles=JSON.parse(fs.readFileSync(new URL('../data/blood-arena.profiles.json',import.meta.url),'utf8'));
if(data.consumer!=='avp-blood-arena'||data.schemaVersion!=='1.0.0')throw Error('wrong unified bridge');
if(data.policy!=='identities-provenance-only; sport balancing belongs exclusively to the game')throw Error('scoped stats policy missing');
if(!Array.isArray(data.profiles)||!Array.isArray(data.unresolved))throw Error('missing bridge arrays');
const byId=new Map(profiles.records.map(p=>[p.id,p]));
if(data.counts.total!==profiles.records.length||data.profiles.length!==data.counts.linked||data.unresolved.length!==data.counts.unresolved||data.profiles.length+data.unresolved.length!==data.counts.total)throw Error('inconsistent bridge coverage');
if(data.counts.verifiedLegacy!==profiles.verifiedSourceCount||data.counts.provisionalLegacy!==profiles.provisionalCount)throw Error('legacy provenance drift');
const seen=new Set();
for(const e of [...data.profiles,...data.unresolved]){
 if(seen.has(e.localId))throw Error('duplicate local id '+e.localId);
 seen.add(e.localId);
 const p=byId.get(e.localId);if(!p||p.name!==e.localName||p.sourceVerification!==e.sourceVerification)throw Error('profile mismatch '+e.localId);
 for(const forbidden of ['hp','damage','attack','movement','armor','agility','technique','stats'])if(Object.hasOwn(e,forbidden))throw Error('sport stats leaked into registry '+e.localId);
}
for(const e of data.profiles){if(!e.identityId||!e.identityName||!e.qualifier||!Array.isArray(e.sources))throw Error('unverifiable identity '+e.localId);for(const s of e.sources)if(!s.repository||!s.path||!s.blobSha)throw Error('source ref incomplete '+e.localId);}
for(const e of data.unresolved)if(!e.reason||e.reason.length<20)throw Error('unresolved reason missing '+e.localId);
if(data.historicalBuild.completeSourceImported!==false||data.historicalBuild.hashVerified!==false)throw Error('historical original falsely declared restored');
console.log('OK unified bridge: '+data.counts.linked+' linked, '+data.counts.unresolved+' unresolved, '+data.counts.total+' profiles.');
