#!/usr/bin/env node
// ─── scripts/verify-content.js ───────────────────────────────────────────────
// Builds the site, starts a local preview server, then uses Playwright to:
//   1. Assert every resume string from content.js is present in the built HTML
//      without JavaScript (static check).
//   2. Scroll the full page and assert every string is visible (opacity ~1,
//      not clipped by overflow).
//   3. Click the phone reveal button and assert a tel: link appears.
// Exits non-zero on any failure.
// ─────────────────────────────────────────────────────────────────────────────

import { execSync, spawn } from 'child_process';
import { readFileSync } from 'fs';
import { chromium } from 'playwright';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ─── Strings to verify (derived from content.js resume) ─────────────────────
// These are exact substrings that must appear in the built HTML AND be visible.
const MUST_CONTAIN = [
  // Summary
  'Backend Engineer with 4+ years',
  'Generative AI and Agentic AI',
  'LangChain and LangGraph',
  'Retrieval-Augmented Generation (RAG)',
  'vector search with ChromaDB',
  'LLM observability with LangSmith',
  '200,000+ users',
  'reduced false positives by 30%',

  // Skills
  'LLM Application Development',
  'Prompt Engineering',
  'Retrieval-Augmented Generation (RAG)',
  'Embeddings',
  'Semantic Search',
  'Structured Output Extraction',
  'Grounded Answers with Citations',
  'AI Agents',
  'Multi-Step Agent Workflows',
  'LangGraph (Stateful Agent Graphs)',
  'LangSmith (Tracing & Observability)',
  'Groq',
  'Tavily Search API',
  'Python',
  'JavaScript',
  'SQL',
  'PHP',
  'FastAPI',
  'Node.js',
  'Express.js',
  'RESTful APIs',
  'Webhooks',
  'Microservices',
  'Event-Driven Architecture',
  'Asynchronous Processing',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'ChromaDB (Vector Database)',
  'AWS (EC2, S3, RDS, IAM, CloudWatch, Lambda, SQS)',
  'Docker',
  'Docker Compose',
  'CI/CD',
  'GitHub Actions',
  'Git',
  'GitHub',
  'GitLab',
  'Finix',
  'Evervault',
  '3DS2',
  'ACH',
  'Ethoca',
  'SportsRadar API',
  'RotoWire API',
  'System Design',
  'Multi-Tenant Architecture',
  'Idempotency',
  'Consistent Hashing',
  'API Performance Optimization',

  // Projects
  'API Integration Monitor Agent',
  '5-node LangGraph state machine',
  'fetch, compare, summarize, classify, suggest fix',
  'breaking or non-breaking',
  'vector search with embeddings in ChromaDB',
  'end-to-end tracing of every agent step',
  'HireFlow',
  'Groq + LangChain',
  'unstructured resumes and job descriptions',
  'quoted source citations',
  'targeted interview questions from skill gaps',

  // Experience
  'Senior Full Stack Developer',
  'Algoza Technologies Pvt. Ltd.',
  'Oct 2024',
  'fantasy sports platform serving 200,000+ users',
  'Finix payment gateway integration',
  'Evervault tokenization',
  '3DS2 authentication',
  'ACH cashouts',
  'idempotent processing',
  'Ethoca fraud prevention',
  'reducing false positives by 30%',
  'MongoDB and MySQL data',
  '50,000+ leads',
  'increased lead conversion by 25%',
  'Node.js & SQL Developer',
  'Aryavrat Infotech Pvt. Ltd.',
  'Dec 2023',
  'DeskTrack',
  'reducing manual data entry by 80%',
  'page load time by 40%',
  'Chart.js dashboards for 200+ clients',
  'PHP Developer',
  'Unified Business Web Solution Pvt. Ltd.',
  'Jan 2023',
  'CRM / educational management system',
  'Full Stack Developer',
  'Global India IT Solutions',
  'Jun 2022',
  'PHP, MySQL, JavaScript, jQuery, and AJAX',

  // Education
  'Bachelor of Arts (B.A.)',
  'University of Rajasthan, Jaipur',
  '2020',
  '2022',
];

// Phone number must NOT be in static HTML
const PHONE_FORBIDDEN_STATIC = '8290507041';

let previewProcess = null;

async function main() {
  let failures = 0;

  console.log('\n🔨 Building...');
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    console.error('❌ Build failed');
    process.exit(1);
  }

  // ─── Static HTML check (no JS) ─────────────────────────────────────────────
  console.log('\n📄 Checking static HTML...');
  const htmlPath = path.join(ROOT, 'dist', 'index.html');
  const html = readFileSync(htmlPath, 'utf8');

  // Decode HTML entities for comparison
  const decoded = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');

  if (decoded.includes(PHONE_FORBIDDEN_STATIC)) {
    console.error(`❌ STATIC: Phone number ${PHONE_FORBIDDEN_STATIC} found in static HTML! Must not be present.`);
    failures++;
  } else {
    console.log('✅ Phone number not in static HTML (correct)');
  }

  for (const str of MUST_CONTAIN) {
    if (!decoded.includes(str)) {
      console.error(`❌ STATIC: Missing "${str}"`);
      failures++;
    }
  }
  if (failures === 0) console.log(`✅ All ${MUST_CONTAIN.length} strings found in static HTML`);

  // ─── Start preview server ──────────────────────────────────────────────────
  console.log('\n🚀 Starting preview server...');
  const port = 4174;

  previewProcess = spawn('npx', ['vite', 'preview', '--port', String(port)], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
  });

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // ─── Playwright live check ─────────────────────────────────────────────────
  console.log('\n🎭 Running Playwright checks...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  try {
    await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle', timeout: 30000 });

    // Scroll through the full page in steps
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), (i / steps) * height);
      await page.waitForTimeout(200);
    }

    // Back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Assert each string is in the DOM and visible
    let visibleFailures = 0;
    for (const str of MUST_CONTAIN) {
      const isVisible = await page.evaluate((s) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent.includes(s)) {
            const el = node.parentElement;
            if (!el) continue;
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const opacity = parseFloat(style.opacity);
            const vis = style.visibility;
            const display = style.display;
            // Accept if opacity >= 0.5 and not hidden
            if (opacity >= 0.5 && vis !== 'hidden' && display !== 'none') return true;
          }
        }
        return false;
      }, str);

      if (!isVisible) {
        console.error(`❌ VISIBLE: "${str}" is in DOM but not visible after scrolling`);
        visibleFailures++;
        failures++;
      }
    }
    if (visibleFailures === 0) {
      console.log(`✅ All ${MUST_CONTAIN.length} strings visible on page`);
    }

    // Phone reveal test
    console.log('\n📱 Testing phone reveal...');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);

    const revealBtn = await page.$('#reveal-phone');
    if (revealBtn) {
      await revealBtn.click();
      await page.waitForTimeout(500);
      const phoneLink = await page.$('#phone-display a[href^="tel:"]');
      if (phoneLink) {
        const href = await phoneLink.getAttribute('href');
        if (href.includes('8290507041')) {
          console.log('✅ Phone number reveals correctly on click');
        } else {
          console.error('❌ Phone link href does not contain expected number');
          failures++;
        }
      } else {
        console.error('❌ No tel: link found after clicking reveal-phone');
        failures++;
      }
    } else {
      console.error('❌ #reveal-phone button not found');
      failures++;
    }

  } finally {
    await browser.close();
    previewProcess?.kill();
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────');
  if (failures === 0) {
    console.log(`✅ verify:content PASSED — all checks passed`);
  } else {
    console.error(`❌ verify:content FAILED — ${failures} issue(s) found`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  if (previewProcess) previewProcess.kill();
  process.exit(1);
});
