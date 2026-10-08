import test from 'node:test';
import assert from 'node:assert/strict';
import { ticketUrl, availableFirstNames } from '../supabase/functions/bima-ux-preview/invitation-extras.ts';
test('billetterie : HTTPS public, suppression et rejet des liens dangereux',()=>{
  assert.equal(ticketUrl(' https://example.com/tickets?q=1 '),'https://example.com/tickets?q=1');
  assert.equal(ticketUrl(''),null);
  for(const url of ['javascript:alert(1)','http://example.com','https://name:pass@example.com','https://127.0.0.1','https://localhost']) assert.throws(()=>ticketUrl(url));
});
test('les prénoms publics correspondent uniquement aux oui de cette date',()=>{
  const people=[{name:'Camille Martin',answers:{a:true,b:false}},{name:'Léa',answers:{b:true}},{name:'Absent',answers:{a:false}}];
  assert.equal(availableFirstNames(false,people,'a'),undefined);
  assert.deepEqual(availableFirstNames(true,people,'a'),['Camille']);
  assert.deepEqual(availableFirstNames(true,people,'b'),['Léa']);
  assert.deepEqual(availableFirstNames(true,people,'new'),[]);
});
