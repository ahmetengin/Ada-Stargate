# Ada.Marina.WIM – Tenant Constitution (v1 clean start)

## 1. Identity
This service represents the tenant: **West Istanbul Marina (WIM)**.
Claude/Gemini Agents must work ONLY inside this directory unless explicitly instructed.

## 2. Scope (Basic Phase)
For now, this tenant handles:
- Berth data model (LOA, beam, draft, zones)
- Arrival workflow (manual input only for now)
- Check-in preparation
- Price configuration baseline

*No integrations, no payments, no AIS ingestion yet.*

## 3. Code Style Rules
- Python 3.11+
- FastAPI for API layer
- Pydantic for schemas
- No external dependencies unless approved

## 4. Safety Rules
- **Do NOT** generate real AIS, VHF, CAN, NMEA2000 code at this phase.
- **Do NOT** generate billing or payment logic at this phase.
- Only create structures, placeholders, and basic logic.

## 5. Phase Goals
- Create a clean skeleton
- Add basic berth model
- Add basic marina_wim_rules.yaml structure
- Add placeholder endpoints
- Add minimal tests

## 6. Changes Allowed
- Small controlled changes in: `api/`, `schemas/`, `services/`, `config/`
- Adding files is allowed
- No destructive edits outside this directory

## 7. Before Coding
Agent must:
- Start with “PLAN MODE” every time
- Summarize what it will do
- Wait for confirmation

## 8. Policy & RAG Dependencies (The Brain)
- **Source of Truth (Hard Rules):** `config/marina_wim_rules.yaml`
- **Source of Context (Soft Rules):** RAG collection `marina_wim_docs` (from `rag/documents/`)

**CRITICAL DIRECTIVE:**
Before changing pricing, berthing logic, or penalties, the Agent MUST consult `marina_wim_rules.yaml`. Do not hardcode business logic; read it from the config.