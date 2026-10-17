// Run with: node --env-file=.env.local scripts/check-cloud.mjs http://localhost:3101
import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';

const base = process.argv[2] || 'http://localhost:3000';
const testKey = `kiku-smoke-${Date.now()}`;
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
try {
  let response = await fetch(`${base}/api/progress`);
  assert.equal(response.status, 401);
  const headers = { origin: base, 'content-type': 'application/json' };
  response = await fetch(`${base}/api/session`, { method: 'POST', headers, body: JSON.stringify({ key: 'wrong-key-for-test' }) });
  assert.equal(response.status, 401);
  response = await fetch(`${base}/api/session`, { method: 'POST', headers, body: JSON.stringify({ key: process.env.LOGIN_KEY }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const authenticatedHeaders = { ...headers, cookie };
  response = await fetch(`${base}/api/progress`, { method: 'PATCH', headers: { ...authenticatedHeaders, origin: 'https://other.example' }, body: '{}' });
  assert.equal(response.status, 403);
  response = await fetch(`${base}/api/progress`, { method: 'PATCH', headers: authenticatedHeaders, body: JSON.stringify({ values: { 'invalid.key': 'bad' } }) });
  assert.equal(response.status, 400);
  response = await fetch(`${base}/api/progress`, { method: 'PATCH', headers: authenticatedHeaders, body: JSON.stringify({ values: { [testKey]: '{"completed":true}' } }) });
  assert.equal(response.status, 200);
  response = await fetch(`${base}/api/progress`, { headers: { cookie } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).values[testKey], '{"completed":true}');
  response = await fetch(`${base}/api/session`, { method: 'DELETE', headers: authenticatedHeaders });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/);
  console.log('Cloud smoke check passed: login, authorization, origin, validation, database write/read, logout.');
} finally {
  try {
    await client.connect();
    await client.db('japanese_listening').collection('progress').deleteOne({ account: 'owner', key: testKey });
  } finally { await client.close(); }
}
