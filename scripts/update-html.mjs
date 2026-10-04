import fs from 'fs';

let html = fs.readFileSync('index.html', 'utf8');

// Replace standard fallback discs. They are inside `<div class="object-fallback" aria-hidden="true">`
// We want to replace the whole block exactly.
// It looks like:
// <div class="object-fallback" aria-hidden="true">
//   <div class="fallback-disc" style="--disc-color:var(--color-sage); width:40vmin; height:40vmin;"></div>
// </div>
html = html.replace(/<div class="object-fallback" aria-hidden="true">\s*<div class="fallback-disc"[^>]*><\/div>\s*<\/div>/g, (match, offset, str) => {
  const preceding = str.slice(0, offset);
  const matches = preceding.match(/data-object="([^"]+)"/g);
  let obj = 'orrery-overview';
  if (matches && matches.length > 0) {
    obj = matches[matches.length - 1].split('"')[1];
  }
  return `<div class="object-fallback" aria-hidden="true">
          <img src="/fallback/${obj}.png" alt="" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15)); max-width: 80vmin;" loading="lazy">
        </div>`;
});

fs.writeFileSync('index.html', html);
console.log('index.html updated correctly');
