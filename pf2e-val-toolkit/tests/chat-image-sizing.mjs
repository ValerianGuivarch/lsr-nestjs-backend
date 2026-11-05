import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const css = readFileSync(new URL('../styles/private-roll-names.css', import.meta.url), 'utf8');
const dom = new JSDOM(`<!doctype html>
<style>${css}</style>
<article class="chat-message">
  <header class="message-header">
    <div class="pf2e-val-private-roll-portrait"><img id="portrait" src="portrait.png"></div>
  </header>
  <div class="message-content">
    <img id="direct" src="wide.jpg" width="1800" height="900">
    <p><img id="paragraph" src="wide.jpg" width="1800" height="900"></p>
    <p><a href="wide.jpg"><img id="linked" src="wide.jpg"></a></p>
    <figure><img id="figure" src="wide.jpg"></figure>
    <div class="dice-roll"><img id="dice-icon" src="dice.png"></div>
    <div class="pf2e-card"><img id="card-icon" src="icon.png"></div>
  </div>
</article>`);

const { document } = dom.window;
const style = (id) => dom.window.getComputedStyle(document.getElementById(id));
for (const id of ['direct', 'paragraph', 'linked', 'figure']) {
  assert.equal(style(id).width, 'auto', `${id}: must adapt to the chat width`);
  assert.equal(style(id).height, 'auto', `${id}: must preserve the image's proportions`);
  assert.equal(style(id).maxWidth, '100%', `${id}: must not overflow the chat`);
  assert.equal(style(id).objectFit, 'contain', `${id}: must not crop the image`);
}
assert.equal(style('portrait').objectFit, 'cover', 'keep the portrait crop in chat headers');
for (const id of ['dice-icon', 'card-icon']) {
  assert.notEqual(style(id).objectFit, 'contain', `${id}: do not change embedded UI icons`);
}
assert.match(css, /width:\s*auto\s*!important/);
assert.match(css, /height:\s*auto\s*!important/);
assert.match(css, /object-fit:\s*contain\s*!important/);
console.log('Chat image containment and icon exclusion OK');
