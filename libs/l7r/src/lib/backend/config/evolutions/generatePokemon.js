"use strict";
exports.__esModule = true;
var jsdom_1 = require("jsdom");
var fs_1 = require("fs");
// Read the HTML content from the file
var html = fs_1["default"].readFileSync('ListP.html', 'utf-8');
var dom = new jsdom_1.JSDOM(html);
var document = dom.window.document;
var rows = document.querySelectorAll('tr');
var results = [];
rows.forEach(function (row) {
    var nameTag = row.querySelector('td[height="50px"]');
    if (nameTag) {
        var anchor = nameTag.querySelector('a');
        if (anchor) {
            var name_1 = anchor.textContent || '';
            var url = anchor.getAttribute('href') || '';
            results.push({ name: name_1, url: url });
        }
    }
});
console.log(results);
