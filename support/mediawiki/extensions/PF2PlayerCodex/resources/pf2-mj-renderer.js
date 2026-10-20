(function () {
'use strict';
function render(text, root) {
root.textContent = '';
const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
let i = 0;
function inline(value, node) {
const re = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`)/g;
let match, at = 0;
while ((match = re.exec(value))) {
node.appendChild(document.createTextNode(value.slice(at, match.index)));
const el = document.createElement(match[2] ? 'a' : match[4] ? 'strong' : match[5] ? 'em' : 'code');
el.textContent = match[2] || match[4] || match[5] || match[6];
if (match[2]) {
const url = match[3].trim();
if (/^https?:\/\//i.test(url) || /^\.{1,2}\//.test(url)) {
el.href = /^https?:\/\//i.test(url) ? url : new URL(url, 'https://github.com/ValerianGuivarch/lsr-nestjs-backend/blob/main/pf2/pj/').href;
el.target = '_blank'; el.rel = 'noopener noreferrer';
} else { el.textContent = match[2] + ' (' + url + ')'; }
}
node.appendChild(el); at = re.lastIndex;
}
node.appendChild(document.createTextNode(value.slice(at)));
}
function add(tag, text, parent) {
const el = document.createElement(tag);
inline(text, el); (parent || root).appendChild(el); return el;
}
function cells(line) { return /^\s*\|/.test(line) ? line.trim().replace(/^\||\|$/g, '').split('|') : null; }
while (i < lines.length) {
const line = lines[i]; let m;
if (!line.trim()) { i++; continue; }
m = /^(#+) +(.+)/.exec(line);
if (m && m[1].length <= 6) { add('h' + Math.min(6, m[1].length + 1), m[2]); i++; continue; }
if (/^\s*(---+|___+|\*\*\*+)\s*$/.test(line)) { root.appendChild(document.createElement('hr')); i++; continue; }
if ((m = /^\s*(```+|~~~+)/.exec(line))) {
const code = [], fence = m[1].slice(0,3); i++;
while (i < lines.length && !lines[i].trim().startsWith(fence)) code.push(lines[i++]);
if (i < lines.length) i++;
const pre = document.createElement('pre'), el = document.createElement('code');
el.textContent = code.join('\n'); pre.appendChild(el); root.appendChild(pre); continue;
}
const head = cells(line), sep = i + 1 < lines.length ? cells(lines[i + 1]) : null;
if (head && sep && head.length === sep.length && sep.every(x => /^\s*:?-+:?\s*$/.test(x))) {
const table = document.createElement('table');
function row(parts, header) {
const tr = document.createElement('tr');
parts.forEach(x => add(header ? 'th' : 'td', x.trim(), tr));
table.appendChild(tr);
}
row(head, true); i += 2;
while (i < lines.length && cells(lines[i])) row(cells(lines[i++]), false);
root.appendChild(table); continue;
}
if (/^\s*>/.test(line)) {
const quote = [], block = document.createElement('blockquote');
while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ''));
inline(quote.join(' '), block); root.appendChild(block); continue;
}
m = /^\s*([-*+]|[0-9]+[.)])\s+/.exec(line);
if (m) {
const ordered = /[0-9]/.test(m[1][0]), list = document.createElement(ordered ? 'ol' : 'ul');
while (i < lines.length) {
const item = /^\s*([-*+]|[0-9]+[.)])\s+(.*)/.exec(lines[i]);
if (!item || /[0-9]/.test(item[1][0]) !== ordered) break;
add('li', item[2], list); i++;
}
root.appendChild(list); continue;
}
const parts = [];
while (i < lines.length && lines[i].trim() && (!parts.length || !/^\s*(#|>|[-*+] |[0-9]+[.)] |\||```|~~~)/.test(lines[i]))) {
parts.push(lines[i++].trim());
}
if (!parts.length) parts.push(lines[i++]);
add('p', parts.join(' '));
}
}
mw.pf2MjRender = render;
}());
