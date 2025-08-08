import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

import { OpenAIEmbeddings } from '@langchain/openai';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { Document } from '@langchain/core/documents';

// ===== infra =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DREAMS_JSON = path.join(DATA_DIR, 'dreams.json');
const INDEX_DIR = path.join(DATA_DIR, 'dreams.index');

await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});
try {
  await fs.access(DREAMS_JSON);
} catch {
  await fs.writeFile(DREAMS_JSON, '[]');
}

const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';
const embeddings = new OpenAIEmbeddings({ model: EMBED_MODEL });

let vectorStore;

async function loadVectorStore() {
  try {
    vectorStore = await HNSWLib.load(INDEX_DIR, embeddings);
    console.log('Vector store loaded.');
  } catch (e) {
    console.log('Index not found. Trying to build from dreams.json...');
    const dreams = await readDreams();
    if (dreams.length > 0) {
      console.log(`Found ${dreams.length} dreams. Building index...`);
      const dreamDocs = dreams.map(
        (d) =>
          new Document({
            pageContent: d.text,
            metadata: { id: d.id, date: d.date, tags: d.tags },
          })
      );
      vectorStore = await HNSWLib.fromDocuments(dreamDocs, embeddings);
      await vectorStore.save(INDEX_DIR);
      console.log('Index built and saved.');
    } else {
      console.log(
        'No dreams found in dreams.json. Vector store will be created on first addition.'
      );
    }
  }
}

async function readDreams() {
  return JSON.parse(await fs.readFile(DREAMS_JSON, 'utf8'));
}
async function writeDreams(arr) {
  await fs.writeFile(DREAMS_JSON, JSON.stringify(arr, null, 2));
}

export async function storeDream({ text, date, tags }) {
  const dreams = await readDreams();
  const id = uuidv4();
  const record = {
    id,
    text,
    date: date || dayjs().format('YYYY-MM-DD'),
    tags: tags || [],
    createdAt: new Date().toISOString(),
  };
  dreams.push(record);
  await writeDreams(dreams);

  const doc = new Document({
    pageContent: text,
    metadata: { id, date: record.date, tags: record.tags },
  });

  if (vectorStore) {
    await vectorStore.addDocuments([doc]);
  } else {
    vectorStore = await HNSWLib.fromDocuments([doc], embeddings);
  }

  await vectorStore.save(INDEX_DIR);
  return record;
}

export async function searchDreams({ query, k = 3 }) {
  if (!vectorStore) {
    return [];
  }
  const results = await vectorStore.similaritySearch(query, k);
  return results.map((r) => ({ text: r.pageContent, ...r.metadata }));
}

// Load the vector store on startup
await loadVectorStore();
