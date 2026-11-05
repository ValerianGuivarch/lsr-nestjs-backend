const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const source = fs.readFileSync(path.join(__dirname, 'pf2-reputations.js'), 'utf8');

function harness(canEdit) {
  const window = new JSDOM(
    '<!doctype html><div id="pf2-reputations"></div>',
    { url: 'https://wiki.l7r.fr/wiki/R%C3%A9putation', runScripts: 'outside-only' },
  ).window;
  const data = {
    groups: [
      {
        id: 1, name: 'Absalom', visible: 1,
        entries: [
          { id: 11, group_id: 1, name: 'Éclaireurs', score: 12, visible: 1,
            modifiers: { 'npc-jilkra': 3, 'npc-eryn': -2 } },
        ],
      },
    ],
    characters: [
      { npcId: 'npc-jilkra', displayName: 'Jilkra (Jupi)' },
      { npcId: 'npc-eryn', displayName: 'Eryn (Tom)' },
    ],
    canEdit,
  };
  const notifications = [], submissions = [], prompts = [];
  window.mw = {
    notify: (message, details) => notifications.push({ message, details }),
    Api: function () {
      this.get = async () => ({ pf2reputations: JSON.parse(JSON.stringify(data)) });
      this.postWithToken = async (tokenType, payload) => {
        assert.equal(tokenType, 'csrf');
        assert.equal(payload.action, 'pf2reputationsupdate');
        submissions.push(JSON.parse(JSON.stringify(payload)));
        const reputation = data.groups[0].entries[0];
        if (payload.operation === 'score') reputation.score = payload.score;
        else if (payload.operation === 'modifier') reputation.modifiers[payload.character] = payload.modifier;
        else throw new Error('Unexpected test operation: ' + payload.operation);
        return { pf2reputationsupdate: { groups: data.groups } };
      };
    },
  };
  window.prompt = (question, current) => {
    assert.ok(prompts.length, 'Unexpected prompt: ' + question);
    const next = prompts.shift();
    assert.ok(question.includes(next.expected), 'Wrong prompt target: ' + question);
    assert.equal(String(current), next.current);
    return next.response;
  };
  window.eval(source);

  return {
    window, document: window.document, data, submissions, prompts, notifications,
    select: id => {
      const sel = window.document.querySelector('#pf2-reputations select');
      sel.value = id;
      sel.dispatchEvent(new window.Event('change', { bubbles: true }));
    },
    buttons: () => [...window.document.querySelectorAll('.pf2-rep-actions button')],
    click: label => {
      const button = [...window.document.querySelectorAll('.pf2-rep-actions button')]
        .find(btn => btn.textContent === label);
      assert.ok(button, 'Missing expected edit button: ' + label);
      button.click();
    },
    // Two microtasks allow async MediaWiki refresh, then the DOM update.
    flush: async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      await new Promise(resolve => setTimeout(resolve, 0));
    },
  };
}

async function test() {
  const admin = harness(true);
  await admin.flush();
  assert.ok(admin.buttons().some(b => b.textContent === 'Modifier le groupe'));
  assert.ok(!admin.buttons().some(b => b.textContent.startsWith('Modifier Jilkra')));
  assert.ok(admin.buttons().some(b => b.textContent === 'Déplacer'));

  // In the character view, both group and personal edits must be available.
  admin.select('npc-jilkra');
  assert.ok(admin.buttons().some(b => b.textContent === 'Modifier le groupe'));
  assert.ok(admin.buttons().some(b => b.textContent === 'Modifier Jilkra (Jupi)'));
  assert.ok(!admin.buttons().some(b => b.textContent === 'Déplacer'));

  admin.prompts.push({ expected: 'du groupe', current: '12', response: '14' });
  admin.click('Modifier le groupe');
  await admin.flush();
  assert.deepEqual(admin.submissions.at(-1), {
    action: 'pf2reputationsupdate', format: 'json',
    operation: 'score', id: 11, score: 14,
  });
  assert.equal(admin.data.groups[0].entries[0].modifiers['npc-jilkra'], 3,
    'Editing the group must not overwrite the personal modifier');
  assert.equal(admin.document.querySelector('#pf2-reputations select').value, 'npc-jilkra');

  admin.prompts.push({ expected: 'Jilkra (Jupi)', current: '17', response: '22' });
  admin.click('Modifier Jilkra (Jupi)');
  await admin.flush();
  assert.deepEqual(admin.submissions.at(-1), {
    action: 'pf2reputationsupdate', format: 'json',
    operation: 'modifier', id: 11, character: 'npc-jilkra', modifier: 8,
  });
  assert.equal(admin.data.groups[0].entries[0].score, 14,
    'Editing a character must not change the group reputation');
  assert.equal(admin.data.groups[0].entries[0].modifiers['npc-eryn'], -2,
    'Editing a character must not change a different character');

  const oldCount = admin.submissions.length;
  admin.prompts.push({ expected: 'Jilkra (Jupi)', current: '22', response: '' });
  admin.click('Modifier Jilkra (Jupi)');
  admin.prompts.push({ expected: 'Jilkra (Jupi)', current: '22', response: '50.5' });
  admin.click('Modifier Jilkra (Jupi)');
  admin.prompts.push({ expected: 'Jilkra (Jupi)', current: '22', response: null });
  admin.click('Modifier Jilkra (Jupi)');
  assert.equal(admin.submissions.length, oldCount,
    'Invalid and canceled edits must not write anything');
  assert.ok(admin.notifications.some(n => n.message.includes('Entier')));

  admin.select('npc-eryn');
  admin.prompts.push({ expected: 'Eryn (Tom)', current: '12', response: '20' });
  admin.click('Modifier Eryn (Tom)');
  await admin.flush();
  assert.equal(admin.data.groups[0].entries[0].modifiers['npc-eryn'], 6);
  assert.equal(admin.data.groups[0].entries[0].modifiers['npc-jilkra'], 8);

  // The existing backend schema limits modifier to [-50, 50]; reject an
  // unattainable target explicitly instead of storing the wrong score.
  admin.select('group');
  admin.prompts.push({ expected: 'du groupe', current: '14', response: '45' });
  admin.click('Modifier le groupe');
  await admin.flush();
  admin.select('npc-jilkra');
  const beforeInvalid = admin.submissions.length;
  admin.prompts.push({ expected: 'Jilkra (Jupi)', current: '50', response: '-30' });
  admin.click('Modifier Jilkra (Jupi)');
  assert.equal(admin.submissions.length, beforeInvalid);
  assert.ok(admin.notifications.some(n => n.message.includes('écarts personnels')));

  // The regular player can see the reputation but never gets write controls.
  const player = harness(false);
  await player.flush();
  assert.equal(player.buttons().length, 0);
  player.select('npc-jilkra');
  assert.equal(player.buttons().length, 0);
  assert.equal(player.document.querySelectorAll('.pf2-rep-card').length, 1);
  assert.equal(player.submissions.length, 0);
  console.log('Wiki reputation editors: MJ group/person editing, permissions and validation OK');
}
test().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
