// ─── content.js ─────────────────────────────────────────────────────────────
// Single source of truth. Every string here is verbatim from the canonical
// resume. Do NOT paraphrase, shorten, merge or reorder. Edit here only.
// ─────────────────────────────────────────────────────────────────────────────

export const meta = {
  name: 'Kuldeep Singh',
  headline: 'Backend Engineer – GenAI & Agentic AI | Python | FastAPI | LangGraph | LangChain | Node.js',
  location: 'Jaipur, Rajasthan, India',
  email: 'artateight@gmail.com',
  // Phone is assembled at click-time only — never placed in static HTML
  phoneDigits: ['+91', '8290507041'],
  linkedin: 'https://linkedin.com/in/kuldeep-singh-99b204280',
  github: 'https://github.com/Kuldeep-Singh-Naruka',
  resumePath: '/resume/Kuldeep_Singh_Resume.pdf',
  siteUrl: 'https://kuldeep-singh-naruka.netlify.app',
  repo: 'https://github.com/Kuldeep-Singh-Naruka/portfolio-website',
  ogImage: '/og-image.png',
  description:
    'Kuldeep Singh — Backend Engineer with 4+ years building scalable APIs, LLM-powered agents, and production payment systems.',
};

// Connective hero copy (original, truthful, no new claims)
export const hero = {
  statement: [
    'Systems that hold under load,',
    'agents that reason through uncertainty,',
    'payments that clear without drama.',
  ],
  ctaProjects: 'View projects',
  ctaResume: 'Download resume',
  ctaHello: 'Say hello',
};

// ─── PROFESSIONAL SUMMARY (verbatim) ────────────────────────────────────────
export const summary =
  'Backend Engineer with 4+ years of experience building scalable REST APIs and backend systems with Python, Node.js, Express.js, PHP, MySQL, PostgreSQL, and MongoDB, now focused on Generative AI and Agentic AI. Builds LLM-powered applications with LangChain and LangGraph: multi-step AI agents, Retrieval-Augmented Generation (RAG), vector search with ChromaDB, structured LLM outputs, and LLM observability with LangSmith, served through FastAPI. Brings production experience from a fantasy sports platform with 200,000+ users, including payment systems (Finix, 3DS2, ACH), webhooks, event-driven processing, idempotent transactions, and fraud prevention that reduced false positives by 30%.';

// ─── TECHNICAL SKILLS (verbatim, keep order and exact labels) ───────────────
// Each item in `items` is ONE skill (parenthetical text stays attached).
export const skillGroups = [
  {
    id: 'gen-ai',
    index: '01',
    label: 'Generative AI & LLMs',
    object: 'rag-cloud',
    items: [
      'LLM Application Development',
      'Prompt Engineering',
      'Retrieval-Augmented Generation (RAG)',
      'Embeddings',
      'Semantic Search',
      'Structured Output Extraction',
      'Grounded Answers with Citations',
    ],
  },
  {
    id: 'agentic-ai',
    index: '02',
    label: 'Agentic AI',
    object: 'constellation',
    items: [
      'AI Agents',
      'Multi-Step Agent Workflows',
      'LangGraph (Stateful Agent Graphs)',
      'LangChain',
      'LangSmith (Tracing & Observability)',
      'Groq',
      'Tavily Search API',
    ],
  },
  {
    id: 'languages',
    index: '03',
    label: 'Languages',
    object: 'planet-moons',
    items: ['Python', 'JavaScript', 'SQL', 'PHP'],
  },
  {
    id: 'backend',
    index: '04',
    label: 'Backend',
    object: 'ringed-planet',
    items: [
      'FastAPI',
      'Node.js',
      'Express.js',
      'RESTful APIs',
      'Webhooks',
      'Microservices',
      'Event-Driven Architecture',
      'Asynchronous Processing',
    ],
  },
  {
    id: 'databases',
    index: '05',
    label: 'Databases',
    object: 'strata-planet',
    items: [
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'ChromaDB (Vector Database)',
    ],
  },
  {
    id: 'devops',
    index: '06',
    label: 'DevOps & Tools',
    object: 'satellite',
    items: [
      'AWS (EC2, S3, RDS, IAM, CloudWatch, Lambda, SQS)',
      'Docker',
      'Docker Compose',
      'CI/CD',
      'GitHub Actions',
      'Git',
      'GitHub',
      'GitLab',
    ],
  },
  {
    id: 'payments',
    index: '07',
    label: 'Payments & Integrations',
    object: 'orbit-planet',
    items: [
      'Finix',
      'Evervault',
      '3DS2',
      'ACH',
      'Ethoca',
      'SportsRadar API',
      'RotoWire API',
    ],
  },
  {
    id: 'concepts',
    index: '08',
    label: 'Concepts',
    object: 'hash-ring',
    items: [
      'System Design',
      'Multi-Tenant Architecture',
      'Idempotency',
      'Consistent Hashing',
      'API Performance Optimization',
    ],
  },
];

// ─── AI PROJECTS (verbatim) ─────────────────────────────────────────────────
export const projects = [
  {
    id: 'api-monitor',
    index: '01',
    title: 'API Integration Monitor Agent',
    subtitle: 'Agentic AI',
    stack: 'Python, FastAPI, LangGraph, LangChain, PostgreSQL, ChromaDB, LangSmith',
    github: 'https://github.com/Kuldeep-Singh-Naruka/API-Integration-Monitor-Agent',
    bullets: [
      'Designed and built an autonomous AI agent that monitors third-party API documentation for changes, using a 5-node LangGraph state machine (fetch, compare, summarize, classify, suggest fix).',
      'Used an LLM to classify each change as breaking or non-breaking and to generate suggested code fixes for affected integrations.',
      'Implemented vector search with embeddings in ChromaDB to retrieve relevant documentation context for the LLM (RAG), with PostgreSQL for persistence.',
      'Exposed the agent through FastAPI REST endpoints and added end-to-end tracing of every agent step with LangSmith.',
    ],
    // Waypoints match the brief exactly
    waypoints: ['fetch', 'compare', 'summarize', 'classify', 'suggest fix'],
  },
  {
    id: 'hireflow',
    index: '02',
    title: 'HireFlow – AI Candidate Screening & Interview Intelligence',
    subtitle: 'LLM Pipeline',
    stack: 'Python, FastAPI, PostgreSQL, Groq, LangChain, React',
    github: 'https://github.com/Kuldeep-Singh-Naruka/HireFlow',
    bullets: [
      'Built an LLM pipeline (Groq + LangChain) that extracts structured job requirements and candidate profiles from unstructured resumes and job descriptions.',
      'Mapped each requirement to resume evidence with quoted source citations, giving explainable, grounded results instead of an opaque match score.',
      'Auto-generated targeted interview questions from skill gaps; built the FastAPI backend with PostgreSQL and a React frontend for live demos.',
    ],
    waypoints: [
      'Resumes & job descriptions',
      'Structured requirements & profiles',
      'Requirements matched to quoted evidence',
      'Interview questions',
    ],
  },
];

// ─── PROFESSIONAL EXPERIENCE (verbatim) ─────────────────────────────────────
export const experience = [
  {
    id: 'algoza',
    title: 'Senior Full Stack Developer',
    company: 'Algoza Technologies Pvt. Ltd.',
    dates: 'Oct 2024 – Present',
    isCurrent: true,
    bullets: [
      'Led backend services (Node.js, Express.js, PHP, MySQL, MongoDB) and admin panel development for a fantasy sports platform serving 200,000+ users, covering user management, promo codes, and payment reporting.',
      'Built an end-to-end Finix payment gateway integration: card deposits, Evervault tokenization, 3DS2 authentication, ACH cashouts, and bank account payment instruments, with webhook-based, event-driven asynchronous processing.',
      'Implemented automated recovery for failed ACH transfers that restores cash, bonus, and rollover balances with idempotent processing to prevent duplicate transactions and keep financial data consistent.',
      'Integrated Ethoca fraud prevention, reducing false positives by 30% and lowering chargeback losses; integrated SportsRadar and RotoWire sports data APIs.',
      'Built a user analytics dashboard combining MongoDB and MySQL data (first/last play, 7-day, 30-day, and lifetime P&L, most-played games) used by the admin team.',
      'Led multi-tenant real estate CRM modules with tenant-based data isolation, optimizing APIs to process 50,000+ leads; increased lead conversion by 25% and saved 20+ hours per month through automation.',
    ],
  },
  {
    id: 'aryavrat',
    title: 'Node.js & SQL Developer',
    company: 'Aryavrat Infotech Pvt. Ltd.',
    dates: 'Dec 2023 – Oct 2024',
    isCurrent: false,
    bullets: [
      'Built Node.js APIs and bulk holiday upload and leave management modules for DeskTrack (HR & productivity), serving 10+ teams and reducing manual data entry by 80%.',
      'In Lead Management reduced page load time by 40% and delivered real-time Chart.js dashboards for 200+ clients.',
      'Wrote and optimized SQL queries and Node.js APIs to improve response times; fixed production bugs in Lead Management and DeskTrack applications.',
    ],
  },
  {
    id: 'ubws',
    title: 'PHP Developer',
    company: 'Unified Business Web Solution Pvt. Ltd.',
    dates: 'Jan 2023 – Dec 2023',
    isCurrent: false,
    bullets: [
      'Developed a CRM / educational management system, a WHM portal, and custom admin panels for multiple clients.',
    ],
  },
  {
    id: 'giis',
    title: 'Full Stack Developer',
    company: 'Global India IT Solutions',
    dates: 'Jun 2022 – Jan 2023',
    isCurrent: false,
    bullets: [
      'Developed and maintained responsive web applications using PHP, MySQL, JavaScript, jQuery, and AJAX.',
    ],
  },
];

// ─── EDUCATION (verbatim) ────────────────────────────────────────────────────
export const education = {
  degree: 'Bachelor of Arts (B.A.)',
  institution: 'University of Rajasthan, Jaipur',
  years: '2020 – 2022',
};

// ─── Graph node ordering (for 3D orrery overview) ───────────────────────────
export const graphNodes = [
  { id: 'sun', label: 'YOU', section: '#hero' },
  ...skillGroups.map((g) => ({ id: g.id, label: g.label, section: `#skill-${g.id}` })),
  { id: 'projects', label: 'Projects', section: '#projects' },
  { id: 'experience', label: 'Experience', section: '#experience' },
  { id: 'contact', label: 'Contact', section: '#contact' },
];
