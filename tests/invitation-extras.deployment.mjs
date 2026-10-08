import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const cli='C:/Users/ASUS/AppData/Local/pnpm-cache/dlx/0e538cc369833fac927062ae41a04b0f/pkg/node_modules/vercel/dist/index.js';
const deployment='https://bima-7gcoh0dcq-bima6.vercel.app';
const draft={title:'QA invitation extras',organizerName:'Test',organizerEmail:`deployment-${Date.now()}@example.com`,city:'Paris',maxPlaces:8,budgetEur:30,places:[{name:'Lieu test',address:'Paris',mapsUrl:''}],dates:[{startsAt:new Date(Date.now()+25*86400000).toISOString()}],ticketUrl:'https://example.com/billets',showAvailableNames:true};
let created;
try {
 const raw=execFileSync(process.execPath,[cli,'curl','/api/events','--deployment',deployment,'--','--silent','-X','POST','-H','content-type: application/json','--data',JSON.stringify(draft)],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
 created=JSON.parse(raw);
 assert(created.manageToken,JSON.stringify(created));
 assert.equal(created.emailSent,false);
 assert.equal(created.event.ticketUrl,draft.ticketUrl);
 const r=await fetch(`https://msmnpgoggvogslvkfgwu.supabase.co/functions/v1/bima-ux-preview/api/events/${created.event.slug}`);
 const saved=await r.json(); assert.equal(saved.event.showAvailableNames,true);
 console.log('Déploiement protégé : création réelle via Vercel OK, donnée vérifiée dans Preview BIMA, email non envoyé.');
} finally {
 if(created?.manageToken){const r=await fetch(`https://msmnpgoggvogslvkfgwu.supabase.co/functions/v1/bima-ux-preview/api/events/${created.event.slug}/delete`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({manageToken:created.manageToken})}); assert.equal(r.status,200);}
}
