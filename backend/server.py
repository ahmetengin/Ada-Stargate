import os
import re
import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# --- CONFIGURATION & SETUP ---
load_dotenv() # Load .env if present

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AdaBackend")

app = FastAPI(title="Ada Stargate Backend", version="4.0.0")

# CORS: Allow React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GEMINI AI CLIENT SETUP (FAIL-SAFE) ---
AI_AVAILABLE = False
ai_client = None

try:
    from google import genai
    from google.genai import types
    
    api_key = os.getenv("API_KEY")
    if api_key:
        ai_client = genai.Client(api_key=api_key)
        AI_AVAILABLE = True
        logger.info("✅ Gemini AI Client Initialized Successfully.")
    else:
        logger.warning("⚠️ API_KEY not found in environment. Switching to SIMULATION MODE.")
except ImportError:
    logger.warning("⚠️ google-genai library not installed. Switching to SIMULATION MODE.")
except Exception as e:
    logger.error(f"⚠️ Error initializing AI Client: {e}. Switching to SIMULATION MODE.")

# --- DATA MODELS (Pydantic - Zero Error) ---

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
    mode: str # 'AI' or 'SIMULATION'

# --- LEVEL 3: WORKERS (Pure, Deterministic Logic) ---
# These function CANNOT hallucinate because they are code.

class Workers:
    @staticmethod
    def calculate_invoice(amount: float, vat_rate: float = 0.18) -> Dict[str, float]:
        """Calculates total with VAT."""
        vat = amount * vat_rate
        total = amount + vat
        return {"subtotal": amount, "vat": vat, "total": total}

    @staticmethod
    def check_schedule_conflict(date: str) -> bool:
        """Simulates a DB check for schedule conflicts."""
        # Mock logic: the 15th is always busy
        if "15" in date:
            return True
        return False

# --- LEVEL 2: EXPERTS (Domain Logic) ---

class FinanceExpert:
    def process(self, prompt: str) -> ChatResponse:
        # Simple extraction logic for Simulation Mode
        amount_match = re.search(r'(\d+)', prompt)
        amount = float(amount_match.group(1)) if amount_match else 1000.0
        
        calc = Workers.calculate_invoice(amount)
        
        action = AgentAction(
            node="ada.finance",
            action="create_invoice",
            params={"amount": calc["total"], "currency": "EUR"}
        )
        
        return ChatResponse(
            text=f"**FINANCE EXPERT:** Invoice calculated. Subtotal: €{calc['subtotal']}, VAT: €{calc['vat']}. Total: **€{calc['total']}**.",
            actions=[action],
            mode="SIMULATION" if not AI_AVAILABLE else "AI_ASSISTED"
        )

class TechnicExpert:
    def process(self, prompt: str) -> ChatResponse:
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', prompt)
        date = date_match.group(1) if date_match else "2025-11-25"
        
        conflict = Workers.check_schedule_conflict(date)
        
        if conflict:
            return ChatResponse(
                text=f"**TECHNIC EXPERT:** Negative. The schedule for **{date}** is fully booked. Please select another date.",
                actions=[],
                mode="SIMULATION"
            )
        
        action = AgentAction(
            node="ada.technic",
            action="schedule_service",
            params={"date": date, "type": "HAUL_OUT"}
        )
        
        return ChatResponse(
            text=f"**TECHNIC EXPERT:** Service scheduled successfully for **{date}**. Team notified.",
            actions=[action],
            mode="SIMULATION"
        )

class LegalExpert:
    def process(self, prompt: str) -> ChatResponse:
        return ChatResponse(
            text="**LEGAL EXPERT:** Searching WIM Regulations... \n\n*Article H.3:* Departure is prohibited until debts are settled.",
            actions=[],
            mode="SIMULATION"
        )

# --- LEVEL 1: ROUTER (The Brain) ---

class Router:
    def __init__(self):
        self.finance = FinanceExpert()
        self.technic = TechnicExpert()
        self.legal = LegalExpert()

    def route(self, req: ChatRequest) -> ChatResponse:
        prompt_lower = req.prompt.lower()
        
        # 1. AI ROUTING (If Available)
        if AI_AVAILABLE and ai_client:
            try:
                # Simple routing prompt for Gemini
                sys_prompt = "You are the Router. Classify intent into: FINANCE, TECHNIC, LEGAL, or GENERAL. Reply with just the category."
                response = ai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=req.prompt,
                    config=types.GenerateContentConfig(system_instruction=sys_prompt)
                )
                intent = response.text.strip().upper()
                
                if "FINANCE" in intent: return self.finance.process(req.prompt)
                if "TECHNIC" in intent: return self.technic.process(req.prompt)
                if "LEGAL" in intent: return self.legal.process(req.prompt)
                
                # Fallback to general AI response
                return ChatResponse(text=f"**ADA CORE (AI):** {response.text}", mode="AI")
            except Exception as e:
                logger.error(f"AI Routing failed: {e}. Falling back to Heuristics.")
        
        # 2. HEURISTIC ROUTING (Simulation Mode)
        logger.info(f"Routing via Heuristics: {prompt_lower}")
        
        if any(x in prompt_lower for x in ['invoice', 'pay', 'debt', 'money', 'bill']):
            return self.finance.process(req.prompt)
        
        if any(x in prompt_lower for x in ['repair', 'service', 'technic', 'fix', 'schedule', 'lift']):
            return self.technic.process(req.prompt)
            
        if any(x in prompt_lower for x in ['law', 'rule', 'contract', 'penalty', 'legal']):
            return self.legal.process(req.prompt)

        return ChatResponse(
            text="**ADA CORE (SIMULATION):** Command received. System is operational. Please specify a domain (Finance, Tech, Legal).",
            mode="SIMULATION"
        )

router = Router()

# --- API ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "online", "ai_enabled": AI_AVAILABLE, "version": "4.0.0"}

@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main entry point for the Frontend Orchestrator.
    """
    logger.info(f"Received chat request: {request.prompt}")
    response = router.route(request)
    return response

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
