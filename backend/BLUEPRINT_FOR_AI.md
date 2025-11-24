
# 🧬 ADA STARGATE: MASTER BLUEPRINT FOR AI ARCHITECTS

**Target:** Gemini CLI / Cursor / Claude Code
**Objective:** Build the "Zero Error" Python Backend to support the "Episode-Filled" React Frontend.

---

## 1. THE MISSION: "Orchestrating the Silence"

You are tasked with building the backend brain for **Ada Stargate**, a maritime intelligence operating system.
The Frontend is already built (React/TypeScript) and acts as a "Thin Client" / "Operations Deck".
Your job is to build the **Python/FastAPI** backend that powers this deck with real logic, database connections, and AI reasoning.

**The Core Philosophy:**
The Frontend is "Episode-Filled". It operates in distinct modes called **Episodes**:
1.  **Episode A (Welcome Home):** Proactive hailing of vessels via AIS.
2.  **Episode B (Guardian):** Emergency "Code Red" state management.
3.  **Episode C (Safety Net):** Insurance renewal logic.
4.  **Episode J (Culinary):** Reservations and provisioning.

Your Backend must support these episodes via specific API endpoints and Agent Skills.

---

## 2. ARCHITECTURE: THE "BIG 3" (Distributed System)

We are using the **"Big 3 Super Agent"** pattern:

1.  **The ORCHESTRATOR (Level 1):**
    *   **File:** `backend/main.py`
    *   **Role:** The Router. Receives `POST /chat`, classifies intent, routes to Experts.
    *   **Tech:** FastAPI + LangChain Router.

2.  **The EXPERTS (Level 2):**
    *   **Files:** `backend/agents/*.py`
    *   **Role:** Domain Logic. `MarinaExpert`, `FinanceExpert`, `LegalExpert`.
    *   **Tech:** Python Classes with `Pydantic` models.

3.  **The WORKERS (Level 3):**
    *   **Files:** `backend/workers/*.py` (or inside Agents)
    *   **Role:** Deterministic Math/Data. Code execution that cannot fail.
    *   **Tech:** Pure Python functions.

---

## 3. IMPLEMENTATION INSTRUCTIONS (EXECUTE THIS)

If you are an AI Agent reading this, please generate the following file structure and content exactly.

### A. Dependencies
**File:** `backend/requirements.txt`
```text
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.6.0
python-dotenv>=1.0.1
google-generativeai>=0.4.0
httpx>=0.26.0
redis>=5.0.0
chromadb>=0.4.22
sentence-transformers>=2.3.1
```

### B. Data Models (The Contract)
**File:** `backend/models.py`
```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

class UserContext(BaseModel):
    user_id: str
    role: Literal['GUEST', 'CAPTAIN', 'GENERAL_MANAGER']
    name: Optional[str] = "Unknown"

class AgentAction(BaseModel):
    source_node: str
    action_type: str
    params: Dict[str, Any]
    description: str

class ChatResponse(BaseModel):
    text: str
    actions: List[AgentAction] = []
    data: Optional[Dict[str, Any]] = None
```

### C. The Finance Expert (Zero Error)
**File:** `backend/agents/finance_agent.py`
```python
from models import ChatResponse, AgentAction, UserContext
import random

class FinanceExpert:
    def __init__(self):
        # Simulated Ledger
        self.ledger = {
            "s/y phisedelia": {"balance": 850.00, "status": "DEBT", "currency": "EUR"},
            "m/y blue horizon": {"balance": 0.00, "status": "CLEAR", "currency": "EUR"}
        }

    async def process(self, prompt: str, context: UserContext) -> ChatResponse:
        if "debt" in prompt or "balance" in prompt:
            # Logic: Extract vessel from context or prompt
            vessel = "s/y phisedelia" # simplified for blueprint
            data = self.ledger.get(vessel, {"balance": 0, "status": "CLEAR"})
            
            actions = []
            if data['balance'] > 0:
                actions.append(AgentAction(
                    source_node="ada.finance",
                    action_type="LOCK_DEPARTURE",
                    params={"vessel": vessel},
                    description="Departure Blocked due to debt"
                ))
            
            return ChatResponse(
                text=f"**FINANCE REPORT:** {vessel.upper()}\nOutstanding: **€{data['balance']}**\nStatus: {data['status']}",
                actions=actions,
                data=data
            )
        return ChatResponse(text="Finance Agent: Intent not clear.")
```

### D. The Marina Expert (Radar & Ops)
**File:** `backend/agents/marina_agent.py`
```python
from models import ChatResponse, AgentAction, UserContext
import math

class MarinaExpert:
    def get_radar_contact(self, lat, lng):
        # Simulate Kpler/AIS Data
        return [
            {"name": "S/Y Phisedelia", "dist": 4.2, "status": "INBOUND"},
            {"name": "M/V MSC Gulsun", "dist": 12.5, "status": "CROSSING"}
        ]

    async def process(self, prompt: str, context: UserContext) -> ChatResponse:
        if "radar" in prompt or "scan" in prompt:
            targets = self.get_radar_contact(40.96, 28.62)
            return ChatResponse(
                text=f"**RADAR SCAN COMPLETE**\nDetected {len(targets)} targets in sector.\nNearest: **{targets[0]['name']}** ({targets[0]['dist']}nm)",
                data={"targets": targets}
            )
        
        if "depart" in prompt:
            # Episode A: Departure Protocol
            return ChatResponse(
                text="**DEPARTURE REQUEST RECEIVED**\nChecking Traffic Separation Scheme...\nSector Zulu is Clear.\n**Authorized for Departure.** Monitor Ch 14.",
                actions=[
                    AgentAction(source_node="ada.marina", action_type="TENDER_ESCORT", params={"id": "T-01"}, description="Tender dispatched")
                ]
            )
        return ChatResponse(text="Marina Agent: Standing by.")
```

### E. The Orchestrator (Main Brain)
**File:** `backend/main.py`
```python
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agents.finance_agent import FinanceExpert
from agents.marina_agent import MarinaExpert
from models import UserContext, ChatResponse

app = FastAPI(title="Ada Stargate Backend", version="4.0")

# CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Init Agents
finance_agent = FinanceExpert()
marina_agent = MarinaExpert()

class ChatRequest(BaseModel):
    prompt: str
    user_role: str
    context: dict = {}

@app.get("/")
def health_check():
    return {"status": "operational", "system": "Ada Stargate v4.0"}

@app.post("/api/v1/chat")
async def chat_endpoint(request: ChatRequest):
    prompt = request.prompt.lower()
    user_ctx = UserContext(user_id="u1", role=request.user_role, name="User")

    print(f"--> INCOMING: {prompt} | ROLE: {request.user_role}")

    # --- INTELLIGENT ROUTING (The Brain) ---
    
    # 1. Finance Intents
    if any(x in prompt for x in ["invoice", "debt", "pay", "money", "balance"]):
        return await finance_agent.process(prompt, user_ctx)

    # 2. Marina/Ops Intents
    if any(x in prompt for x in ["radar", "scan", "depart", "arrive", "boat", "vessel"]):
        return await marina_agent.process(prompt, user_ctx)

    # 3. Fallback / General Chat
    return {
        "text": "I am the Ada Stargate Backend. I heard you, but I need a specific Operational Command (e.g., 'Check Debt', 'Scan Radar').",
        "actions": []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### F. Docker Environment
**File:** `backend/Dockerfile`
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

---

## 4. DEPLOYMENT PROTOCOL

1.  **Create Folder:** `mkdir backend`
2.  **Populate Files:** Use the content above to create the files.
3.  **Run Docker:**
    ```bash
    docker-compose up --build
    ```
4.  **Verify:** Check `http://localhost:8000/`

**END OF BLUEPRINT**
