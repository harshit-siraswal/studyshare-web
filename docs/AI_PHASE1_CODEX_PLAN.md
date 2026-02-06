# Phase-1 AI Features — Codex Implementation Plan

This is a Codex-ready, copy-pasteable plan + prompts to implement Phase-1 end-to-end.
This is written as instructions to Codex, not explanations.

## Objective

Implement AI Summary, Quiz Generation, and Flashcards for a single PDF on MyStudySpace.

Constraints:
- AI must work only from the PDF
- No hallucination
- Cache results
- Free-first approach

Tech assumptions (Codex can adapt):
- Backend: Node.js OR Python
- Storage: existing PDF storage (local/S3/R2)
- LLM: Gemini / Groq / OpenAI-compatible
- OCR: optional (only if scanned)

## System Design (Codex must follow)

Flow:

```
PDF -> Extract text -> Clean -> Chunk
 -> AI Prompt (Summary / Quiz / Flashcards)
 -> Store result in DB
 -> Return cached result on next request
```

## Directory Structure (Codex must create)

```
/ai
  ├── extract_text.py
  ├── chunker.py
  ├── prompts.py
  ├── generator.py
  ├── cache.py
  └── routes.py
```

(or equivalent in Node.js)

## Database Schema (Mandatory)

Codex must create table/model:

```
ai_outputs
- id
- file_id
- type ENUM('summary','quiz','flashcards')
- content JSON/TEXT
- created_at
```

## Step 1 — PDF Text Extraction

Codex prompt:

```
Create a function extract_text_from_pdf(file_path) that:
1. Uses pdfplumber (or equivalent) to extract text page by page
2. Skips empty pages
3. Returns a single cleaned string
4. Handles errors gracefully

If PDF has no text layer, return None (OCR handled later)
```

## Step 2 — Text Cleaning and Chunking

Rules:
- Remove repeated headers/footers
- Normalize whitespace
- Chunk size: max 1500 words
- Overlap: 100 words

Codex prompt:

```
Write a chunk_text(text, max_words=1500, overlap=100) function that:
- Splits text into word-based chunks
- Adds overlap between chunks
- Returns list of strings
```

## Step 3 — Prompt Templates (Critical)

Codex must create prompts.py with exact prompts below.

### Summary Prompt

```
SYSTEM:
You are a study assistant for college students.

You MUST only use the provided notes.
DO NOT add external information.
DO NOT assume missing details.

USER:
Summarize the following study notes for exam preparation.

Rules:
- Use bullet points
- Highlight definitions
- Keep language simple
- Focus on concepts likely to be asked in exams

NOTES:
{{TEXT}}
```

### Quiz (MCQ) Prompt

```
SYSTEM:
You are a college-level exam question generator.

You MUST only use the provided notes.

USER:
From the notes below:
- Generate exactly 10 multiple-choice questions
- Each question must have 4 options
- Mark the correct answer clearly
- Difficulty: medium
- Questions should be exam-oriented

Return ONLY valid JSON in the following format:

[
  {
    "question": "",
    "options": ["", "", "", ""],
    "correct": "A"
  }
]

NOTES:
{{TEXT}}
```

### Flashcards Prompt

```
SYSTEM:
You are a flashcard generator for revision.

You MUST only use the provided notes.

USER:
Create flashcards from the notes below.

Rules:
- One concept per card
- Answers must be short (1–3 lines)
- Focus on definitions, formulas, differences

Return ONLY valid JSON in this format:

[
  {
    "front": "",
    "back": ""
  }
]

NOTES:
{{TEXT}}
```

## Step 4 — AI Generator Logic

Codex prompt:

```
Create a function generate_ai_output(file_id, type) that:

1. Checks DB cache:
   - If ai_outputs exists for (file_id, type), return it
2. Extracts text from PDF
3. Chunks text if necessary
4. Calls LLM using appropriate prompt
5. If multiple chunks:
   - Generate output per chunk
   - Merge results into final output
6. Stores final output in ai_outputs table
7. Returns output
```

## Step 5 — Merging Logic

Summary:
- Merge summaries -> re-summarize once

Quiz:
- Collect all questions
- Trim to 10 unique questions

Flashcards:
- Deduplicate similar cards
- Max 25 cards

Codex prompt:

```
Implement merging logic per output type:
- Summary: merge chunk summaries and re-summarize
- Quiz: deduplicate questions, limit to 10
- Flashcards: deduplicate by front text, limit to 25
```

## Step 6 — API Routes

Codex must create routes:

```
POST /ai/summary
POST /ai/quiz
POST /ai/flashcards
```

Request body:

```
{
  "file_id": "string"
}
```

Response:

```
{
  "status": "ok",
  "data": ...
}
```

## Step 7 — Error Handling

Codex must handle:
- Empty PDF
- OCR failure
- AI failure
- Invalid JSON from AI (retry once)

Codex prompt:

```
Add retry logic if AI returns invalid JSON.
Retry once with instruction: "Return valid JSON only."
```

## Step 8 — Security and Limits

Rules:
- Validate file_id belongs to user's college
- Rate-limit AI calls per user
- Max PDF size: configurable

## Step 9 — Test Cases (Mandatory)

Codex must create:
- Unit test for chunking
- Test for cached response
- Test for invalid PDF

## Definition of Done (Codex checklist)

- Upload PDF
- Click AI Summary -> result shown
- Click Quiz -> MCQs rendered
- Click Flashcards -> swipeable cards
- Second click uses cache
- No hallucinated content

## Important Note for Codex

```
IMPORTANT:
This is Phase-1 MVP.
Do NOT implement:
- Vector DB
- Global AI chat
- Syllabus detection
- Personalization
Keep everything scoped to ONE PDF.
```
