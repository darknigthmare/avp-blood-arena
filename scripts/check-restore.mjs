import fs from 'node:fs';
import { createHash } from 'node:crypto';
const dir=new URL('../play/v0.36/',import.meta.url);
const file=new URL('index.html',dir),proof=new URL('provenance.json',dir);
if(fs.existsSync(file)!==fs.existsSync(proof))throw Error('Unpaired original game / provenance evidence');
if(fs.existsSync(file)){
 const bytes=fs.readFileSync(file),p=JSON.parse(fs.readFileSync(proof,'utf8'));
 if(bytes.length!==16545313||p.bytes!==bytes.length||p.version!=='0.36'||p.restoredFromFullBytes!==true)throw Error('Original build does not match archive proof');
 if(createHash('sha256').update(bytes).digest('hex')!==p.sha256)throw Error('Original source SHA-256 mismatch');
 console.log('OK original 0.36 verified.');
}else console.log('Original 0.36 absent: reconstruction correctly identified, no false restore claim.');
