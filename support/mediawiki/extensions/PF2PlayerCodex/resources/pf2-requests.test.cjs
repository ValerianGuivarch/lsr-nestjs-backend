const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

async function main() {
  const dom = new JSDOM('<!doctype html><div id="pf2-requests-board"></div>', {
    runScripts: 'outside-only',
    url: 'https://wiki.l7r.fr/wiki/Requ%C3%AAtes',
  });
  const rows = [
    { id: 1, title: 'Demandée', status: 'requested', thread_id: 'thread-1' },
    { id: 4, title: 'À revoir', status: 'in_progress', thread_id: 'thread-4' },
    { id: 6, title: 'À confirmer', status: 'review', thread_id: 'thread-6' },
    { id: 8, title: 'Terminée', status: 'done', thread_id: 'thread-8' },
  ];
  const posted = [];
  const window = dom.window;
  window.mw = {
    config: { get: () => 'wiki-admin' },
    notify: error => { throw new Error(String(error)); },
    Api: function Api() {
      this.get = async () => ({ pf2requests: rows });
      this.postWithToken = async (kind, payload) => {
        assert.equal(kind, 'csrf');
        assert.equal(payload.action, 'pf2requestsupdate');
        posted.push(payload);
        rows.find(row => row.id === payload.id).status = payload.status;
        return { pf2requestsupdate: { id: payload.id, status: payload.status } };
      };
    },
  };
  const source = fs.readFileSync(path.join(__dirname, 'pf2-requests.js'), 'utf8');
  window.eval(source);
  const yieldToUI = () => new Promise(resolve => setTimeout(resolve, 0));
  await yieldToUI();
  let columns = [...window.document.querySelectorAll('.pf2-requests-column')];
  assert.deepEqual(columns.map(col => col.querySelector('h2').textContent), [
    'Demandé (1)', 'En cours (1)', 'À valider (1)', 'Terminé (1)',
  ]);
  // The first move must render the new state and leave buttons enabled;
  // previously the asynchronous render ran while busy=true, freezing controls.
  const requested = columns[0].querySelector('.pf2-request-card');
  [...requested.querySelectorAll('button')].find(button => button.textContent.includes('À valider')).click();
  await yieldToUI();
  await yieldToUI();
  assert.equal(rows[0].status, 'review');
  columns = [...window.document.querySelectorAll('.pf2-requests-column')];
  const moved = [...columns[2].querySelectorAll('.pf2-request-card')].find(card => card.textContent.includes('#1'));
  assert.ok(moved, 'the request should move to À valider');
  assert.ok([...moved.querySelectorAll('button')].every(button => !button.disabled), 'controls must be enabled after refresh');
  [...moved.querySelectorAll('button')].find(button => button.textContent.includes('Terminé')).click();
  await yieldToUI();
  await yieldToUI();
  assert.equal(rows[0].status, 'done');
  assert.deepEqual(posted.map(p => [p.id, p.status]), [[1, 'review'], [1, 'done']]);
  columns = [...window.document.querySelectorAll('.pf2-requests-column')];
  assert.equal(columns[3].querySelector('h2').textContent, 'Terminé (2)');
  for (const button of window.document.querySelectorAll('button')) assert.equal(button.disabled, false);
  console.log('Kanban four columns, review transition and non-frozen buttons OK');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
