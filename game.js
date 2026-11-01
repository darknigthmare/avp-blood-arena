const W=24,H=14,CELL=42;
const canvas=document.getElementById('field'),ctx=canvas.getContext('2d');
const byId=id=>document.getElementById(id);
const FACTIONS={
 uscm:{name:'COLONIAL MARINES',color:'#68cddd',kind:'human'},
 hive:{name:'RUCHE XÉNOMORPHE',color:'#a9cf75',kind:'xenomorph'},
 yautja:{name:'CLAN YAUTJA',color:'#e9b66e',kind:'yautja'},
 corporate:{name:'WEYLAND-YUTANI',color:'#e5cb7d',kind:'human'},
 bad_blood:{name:'BAD BLOOD',color:'#d9858d',kind:'yautja'},
 synthetics:{name:'SYNTHÉTIQUES',color:'#a1c6e2',kind:'synthetic'},
 penal:{name:'COLONIE PÉNALE',color:'#d7a88a',kind:'human'},
 cult:{name:'CULTE DE LA RUCHE',color:'#c39dd7',kind:'human'},
 black_lab:{name:'LABORATOIRE NOIR',color:'#d78ca5',kind:'xenomorph'}
};
const FALLBACK={
 corporate:{id:'prototype_corporate',name:'Agent de sécurité',entityId:'faction.weyland_yutani',stats:{movement:5,hp:9,strength:3,agility:3,technique:3,armor:1}},
 bad_blood:{id:'prototype_bad_blood',name:'Chasseur renégat',entityId:'species.yautja',stats:{movement:6,hp:11,strength:4,agility:3,technique:2,armor:1}},
 synthetics:{id:'prototype_synthetic',name:'Unité synthétique',entityId:'character.bishop',stats:{movement:5,hp:11,strength:3,agility:2,technique:5,armor:1}}
};
let unifiedBridge=null;
let catalog=null,profiles=null,crossGame=null,match=null,selected=null,intent='move',busy=false;
const storeKey='avp-blood-arena-bridge-0.1';
function safeSave(s){try{localStorage.setItem(storeKey,JSON.stringify(s));}catch(_e){}}
function safeLoad(){try{const t=JSON.parse(localStorage.getItem(storeKey)||'{}');return {played:Math.max(0,Number(t.played)||0),won:Math.max(0,Number(t.won)||0)};}catch(_e){return {played:0,won:0};}}
let career=safeLoad();
function scoreStats(){byId('playedCount').textContent=career.played;byId('winCount').textContent=career.won;}
function msg(s){const p=document.createElement('p');p.textContent=s;byId('log').prepend(p);while(byId('log').children.length>10)byId('log').lastChild.remove();}
function stageObstacles(id){
 if(id==='hive')return [[8,3],[8,4],[8,9],[8,10],[15,3],[15,4],[15,9],[15,10],[11,1],[12,12]];
 if(id==='temple')return [[7,2],[7,11],[16,2],[16,11],[10,4],[10,9],[13,4],[13,9]];
 return [[8,2],[8,11],[15,2],[15,11],[10,3],[13,10],[10,10],[13,3]];
}
function makeRoster(key,side){
 const originals=profiles.records.filter(r=>r.faction===key),spec=FACTIONS[key],entries=originals.length?originals:[FALLBACK[key]];
 const ys=[2,5,8,11];
 return ys.map((y,i)=>{const e=entries[i%entries.length],s=e.stats;return {uid:side+'-'+i,side,slot:i,id:e.id,name:e.name,entityId:e.entityId,species:spec.kind,x:side?21:2,y,hp:s.hp,maxHp:s.hp,stats:{...s},ap:2,stun:0,respawn:0,prototype:!originals.length||e.sourceVerification!=='verified_indexed_source_fragment',ability:(e.abilities||[])[0]||'defend'};});
}
function startMatch(){
 const left=byId('teamPick').value,right=byId('opponentPick').value,arena=byId('arenaPick').value,mode=byId('modePick').value;
 match={left,right,arena,mode,units:[...makeRoster(left,0),...makeRoster(right,1)],blocked:stageObstacles(arena),ball:{x:11,y:6,holder:null},scores:[0,0],side:0,round:1,finished:false};
 selected=null;intent='move';busy=false;byId('menu').hidden=true;byId('match').hidden=false;byId('banner').hidden=true;byId('log').replaceChildren();msg('Déploiement sur '+byId('arenaPick').selectedOptions[0].textContent+'.');msg('Récupérez le Nexus au centre. 3 buts pour gagner.');if(match.units.some(u=>u.prototype))msg('AVERTISSEMENT : profils provisoires non certifiés par le fichier v0.30 ; la relance n est pas la version historique.');refresh();
}
function at(x,y){return match.units.find(u=>u.hp>0&&u.x===x&&u.y===y)||null;}
function blocked(x,y){return x<0||x>=W||y<0||y>=H||match.blocked.some(p=>p[0]===x&&p[1]===y);}
const steps=[[1,0],[-1,0],[0,1],[0,-1]];
function neighbors(p){return steps.map(s=>({x:p.x+s[0],y:p.y+s[1]}));}
function manh(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
function reachable(u,maxSteps){
 const result=new Map(),key=(x,y)=>x+','+y,q=[{x:u.x,y:u.y,d:0}];result.set(key(u.x,u.y),q[0]);
 for(let i=0;i<q.length;i++){const n=q[i];if(n.d>=maxSteps)continue;for(const v of neighbors(n)){const k=key(v.x,v.y);if(result.has(k)||blocked(v.x,v.y)||(at(v.x,v.y)&&!(v.x===u.x&&v.y===u.y)))continue;const next={...v,d:n.d+1};result.set(k,next);q.push(next);}}
 return result;
}
function myTurn(){return match&&!match.finished&&!busy&&(match.mode==='local'||match.side===0);}
function active(u){return u&&u.hp>0&&u.side===match.side&&u.ap>0&&u.stun===0;}
function setSelected(u){selected=u&&active(u)?u:null;intent='move';refresh();}
function ballOwner(){return match.units.find(u=>u.uid===match.ball.holder)||null;}
function pickup(u){if(!match.ball.holder&&match.ball.x===u.x&&match.ball.y===u.y){match.ball.holder=u.uid;msg(u.name+' a récupéré le Nexus.');}}
function score(side){match.scores[side]++;msg('BUT ! '+FACTIONS[side===0?match.left:match.right].name+'.');if(match.scores[side]>=3){finish();return;}resetKickoff();}
function resetKickoff(){
 const ys=[2,5,8,11];for(const u of match.units){u.x=u.side?21:2;u.y=ys[u.slot];u.hp=u.maxHp;u.stun=0;u.respawn=0;u.ap=2;}
 match.ball={x:11,y:6,holder:null};match.side=0;selected=null;intent='move';byId('banner').hidden=true;refresh();
}
function checkGoal(u){if(match.ball.holder!==u.uid)return;if((u.side===0&&u.x>=W-2&&u.y>=5&&u.y<=8)||(u.side===1&&u.x<=1&&u.y>=5&&u.y<=8))score(u.side);}
function moveUnit(u,cell){
 if(!active(u))return false;
 const max=Math.max(1,Math.floor(u.stats.movement/2)),r=reachable(u,max),found=r.get(cell.x+','+cell.y);
 if(!found||found.d===0)return false;
 u.x=cell.x;u.y=cell.y;u.ap--;pickup(u);checkGoal(u);return true;
}
function hit(u,v,boost=0){
 if(!active(u)||v.side===u.side||v.hp<=0)return false;
 const range=boost?3:1;if(manh(u,v)>range)return false;
 const damage=Math.max(1,Math.ceil(u.stats.strength/2)+boost-v.stats.armor);
 v.hp=Math.max(0,v.hp-damage);u.ap--;
 msg(u.name+' neutralise '+v.name+' : '+damage+' dégâts.');
 if(v.hp===0){v.respawn=2;if(match.ball.holder===v.uid){match.ball={x:v.x,y:v.y,holder:null};msg('Nexus lâché !');}msg(v.name+' hors circuit : retour après deux manches.');}
 return true;
}
function passBall(u,target){
 if(!active(u)||match.ball.holder!==u.uid||target.side!==u.side||target.uid===u.uid||target.hp<=0||manh(u,target)>7)return false;
 match.ball.holder=target.uid;match.ball.x=target.x;match.ball.y=target.y;u.ap--;msg(u.name+' transmet le Nexus à '+target.name+'.');checkGoal(target);return true;
}
function special(u,target){
 if(!active(u))return false;
 const faction=u.side===0?match.left:match.right;
 if((faction==='yautja'||faction==='bad_blood')&&target&&target.side!==u.side&&target.hp>0&&manh(u,target)<=3){target.stun=1;u.ap--;msg(u.name+' immobilise '+target.name+'.');return true;}
 if((faction==='uscm'||faction==='corporate'||faction==='synthetics')&&target&&target.side!==u.side&&target.hp>0){return hit(u,target,1);}
 if((faction==='hive'||faction==='black_lab')&&target&&target.side!==u.side&&target.hp>0&&manh(u,target)<=2){return hit(u,target,1);}
 if(!target||target.uid===u.uid){u.hp=Math.min(u.maxHp,u.hp+2);u.ap--;msg(u.name+' se met en position défensive (+2 endurance).');return true;}
 return false;
}
function afterAction(){refresh();if(match&&!match.finished&&!busy&&match.units.filter(u=>u.side===match.side).every(u=>u.ap===0||u.hp===0||u.stun>0))queueMicrotask(endTurn);}
function onCell(x,y){
 if(!myTurn()||blocked(x,y))return;
 const target=at(x,y);if(target&&target.side===match.side&&intent!=='special'&&intent!=='pass'){setSelected(target);return;}
 if(!selected||!active(selected))return;
 let ok=false;
 if(intent==='pass'){if(target&&target.side===match.side)ok=passBall(selected,target);}
 else if(intent==='special'){ok=special(selected,target||((selected.x===x&&selected.y===y)?selected:null));}
 else if(target&&target.side!==match.side)ok=hit(selected,target);
 else if(!target)ok=moveUnit(selected,{x,y});
 if(!ok){msg('Action impossible : portée, Nexus ou case invalide.');}
 intent='move';if(selected&&selected.ap===0)selected=null;afterAction();
}
function onCanvas(ev){
 const r=canvas.getBoundingClientRect(),x=Math.floor((ev.clientX-r.left)/r.width*W),y=Math.floor((ev.clientY-r.top)/r.height*H);
 if(x>=0&&x<W&&y>=0&&y<H)onCell(x,y);
}
function refresh(){
 if(!match)return;
 byId('leftName').textContent=FACTIONS[match.left].name;byId('rightName').textContent=FACTIONS[match.right].name;
 byId('scoreLeft').textContent=match.scores[0];byId('scoreRight').textContent=match.scores[1];
 byId('roundNumber').textContent='MANCHE '+match.round+' / 16';
 byId('turnLabel').textContent='TOUR : '+FACTIONS[match.side===0?match.left:match.right].name;
 const owner=ballOwner();byId('ballLabel').textContent=owner?'NEXUS : '+owner.name.toUpperCase():'NEXUS LIBRE';
 byId('modeLabel').textContent=match.mode==='ai'?'CONTRE IA':'2 JOUEURS LOCAUX';
 for(const id of ['actionMove','actionPass','actionSpecial'])byId(id).disabled=!myTurn()||!active(selected);
 byId('endTurn').disabled=!myTurn();byId('actionMove').classList.toggle('active',intent==='move');
 byId('actionPass').classList.toggle('active',intent==='pass');byId('actionSpecial').classList.toggle('active',intent==='special');
 byId('selectionHelp').textContent=selected?'Clique une case, un adversaire ou sélectionne une technique.':'Sélectionne une unité de l’équipe active.';
 if(selected){byId('unitCard').textContent='';const h=document.createElement('strong'),em=document.createElement('em'),p=document.createElement('div');h.textContent=selected.name;em.textContent=selected.prototype?'PROFIL PROVISOIRE — DONNÉES V0.30 NON CERTIFIÉES':'PROFIL RELU DANS LES EXTRAITS V0.30';p.textContent='PV '+selected.hp+'/'+selected.maxHp+' · PA '+selected.ap+' · FOR '+selected.stats.strength+' · ARM '+selected.stats.armor+' · MOB '+selected.stats.movement;byId('unitCard').append(h,em,p);}
 else byId('unitCard').textContent='Aucune unité sélectionnée.';render();
}
function drawShape(u,x,y){
 ctx.save();ctx.translate(x,y);ctx.fillStyle=FACTIONS[u.side===0?match.left:match.right].color;ctx.strokeStyle=u.side===0?'#e8ffff':'#ffd7d7';ctx.lineWidth=1.4;
 ctx.beginPath();if(u.species==='xenomorph'){ctx.moveTo(0,-14);ctx.lineTo(13,9);ctx.lineTo(0,4);ctx.lineTo(-13,9);}
 else if(u.species==='yautja'){ctx.moveTo(-12,-12);ctx.lineTo(12,-12);ctx.lineTo(11,9);ctx.lineTo(0,14);ctx.lineTo(-11,9);}
 else if(u.species==='synthetic'){ctx.moveTo(0,-14);ctx.lineTo(14,0);ctx.lineTo(0,14);ctx.lineTo(-14,0);}
 else{ctx.arc(0,0,12,0,Math.PI*2);}
 ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#071317';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText((u.slot+1).toString(),0,5);ctx.restore();
}
function render(){
 if(!match)return;
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#0b2029';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const px=x*CELL,py=y*CELL;ctx.fillStyle=(x+y)%2===0?'#15313a':'#132e36';ctx.fillRect(px,py,CELL,CELL);ctx.strokeStyle='#31515a';ctx.lineWidth=.5;ctx.strokeRect(px+.5,py+.5,CELL-1,CELL-1);}
 for(const side of [0,1]){const gx=side===0?0:W-2;ctx.fillStyle=side===0?'#52c8d94d':'#e49c7855';ctx.fillRect(gx*CELL,5*CELL,2*CELL,4*CELL);}
 ctx.strokeStyle='#5a9294';ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(W*CELL/2,0);ctx.lineTo(W*CELL/2,H*CELL);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(W*CELL/2,H*CELL/2,70,0,2*Math.PI);ctx.stroke();
 for(const [x,y] of match.blocked){ctx.fillStyle=match.arena==='hive'?'#456243':match.arena==='temple'?'#706255':'#61737a';ctx.fillRect(x*CELL+3,y*CELL+3,CELL-6,CELL-6);ctx.strokeStyle='#d2d6be';ctx.strokeRect(x*CELL+7,y*CELL+7,CELL-14,CELL-14);}
 if(selected&&active(selected)){const cells=reachable(selected,Math.max(1,Math.floor(selected.stats.movement/2)));for(const p of cells.values()){if(!p.d)continue;ctx.fillStyle='#81d7d42b';ctx.fillRect(p.x*CELL+2,p.y*CELL+2,CELL-4,CELL-4);}ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.strokeRect(selected.x*CELL+2,selected.y*CELL+2,CELL-4,CELL-4);}
 for(const u of match.units){if(u.hp<=0)continue;const px=u.x*CELL+CELL/2,py=u.y*CELL+CELL/2;drawShape(u,px,py);ctx.fillStyle='#060f15';ctx.fillRect(px-14,py+16,28,4);ctx.fillStyle=u.hp/u.maxHp>.5?'#a9d885':'#e6a083';ctx.fillRect(px-14,py+16,28*u.hp/u.maxHp,4);if(u.ap===0){ctx.fillStyle='#0009';ctx.beginPath();ctx.arc(px,py,16,0,Math.PI*2);ctx.fill();}if(u.stun){ctx.fillStyle='#e6e9a1';ctx.font='15px system-ui';ctx.fillText('×',px+11,py-12);}}
 const owner=ballOwner(),bx=owner?owner.x:match.ball.x,by=owner?owner.y:match.ball.y;ctx.beginPath();ctx.arc(bx*CELL+CELL/2,by*CELL+CELL/2,owner?6:11,0,2*Math.PI);ctx.fillStyle='#fff0a0';ctx.shadowColor='#e8ec98';ctx.shadowBlur=17;ctx.fill();ctx.shadowBlur=0;
}
function applyRespawns(side){
 for(const u of match.units.filter(q=>q.side===side)){if(u.hp<=0){u.respawn--;if(u.respawn<=0){u.hp=u.maxHp;u.x=side?21:2;u.y=[2,5,8,11][u.slot];msg(u.name+' revient en jeu.');}}u.ap=u.hp>0?2:0;if(u.stun){u.ap=0;u.stun=0;}}
}
async function endTurn(){
 if(!match||match.finished||busy||!myTurn())return;selected=null;intent='move';
 match.side=1-match.side;if(match.side===0)match.round++;
 if(match.round>16){finish();return;}applyRespawns(match.side);refresh();
 if(match.mode==='ai'&&match.side===1){busy=true;await aiTurn();busy=false;if(!match||match.finished)return;match.side=0;match.round++;if(match.round>16){finish();return;}applyRespawns(0);refresh();}
}
function aiAction(u){
 if(!active(u))return;
 const enemyCarrier=ballOwner(),target=enemyCarrier&&enemyCarrier.side!==1?enemyCarrier:null;
 if(target&&manh(u,target)<=1&&hit(u,target))return;
 if(match.ball.holder===u.uid){const goal={x:0,y:6},cells=[...reachable(u,Math.max(1,Math.floor(u.stats.movement/2))).values()].filter(v=>v.d>0);cells.sort((a,b)=>manh(a,goal)-manh(b,goal));if(cells.length)moveUnit(u,cells[0]);return;}
 const goal=target||ballOwner()||match.ball;const dist=manh(u,goal);if(target&&dist<=1&&hit(u,target))return;
 const cells=[...reachable(u,Math.max(1,Math.floor(u.stats.movement/2))).values()].filter(v=>v.d>0);cells.sort((a,b)=>manh(a,goal)-manh(b,goal)||b.d-a.d);if(cells.length)moveUnit(u,cells[0]);else u.ap=0;
}
async function aiTurn(){
 for(const u of match.units.filter(x=>x.side===1)){for(let n=0;n<2&&active(u)&&!match.finished;n++){aiAction(u);refresh();await new Promise(resolve=>setTimeout(resolve,140));}}
}
function finish(){
 if(!match||match.finished)return;match.finished=true;busy=false;career.played++;if(match.scores[0]>match.scores[1])career.won++;safeSave(career);scoreStats();
 const result=match.scores[0]===match.scores[1]?'MATCH NUL':match.scores[0]>match.scores[1]?'VICTOIRE DES LOCAUX':'VICTOIRE ADVERSE';
 byId('banner').textContent=result+' · '+match.scores.join(' — ')+' · Retour au menu pour rejouer.';byId('banner').hidden=false;msg('Fin de rencontre : '+result+'.');selected=null;refresh();
}
function showModal(id){byId(id).hidden=false;}
function hideModal(id){byId(id).hidden=true;}
function makeCodexEntries(){
 const primary=catalog.entities.map(e=>({id:e.id,group:'central',type:e.type,name:e.name,note:e.notes||'',context:e.canonScope,origin:e.sourceIds.map(id=>catalog.sources[id]?.title||id).join(', ')}));
 const tcg=crossGame.cards.map(c=>({id:c.id,group:'tcg',type:c.type.toLowerCase(),name:c.name,note:c.description||c.flavor||'',context:'CARTE DE JEU · '+c.faction+' · '+c.rarity,origin:'AVP Hunt/Hive TCG'+(c.sharedEntityId?' · Lien '+c.sharedEntityId:''),status:'GAMEPLAY NON CANONIQUE'}));
 const weapons=crossGame.researchWeapons.map(w=>({id:w.id,group:'research',type:'weapon_candidate',name:w.name,note:'Identité ou fidélité non vérifiée. '+(w.medium||''),context:'RESEARCH_ONLY · NON IMPLÉMENTÉ',origin:w.work||'Source à vérifier',status:'CANDIDAT NON CERTIFIÉ'}));
 return [...primary,...tcg,...weapons];
}
function syncCodexTypes(){
 if(!catalog||!crossGame)return;
 const group=byId('codexScope').value,entries=makeCodexEntries().filter(e=>group==='all'||e.group===group);
 const root=byId('codexType');root.replaceChildren();
 const first=document.createElement('option');first.value='all';first.textContent='TOUTES LES CATÉGORIES';root.append(first);
 for(const type of [...new Set(entries.map(e=>e.type))].sort()){const option=document.createElement('option');option.value=type;option.textContent=type.toUpperCase().replaceAll('_',' ');root.append(option);}
 root.value='all';
}
function renderCodex(){
 if(!catalog||!crossGame)return;
 const scope=byId('codexScope').value,type=byId('codexType').value,q=byId('codexQuery').value.trim().toLowerCase();
 const candidate=makeCodexEntries().filter(e=>scope==='all'||e.group===scope);
 const list=candidate.filter(e=>(type==='all'||e.type===type)&&[e.name,e.id,e.note,e.origin,e.context].join(' ').toLowerCase().includes(q));
 byId('codexCount').textContent=list.length+' / '+candidate.length+' fiches · Alien_base / imports vérifiables · '+catalog.version;
 const root=byId('codexItems');root.replaceChildren();
 for(const e of list){const card=document.createElement('article'),kind=document.createElement('small'),title=document.createElement('h3'),note=document.createElement('p'),src=document.createElement('p');
 card.className='codex-card';kind.textContent=e.type.toUpperCase().replaceAll('_',' ')+' · '+e.context;title.textContent=e.name;note.textContent=e.note;src.className='source';src.textContent='SOURCE : '+e.origin+(e.status?' · '+e.status:'');card.append(kind,title,note,src);root.append(card);
 }
}

function renderUnifiedBridge(){
 const root=byId('bridgeProfiles');
 root.replaceChildren();
 if(!unifiedBridge){byId('bridgeCount').textContent='Données du registre en attente de lecture.';return;}
 const counts=unifiedBridge.counts;
 byId('bridgeCount').textContent=counts.linked+' rattachements documentaires · '+counts.unresolved+' identités à documenter · '+counts.verifiedLegacy+' profils v0.30 relus / '+counts.provisionalLegacy+' reconstructions.';
 const entries=[...unifiedBridge.profiles.map(p=>({...p,linked:true})),...unifiedBridge.unresolved.map(p=>({...p,linked:false}))];
 for(const e of entries){
  const card=document.createElement('article'),kind=document.createElement('small'),heading=document.createElement('h3'),note=document.createElement('p'),origin=document.createElement('p');
  card.className='codex-card';
  kind.textContent=e.linked?'IDENTITÉ COMMUNE · '+e.identityCategory.toUpperCase():'RECHERCHE EN COURS · SANS CORRESPONDANCE';
  heading.textContent=e.localName;
  note.textContent=e.linked?e.identityName+' ('+e.identityId+') · '+e.qualifier:e.reason;
  origin.className='source';
  const verification=e.sourceVerification==='verified_indexed_source_fragment'?'FRAGMENT V0.30 RELU':'RECONSTRUCTION NON CERTIFIÉE';
  const references=e.linked?(e.sources||[]).map(s=>s.repository+' · '+s.path+' @'+s.blobSha.slice(0,8)).slice(0,3).join(' / '):'ID LOCAL : '+e.localId;
  origin.textContent=verification+' · '+references;
  card.append(kind,heading,note,origin);
  root.append(card);
 }
}
async function loadUnifiedBridge(){
 try{
  const r=await fetch('./data/alien-base.unified-blood.json');
  if(!r.ok)throw Error('HTTP '+r.status);
  const j=await r.json();
  if(j.consumer!=='avp-blood-arena'||!Array.isArray(j.profiles)||!Array.isArray(j.unresolved))throw Error('format inattendu');
  unifiedBridge=j;
  renderUnifiedBridge();
 }catch(e){
  byId('bridgeCount').textContent='Pont de synchronisation indisponible : '+e.message+'. Le jeu reste jouable avec les instantanés existants.';
 }
}

async function boot(){
 try{
 const res=await Promise.all([fetch('./data/alien-base.snapshot.json'),fetch('./data/blood-arena.profiles.json'),fetch('./data/cross-game-references.json')]);for(const r of res)if(!r.ok)throw Error('HTTP '+r.status);catalog=await res[0].json();profiles=await res[1].json();crossGame=await res[2].json();
 if(!Array.isArray(catalog.entities)||!Array.isArray(profiles.records)||!Array.isArray(crossGame.cards)||!Array.isArray(crossGame.researchWeapons))throw Error('format inattendu');
 byId('dataStatus').textContent=catalog.entities.length+' références, '+profiles.records.length+' profils (4 confirmés, 14 provisoires), '+crossGame.cards.length+' cartes TCG et '+crossGame.researchWeapons.length+' armes à vérifier';
 for(const [key,f] of Object.entries(FACTIONS)){for(const id of ['teamPick','opponentPick']){const opt=document.createElement('option');opt.value=key;opt.textContent=f.name;byId(id).append(opt);}}byId('teamPick').value='uscm';byId('opponentPick').value='hive';
 syncCodexTypes();renderCodex();void loadUnifiedBridge();
 }catch(e){byId('dataStatus').textContent='ERREUR DE LECTURE : '+e.message;byId('startButton').disabled=true;msg('Les fichiers de la base sont inaccessibles.');}
 scoreStats();
}
byId('startButton').addEventListener('click',startMatch);canvas.addEventListener('click',onCanvas);
byId('actionMove').addEventListener('click',()=>{intent='move';refresh();});
byId('actionPass').addEventListener('click',()=>{intent='pass';refresh();});
byId('actionSpecial').addEventListener('click',()=>{intent='special';refresh();});
byId('endTurn').addEventListener('click',endTurn);
byId('menuButton').addEventListener('click',()=>{if(!match||match.finished||confirm('Abandonner le match en cours ?')){match=null;selected=null;byId('match').hidden=true;byId('menu').hidden=false;byId('selectionHelp').textContent='Sélectionne ton équipe et lance une rencontre.';}});
byId('openCodex').addEventListener('click',()=>showModal('codexModal'));byId('closeCodex').addEventListener('click',()=>hideModal('codexModal'));
byId('openHelp').addEventListener('click',()=>showModal('helpModal'));byId('closeHelp').addEventListener('click',()=>hideModal('helpModal'));
byId('openBridge').addEventListener('click',()=>{showModal('bridgeModal');renderUnifiedBridge();});byId('closeBridge').addEventListener('click',()=>hideModal('bridgeModal'));

byId('codexQuery').addEventListener('input',renderCodex);byId('codexType').addEventListener('change',renderCodex);byId('codexScope').addEventListener('change',()=>{syncCodexTypes();renderCodex();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const modal of ['helpModal','codexModal','bridgeModal'])hideModal(modal);}if(e.key===' '&&match&&!match.finished&&['helpModal','codexModal','bridgeModal'].every(id=>byId(id).hidden)&&!['BUTTON','INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();endTurn();}});
boot();