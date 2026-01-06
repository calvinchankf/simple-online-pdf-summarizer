# Simple PDF Online Summarizer (OpenAI + File Search)

Just a comparision between doing it with online OpenAI API versus with offline LLM model via Ollama https://github.com/calvinchankf/simple-local-pdf-summarizer-with-rag

## Setup

1) Install dependencies

```bash
npm install
```

2) Set your API key

```bash
cp .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY`.

## Usage

```bash
node summarize.js /path/to/file.pdf
```

Optional: set a different model in `.env` with `OPENAI_MODEL`.

After the initial summary, user can ask follow-up questions in the terminal. Type "quit" to exit.

## Notes

- This uses the Assistants API + File Search to read PDFs.
- The script caches a vector store ID and file hashes in `.vector_store_cache.json` to avoid re-uploading unchanged PDFs.
- If want to force a re-upload, delete `.vector_store_cache.json` or edit it to remove the file hash.
- To check the vector store online, we can 
```
curl https://api.openai.com/v1/vector_stores \
  -H "Authorization: Bearer ${YOUR_OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -H "OpenAI-Beta: assistants=v2"
```

## Based on

- OpenAI Quickstart: https://platform.openai.com/docs/quickstart
- File Search guide: https://platform.openai.com/docs/guides/tools-file-search

## Demo

![](/demo/llama2.png)