import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

import { OpenAIEmbeddings } from '@langchain/openai';
import { HNSWLib } from '@langchain/community/vectorstores/hnswlib';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from '@langchain/core/documents';

// ===== infra =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../data');
const DREAMS_JSON = path.join(DATA_DIR, 'dreams.json');
const INDEX_DIR = path.join(DATA_DIR, 'dreams.index');

await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {});

try {
  await fs.access(DREAMS_JSON);
} 
catch {
  await fs.writeFile(DREAMS_JSON, '[]');
}

const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small';
const embeddings = new OpenAIEmbeddings({ model: EMBED_MODEL });

let vectorStore;

async function splitText(text) {

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
    separators: ['\n\n', '.', '\n', ' '],
  });

  const chunks = await splitter.splitText(text);

  return chunks;

}

async function loadVectorStore() {

  try {
    vectorStore = await HNSWLib.load(INDEX_DIR, embeddings);
    console.log('Vector store loaded.');
  } 
  catch (e) {    
    console.log('Index not found. Trying to build from dreams.json...');
  }

}

async function readDreams() {
  return JSON.parse(await fs.readFile(DREAMS_JSON, 'utf8'));
}

async function writeDreams(arr) {
  await fs.writeFile(DREAMS_JSON, JSON.stringify(arr, null, 2));
}

export async function storeDream({ text, title, date, uid }) {

  const dreams = await readDreams();
  const id = uuidv4();

  const record = {
    id,
    title,
    text,
    date: date || dayjs().format('YYYY-MM-DD'),
    createdAt: new Date().toISOString(),
    uid
  };

  dreams.push(record);
  
  await writeDreams(dreams);

  const chunks = await splitText(text);

  const docs = chunks.map((chunk, index) => 
    new Document({
      pageContent: chunk,
      metadata: { id, title:record.title, uid:record.uid, date:record.date, chunkIndex:index },
    })
  );

  if (vectorStore) {
    await vectorStore.addDocuments(docs);
  } 
  else {
    vectorStore = await HNSWLib.fromDocuments(docs, embeddings);
  }

  await vectorStore.save(INDEX_DIR);
  
  return record;

}

export async function searchDreams({ query, filter, k = 3 }) {
  
  if (!vectorStore) {
    return [];
  }

  // Realiza a busca com o vetor
  const results = await vectorStore.similaritySearch(query, k, filter);

  // Agrupa os chunks de volta para formar o texto completo
  const aggregatedResults = results.reduce((acc, r) => {
    if (!acc[r.metadata.id]) {
      acc[r.metadata.id] = { 
        text: '', 
        chunks: [],
        metadata: { ...r.metadata }
      };
    }
    acc[r.metadata.id].chunks.push(r.pageContent);
    return acc;
  }, {});

  // Organiza os resultados finais
  return Object.values(aggregatedResults).map((r) => ({
    text: "[...] " + r.chunks.join(`
      
[...] 

`) + " [...]", // Junta os chunks
    ...r.metadata,
  }));
}

await loadVectorStore();
