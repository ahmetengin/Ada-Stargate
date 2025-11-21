# 🐍 Enterprise Backend Source Code (Safe Mode)

Bu dosya, **tamamen ücretsiz ve güvenli** bir simülasyon modunda çalışan Python sunucusunu içerir.
Gerçek API anahtarlarına (Paraşüt, Iyzico, Kpler) **ihtiyacınız yoktur.**

Lütfen aşağıdaki kod bloğunu kopyalayın ve `backend/server.py` olarak kaydedin.

## `backend/server.py`

```python
import os
import re
import logging
import random
import time
from typing import List, Optional, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()

# CRITICAL: This ensures we are in SAFE MODE.
# Set to False only if you possess real API keys and want to burn money.
SIMULATION_MODE = True 

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("AdaBackend")

app = FastAPI(title="Ada Stargate Backend (Simulated)", version="4.1.0")

# CORS: Allow React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GEMINI AI CLIENT (Optional Intelligence) ---
AI_AVAILABLE = False
ai_client = None

try:
    from google import genai
    from google.genai import types
    
    api_key = os.getenv("API_KEY")
    if api_key and not SIMULATION_MODE: # Only use AI if key exists AND we are not forcing sim
        ai_client = genai.Client(api_key=api_key)
        AI_AVAILABLE = True
        logger.info("✅ Gemini AI Client Initialized.")
    else:
        logger.warning("⚠️ AI Disabled. Running in Heuristic/Simulation Mode.")
except ImportError:
    logger.warning("⚠️ google-genai library not installed. AI features disabled.")
except Exception as e:
    logger.warning(f"⚠️ AI Init failed: {e}")

# --- DATA MODELS ---

class ChatRequest(BaseModel):
    prompt: str
    user_role: str = "GUEST"
    context: Optional[Dict[str, Any]] = {}

class AgentAction(BaseModel):
    node: str
    action: str
    params: Dict[str, Any]

class ChatResponse(BaseModel):
    text: str
    actions: List[AgentAction] = []
    mode: str

# --- MOCK WORKERS (The "Fake It" Layer) ---

class MockWorkers:
    @staticmethod
    def generate_invoice_id():
        return f"INV-{random.randint(1000, 9999)}-SIM"

    @staticmethod
    def calculate_vat(amount: float):
        return amount * 0.18

# --- EXPERTS (Domain Logic) ---

class FinanceExpert:
    def process(self, prompt: str) -> ChatResponse:
        logger.info(f"[Finance] Processing: {prompt}")
        
        # Extract number or default
        amount_match = re.search(r'(\d+)', prompt)
        amount = float(amount_match.group(1)) if amount_match else 1500.0
        
        inv_id = MockWorkers.generate_invoice_id()
        vat = MockWorkers.calculate_vat(amount)
        total = amount + vat
        
        action = AgentAction(
            node="ada.finance",
            action="create_invoice",
            params={
                "id": inv_id, 
                "amount": total, 
                "currency": "EUR", 
                "status": "DRAFT_SIMULATED"
            }
        )
        
        return ChatResponse(
            text=f"**FINANCE (SIMULATION):** Invoice **{inv_id}** generated.\n\n"
                 f"- Subtotal: €{amount}\n"
                 f"- VAT (18%): €{vat}\n"
                 f"- **Total: €{total}**\n\n"
                 f"*Note: This is a simulation. No real invoice was created at Parasut.*",
            actions=[action],
            mode="SIMULATION"
        )

class TechnicExpert:
    def process(self, prompt: str) -> ChatResponse:
        logger.info(f"[Technic] Processing: {prompt}")
        
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', prompt)
        date = date_match.group(1) if date_match else "tomorrow"
        
        # Simulate checking a database
        if "13" in date: # Unlucky day simulation
            return ChatResponse(
                text=f"**TECHNIC (SIMULATION):** Conflict detected. Travel Lift is under maintenance on {date}.",
                actions=[],
                mode="SIMULATION"
            )
            
        ticket_id = f"TICKET-{random.randint(100, 999)}"
        
        action = AgentAction(
            node="ada.technic",
            action="schedule_service",
            params={"date": date, "ticket_id": ticket_id, "type": "HAUL_OUT"}
        )
        
        return ChatResponse(
            text=f"**TECHNIC (SIMULATION):** Haul-out scheduled for **{date}**.\n"
                 f"Ticket ID: `{ticket_id}` assigned to *Tender Bravo* team.",
            actions=[action],
            mode="SIMULATION"
        )

class LegalExpert:
    def process(self, prompt: str) -> ChatResponse:
        logger.info(f"[Legal] Processing: {prompt}")
        return ChatResponse(
            text="**LEGAL (SIMULATION):** Querying Vector Database...\n\n"
                 "**Result (WIM Regs Article H.3):**\n"
                 "> 'Vessels cannot depart without settling outstanding debts.'\n\n"
                 "*Context: Simulated RAG retrieval.*",
            actions=[],
            mode="SIMULATION"
        )

# --- ROUTER (The Brain) ---

class Router:
    def __init__(self):
        self.finance = FinanceExpert()
        self.technic = TechnicExpert()
        self.legal = LegalExpert()

    def route(self, req: ChatRequest) -> ChatResponse:
        prompt = req.prompt.lower()
        
        # Simple Keyword Routing (No AI needed)
        if any(x in prompt for x in ['invoice', 'pay', 'debt', 'money', 'bill']):
            return self.finance.process(req.prompt)
        
        if any(x in prompt for x in ['repair', 'service', 'technic', 'fix', 'schedule', 'lift']):
            return self.technic.process(req.prompt)
            
        if any(x in prompt for x in ['law', 'rule', 'contract', 'penalty', 'legal']):
            return self.legal.process(req.prompt)

        return ChatResponse(
            text=f"**ADA CORE (SIMULATION):** I received: '{req.prompt}'.\n"
                 "Please specify a domain: Finance, Technical, or Legal.",
            mode="SIMULATION"
        )

router = Router()

# --- API ---

@app.get("/")
def health_check():
    return {
        "status": "online", 
        "simulation_mode": SIMULATION_MODE,
        "message": "Don't panic! No real API keys needed."
    }

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    # Simulate network latency for realism
    time.sleep(0.5)
    return router.route(request)

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 STARTING ADA BACKEND IN SIMULATION MODE...")
    logger.info("🌊 No real money, no real ships. Safe to sail.")
    uvicorn.run(app, host="0.0.0.0", port=8000)
