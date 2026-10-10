import assert from 'node:assert/strict';
import { chromium } from 'file:///C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

// Explicit opt-in: creates one isolated QA event, disables its notifications,
// and removes it in finally. Direct backend creation avoids a management email.
assert.equal(process.env.BIMA_PRODUCTION_QA, '1');
const site = 'https://bima-app-sigma.vercel.app';
const api = 'https://ebilhzvgvinbpmmpezua.supabase.co/functions/v1/bima-api';
let created;
let browser;
async function call(path, body, method = body ? 'POST' : 'GET', status = 200) {
  const response = await fetch(api + path, {method, headers: {'content-type':'application/json'}, ...(body ? {body:JSON.stringify(body)} : {})});
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify(data));
  return data;
}
try {
  created = await call('/api/events', {title:'QA invitation release', organizerName:'Test', organizerEmail:`qa-release-${Date.now()}@example.com`, maxPlaces:8, budgetEur:20, city:'Paris', places:[{name:'Lieu test',address:'Paris',mapsUrl:''}], dates:[{startsAt:new Date(Date.now()+30*86400000).toISOString()}], ticketUrl:'https://example.com/billets', showAvailableNames:true}, 'POST', 201);
  const path = `/api/events/${created.event.slug}`;
  await call(path+'/notifications', {manageToken:created.manageToken, newResponses:false, reminders:false});
  browser = await chromium.launch({channel:'msedge',headless:true});
  const page = await browser.newPage({viewport:{width:390,height:844}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto(site+'/creer');
  assert.equal(await page.getByPlaceholder('Lien Google Maps (optionnel)').count(),0);
  await page.getByLabel('Nom du lieu de l’étape 1').waitFor();
  await page.getByLabel('Ville de l’étape 1').waitFor();
  assert.equal(await page.getByRole('checkbox',{name:/Montrer les prénoms/}).isChecked(),true);
  await page.goto(site+created.managePath);
  await page.getByRole('button',{name:'Modifier les informations'}).click();
  assert.equal(await page.getByPlaceholder('https://www.google.com/maps/...').count(),0);
  await page.goto(site+created.sharePath);
  await page.getByRole('region',{name:'La sortie en un coup d’œil'}).waitFor();
  assert.equal(await page.locator('.ticket-link').count(),0);
  await page.getByLabel('Ton prénom',{exact:true}).fill('Camille');
  await page.locator('.availability').first().click();
  await page.getByRole('button',{name:/Valider mes réponses/}).click();
  await page.getByRole('heading',{name:/Réponse enregistrée/}).waitFor();
  assert.equal(await page.getByRole('link',{name:/Prends ton billet/}).getAttribute('href'),'https://example.com/billets');
  await page.getByText(/Vérifie la date avant de réserver/).waitFor();
  for (const width of [320,390,1280]) {
    await page.setViewportSize({width,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  const publicData=await call(path);
  assert.deepEqual(publicData.event.dates[0].availableNames,['Camille']);
  assert(!JSON.stringify(publicData).includes(created.manageToken));
  assert.equal(publicData.voters,undefined);
  const absent=await browser.newPage();
  await absent.goto(site+created.sharePath);
  await absent.getByLabel('Ton prénom',{exact:true}).fill('Indisponible');
  await absent.getByRole('button',{name:/Valider mes réponses/}).click();
  await absent.getByRole('heading',{name:/Réponse enregistrée/}).waitFor();
  assert.equal(await absent.locator('.ticket-link').count(),0);
  const update={title:created.event.title,maxPlaces:8,budgetEur:20,responseDeadline:null,places:created.event.places,dates:created.event.dates,ticketUrl:'https://example.com/billets',showAvailableNames:false};
  await call(path, update, 'PATCH', 403);
  await call(path, {...update,manageToken:created.manageToken}, 'PATCH');
  assert.equal((await call(path)).event.dates[0].availableNames,undefined);
  await call(path+'/confirm',{manageToken:created.manageToken,dateId:created.event.dates[0].id});
  await absent.reload();
  await absent.getByRole('link',{name:/Ajouter au calendrier/}).waitFor();
  assert.equal(await absent.getByRole('link',{name:/Voir les billets/}).getAttribute('href'),'https://example.com/billets');
  assert.equal((await fetch(site+path+'/calendar')).status,200);
  assert.equal((await fetch(site+'/preview/idees')).status,404);
  assert.deepEqual(errors,[]);
  console.log('Production verified: default checkbox, summary, positive/negative vote, ticket timing, names/privacy, authorized editing, confirmation, calendar, responsive saved page, prototype 404.');
} finally {
  if (created?.manageToken) await call(`/api/events/${created.event.slug}/delete`,{manageToken:created.manageToken});
  await browser?.close();
  console.log('QA event deleted.');
}
