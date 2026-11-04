const assert = require('node:assert/strict')
const { test } = require('node:test')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { JSDOM } = require('jsdom')

test('admin XP page totals live notes without writing sessions or making Discord requests', async () => {
    const dom = new JSDOM('<!doctype html><div id="pf2-xp-aid" data-session-id="session-3"></div>', {
        url: 'https://wiki.l7r.fr/wiki/Special:PF2SessionXp?session=session-3',
    })
    const calls = []
    const payload = {
        sessionId: 'session-3', sessionNumber: 3, sessionTitle: 'Une séance de test',
        participants: [
            { name: 'A', level: 2, currentThreshold: 300, nextThreshold: 900, xpToNextLevelBand: 600 },
            { name: 'B', level: 2, currentThreshold: 300, nextThreshold: 900, xpToNextLevelBand: 600 },
            { name: 'C', level: 3, currentThreshold: 900, nextThreshold: 2700, xpToNextLevelBand: 1800 },
            { name: 'D', level: 3, currentThreshold: 900, nextThreshold: 2700, xpToNextLevelBand: 1800 },
        ],
        participantCount: 4, averageLevel: 2.5, totalLevelBands: 4800, sessionsPerLevelTarget: 2.5,
        targetGroupXp: 1920, targetXpPerPlayer: 480,
        treasure: {
            source: 'PF2 GM Core, table 10-9', sessionsPerLevel: 2.5,
            partySize: 4, partySizeFactor: 1, currencyBudgetGp: 38,
            totalBudgetGp: 160, equipmentBudgetGp: 122,
            currencyPerPlayerGp: 9.5, totalPerPlayerGp: 40,
            unsupportedLevels: [], participants: [],
        },
    }
    const mw = {
        Api: class { get(args) { calls.push(args); return Promise.resolve({ pf2sessionxp: payload }) } },
        config: { get(name) { return name === 'wgUserId' ? 23 : null } },
        log: { warn() {} },
    }
    const sandbox = { window: dom.window, document: dom.window.document, sessionStorage: dom.window.sessionStorage, mw, Intl, console }
    const dir = __dirname
    vm.runInNewContext(fs.readFileSync(path.join(dir, 'pf2-session-xp-calc.js'), 'utf8'), sandbox)
    vm.runInNewContext(fs.readFileSync(path.join(dir, 'pf2-session-xp.js'), 'utf8'), sandbox)
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(Array.from(calls.map(call => call.action)), ['pf2sessionxp'])
    assert.equal(calls[0].id, 'session-3')
    const root = dom.window.document.getElementById('pf2-xp-aid')
    assert.match(root.textContent, /1.920|1 920|1 920/)
    assert.equal(root.querySelectorAll('.pf2-xp-participants tbody tr').length, 4)
    const textarea = root.querySelector('textarea')
    textarea.value = 'Gnome sauvé : 30xp\nBoss vaincu : 2000 XP\nBandits 12po 5pa\nObjet : potion de soins (4po)\nPotion : objet trouvé'
    textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
    assert.match(root.querySelector('[data-total]').textContent, /2.030|2 030|2 030/)
    assert.equal(root.querySelector('[data-per-player]').textContent.replace(/[^\d,.]/g, ''), '507,5')
    assert.match(root.querySelector('[data-comment]').textContent, /Au-dessus du budget/)
    assert.equal(root.querySelector('[data-treasure-cash]').textContent, '12,5 po')
    assert.equal(root.querySelector('[data-treasure-equipment]').textContent, '4 po')
    assert.equal(root.querySelector('[data-treasure-combined]').textContent, '16,5 po')
    assert.equal(root.querySelector('[data-treasure-items]').textContent, '2')
    assert.match(root.querySelector('[data-treasure-comment]').textContent, /total incomplet/)
    assert.match(root.querySelector('.pf2-xp-treasure-targets').textContent, /160 po/)
    assert.match(root.querySelector('.pf2-xp-treasure-targets').textContent, /38 po/)
    assert.equal(root.querySelector('[data-treasure-cash-progress]').value, 12.5)
    assert.equal(root.querySelector('[data-treasure-total-progress]').value, 16.5)

    assert.match(dom.window.sessionStorage.getItem('pf2-session-xp-aid:23:session-3'), /Boss vaincu/)
    assert.equal(calls.length, 1, 'writing text must never trigger any request')
    dom.window.close()
})
