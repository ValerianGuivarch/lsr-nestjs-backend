import { JSDOM } from 'jsdom'
import fs from 'fs'

// Read the HTML content from the file
const html = fs.readFileSync('ListP.html', 'utf-8')

const dom = new JSDOM(html)
const document = dom.window.document

const rows = document.querySelectorAll('tr')

const results: Array<{ name: string; url: string }> = []

rows.forEach((row) => {
  const nameTag = row.querySelector('td[height="50px"]')

  if (nameTag) {
    const anchor = nameTag.querySelector('a')
    if (anchor) {
      const name = anchor.textContent || ''
      const url = anchor.getAttribute('href') || ''

      results.push({ name, url })
    }
  }
})

console.log(results)
