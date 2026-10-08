import assert from 'node:assert/strict';
const base = 'https://msmnpgoggvogslvkfgwu.supabase.co/functions/v1/bima-ux-preview';
const created=[];
async function call(path,body,method=body?'POST':'GET',expected=200){
 const response=await fetch(base+path,{method,headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const json=await response.json(); assert.equal(response.status,expected,JSON.stringify(json)); return json;
}
const day=(offset)=>new Date(Date.now()+offset*86400000).toISOString();
const draft={title:'QA invitation extras',organizerName:'Organisateur Test',organizerEmail:`qa-${Date.now()}@example.com`,city:'Paris',maxPlaces:8,budgetEur:30,eventType:'outing',places:[{name:'Lieu test',address:'Paris',mapsUrl:''}],dates:[{startsAt:day(15)},{startsAt:day(16)}],ticketUrl:'https://example.com/billets',showAvailableNames:true};
try{
 await call('/api/events',{...draft,ticketUrl:'javascript:alert(1)'},'POST',400);
 const event=await call('/api/events',draft,'POST',201); created.push(event);
 const slug=event.event.slug; const [a,b]=event.event.dates;
 assert.equal(event.event.ticketUrl,draft.ticketUrl);
 const vote=await call(`/api/events/${slug}/votes`,{name:'Camille Martin',availableDateIds:[a.id]});
 let publicData=await call(`/api/events/${slug}`);
 assert.deepEqual(publicData.event.dates[0].availableNames,['Camille']);
 assert.deepEqual(publicData.event.dates[1].availableNames,[]);
 for(const field of ['voters','me','notificationPreferences','manageToken','organizerEmail']) assert.equal(publicData[field],undefined,field);
 const serialized=JSON.stringify(publicData); assert(!serialized.includes(draft.organizerEmail)); assert(!serialized.includes('Camille Martin')); assert(!serialized.includes(vote.participantToken));
 const update={title:draft.title,maxPlaces:8,budgetEur:30,responseDeadline:null,places:event.event.places,dates:event.event.dates,ticketUrl:'https://example.com/nouveau',showAvailableNames:false};
 await call(`/api/events/${slug}`,update,'PATCH',403);
 await call(`/api/events/${slug}`,{...update,manageToken:event.manageToken},'PATCH');
 publicData=await call(`/api/events/${slug}`); assert.equal(publicData.event.ticketUrl,update.ticketUrl); assert.equal(publicData.event.dates[0].availableNames,undefined);
 await call(`/api/events/${slug}`,{...update,ticketUrl:'',manageToken:event.manageToken},'PATCH');
 assert.equal((await call(`/api/events/${slug}`)).event.ticketUrl,null);
 await call(`/api/events/${slug}/confirm`,{manageToken:event.manageToken,dateId:a.id});
 assert.equal((await call(`/api/events/${slug}`)).event.status,'confirmed');
 const legacy=await call('/api/events',{...draft,organizerEmail:`legacy-${Date.now()}@example.com`,ticketUrl:undefined,showAvailableNames:undefined,eventType:'stay',dates:[{startsAt:day(18),endsAt:day(20)}]},'POST',201); created.push(legacy);
 assert.equal(legacy.event.showAvailableNames,false); assert.equal(legacy.event.ticketUrl,null);
 console.log('Intégration base Preview OK : création, vote, filtrage public, refus non autorisé, modification/suppression billet, confirmation, séjour sans nouveaux champs.');
}finally{
 for(const event of created) await call(`/api/events/${event.event.slug}/delete`,{manageToken:event.manageToken});
 console.log('Sorties de test supprimées via leur accès organisateur.');
}
