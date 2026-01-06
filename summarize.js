import crypto from "crypto";
import fs from "fs";
import path from "path";
import readline from "readline";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node summarize.js <path-to-pdf>");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Missing OPENAI_API_KEY in environment.");
  process.exit(1);
}

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const client = new OpenAI({ apiKey });

const cachePath = path.join(process.cwd(), ".vector_store_cache.json");
const cache = fs.existsSync(cachePath)
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : {};

let vectorStoreId = cache.vectorStoreId;
if (!vectorStoreId) {
  const vectorStore = await client.vectorStores.create({
    name: "pdf-summaries"
  });
  vectorStoreId = vectorStore.id;
  cache.vectorStoreId = vectorStoreId;
}

const fileBuffer = fs.readFileSync(filePath);
const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

if (!cache.files) cache.files = {};

if (!cache.files[fileHash]) {
  await client.vectorStores.fileBatches.uploadAndPoll(vectorStoreId, {
    files: [fs.createReadStream(filePath)]
  });

  cache.files[fileHash] = {
    fileName: path.basename(filePath)
  };
}

fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

const response = await client.responses.create({
  model,
  input:
    "Summarize the PDF. Provide bullet points, key takeaways, and any notable figures or tables.",
  tools: [
    {
      type: "file_search",
      vector_store_ids: [vectorStoreId]
    }
  ],
});

const outputText = response.output_text;
if (!outputText) {
  console.error("No response text returned.");
  process.exit(1);
}
console.log(outputText);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

while (true) {
  const userQuestion = (await ask("\nAsk a question (type \"quit\" to exit): ")).trim();
  if (!userQuestion) continue;
  if (userQuestion.toLowerCase() === "quit") break;

  const followup = await client.responses.create({
    model,
    input: userQuestion,
    tools: [
      {
        type: "file_search",
        vector_store_ids: [vectorStoreId]
      }
    ]
  });

  if (followup.output_text) {
    console.log(`\n${followup.output_text}`);
  } else {
    console.log("\nNo response text returned.");
  }
}

rl.close();
