
# ⚓️ ADA OPERATIONAL BLUEPRINT (v3.2)

**Codename:** STARGATE  
**Tenant:** WEST ISTANBUL MARINA (WIM)  
**Mission:** Orchestrating the Silence of the Sea via Distributed Intelligence.

---

## 1. THE PHILOSOPHY: "THE WIM STANDARD"

We are not just managing a parking lot for boats. We are managing a **lifestyle**.
West Istanbul Marina is a 5-Gold Anchor facility. Our Digital Twin (Ada) must reflect this prestige.

### Core Tenets of Service Quality:
1.  **Anticipation, Not Reaction:** We do not wait for the Captain to ask for a tender. We see them on AIS 20 miles away, we calculate their ETA, and we dispatch the tender before they even pick up the radio.
2.  **The "Welcome Home" Protocol:** Arrival is the most critical touchpoint. It must be seamless, safe, and emotionally reassuring.
3.  **Data Sovereignty:** We respect the privacy of our elite clientele. We know everything we *need* to know to serve them, but we never intrude on what we *shouldn't* know.
4.  **Silence is Luxury:** The best technology is invisible. We reduce radio noise by automating coordination via data links, leaving the voice channel clear for warm, human-like hospitality.

---

## 2. SYSTEM ARCHITECTURE: THE "BIG 3"

The system operates on a hierarchical **"Cognitive Mesh"** architecture designed for zero-error execution.

### 🧠 Level 1: The ORCHESTRATOR (Ada Core)
*   **Role:** The Brain / Station Manager.
*   **Responsibility:** Understanding intent, routing requests, and maintaining the "WIM Persona".
*   **Behavior:** Strictly Professional, Authoritative yet Extremely Polite. Uses ATC-standard phraseology mixed with concierge warmth.

### 👔 Level 2: The EXPERTS (Domain Nodes)
*   **`ada.marina` (Ops):** Traffic Control, Berth Management, Radar/AIS Surveillance.
*   **`ada.finance` (CFO):** Real-time debt checks, automated invoicing (Parasut), payment links (Iyzico).
*   **`ada.legal` (Counsel):** RAG-based regulation enforcement (COLREGs, Contracts).
*   **`ada.technic` (Engineering):** Haul-out scheduling, Travel Lift management.
*   **`ada.customer` (Concierge):** Lifestyle management, loyalty scoring, personalized engagement.

### 🛠️ Level 3: The WORKERS (The Hands)
*   Deterministic code execution layers (Python/Typescript) running in sandboxed environments.
*   Examples: `calculate_overstay_penalty`, `scan_radar_sector`, `generate_qr_pass`.

---

## 3. OPERATIONAL PROTOCOLS

### A. The "Welcome Home" Protocol (Arrival)
*   **Trigger:** `ada.marina` detects a known vessel (WIM Fleet) entering the 20nm Radar Sector.
*   **Action:**
    1.  **Auto-scan:** Confirm vessel identity and contract status.
    2.  **Resource Alloc:** Pre-assign a berth (e.g., C-12).
    3.  **Asset Scramble:** Dispatch a Tender (e.g., `ada.sea.wimBravo`) to the breakwater.
    4.  **Proactive Hail:** Ada calls the vessel on VHF Ch 72 *before* they call us.
*   **Script:** *"S/Y Phisedelia, West Istanbul Marina. Welcome home. We have you on radar. Your berth at C-12 is prepped and shore power is ready. Tender Bravo is en route to escort you. Is there anything you require upon docking? Over."*

### B. The "Clear Skies" Protocol (Departure)
*   **Trigger:** Captain requests departure.
*   **Logic:**
    1.  **Finance Check:** Is the balance €0.00? (If yes -> Green Light).
    2.  **Traffic Check:** Is Ambarlı Port traffic clear?
    3.  **Tender Dispatch:** Send tender to assist with lines.
*   **Script:** *"Departure Authorized. Tender Alpha is at your stern. Fair winds."*

### C. The "Iron Dome" Protocol (Security & Traffic)
*   **ATC Sequencing:** All movements are treated like aircraft taxiing.
*   **Squawk Codes:** Every active vessel gets a 4-digit tracking code.
*   **Sector Zulu:** The holding area for vessels when the port is congested or payment is pending.

---

## 4. DATA PRIVACY & KVKK (GDPR)

*   **Public Data:** Vessel Name, Location (At Sea), ETA.
*   **Private Data:** Crew List, Battery Levels, Fuel, Interior Status.
*   **Rule:** Ada *never* asks for private data unless necessary for safety. Telemetry is owned by the Captain (`ada.sea`).

---

## 5. THE TACTICAL INTERFACE (UX/UI)

The interface is designed for **High-Cognitive Load** environments (Bridge, Tower, Control Room). It prioritizes speed, clarity, and dark-mode adaptation for night watches.

### A. The "Matrix" Identity Scanner
*   **Concept:** Zero-Friction Check-in.
*   **Technology:** Real-time Optical Character Recognition (OCR) with HUD Overlay.
*   **Privacy:** No photos are taken or stored. The system extracts MRZ data (Machine Readable Zone) from passports in volatile memory, generates a PassKit token, and discards the raw image immediately.
*   **Speed:** < 2 seconds from scan to verification.

### B. The Command Canvas (Radar & Fleet)
*   **Live Radar:** Integrates AIS data + simulated Ambarlı Commercial Traffic. Displays Squawk Codes, Speed (SOG), and Distance to Marina.
*   **Asset Tracking:** Real-time status of WIM Tenders (`ada.sea.wim*`).
    *   *Green:* Idle
    *   *Yellow:* Mission Active (e.g., "Escorting Phisedelia")
    *   *Red:* Maintenance
*   **Visual Hierarchy:** Alerts and "OP" (Operational) logs are highlighted to cut through the noise.

---

## 6. THE CAPTAIN'S DIGITAL TWIN (Ada Sea ONE)

This module transforms the vessel from a passive object into an intelligent, communicating node (`ada.sea.<vessel_id>`).

### A. The "Digital Leash" Strategy
We offer extreme convenience to lock the customer into the WIM ecosystem.
*   **Remote Control:** Captains can set AC temperature, turn on underwater lights, or check security cameras via Ada *before* they arrive at the boat.
*   **Lock-in Effect:** Moving to another marina means losing this "Smart Boat" capability (as the local mesh network is hosted by WIM).

### B. Telemetry & Engineering
*   **Visuals:** Gauge-style indicators for Battery (Service/Engine), Tank Levels (Fuel/Black Water), and Shore Power status.
*   **Alerts:** "Black Water Tank > 80%. Auto-request Pump-out?" (Proactive Upsell).
*   **Privacy Shield:** This data is encrypted. The Marina (GM View) sees "ENCRYPTED". Only the Captain sees the values.

### C. The Upsell Protocol
*   If a vessel does not have the hardware, the dashboard shows blurred data with a "Connect Ada Sea ONE" CTA.
*   **Value Prop:** "Give your boat a voice."

---

## 7. THE NARRATIVE LOGBOOK (EPISODES)

We treat daily operations not as a database list, but as a **Season/Episode** narrative.

*   **Stardate Format:** Operations are logged with cinematic timestamps (e.g., `STARDATE 2025.11.20`).
*   **The "Episode":** Each day is an episode.
    *   *Opening Scene:* Morning Weather Briefing & Staff Roll Call.
    *   *Plot Points:* Arrival of a VIP vessel, a sudden storm (Gale Warning), a technical failure.
    *   *Closing Scene:* Night Watch Handover.
*   **Semantic Memory:** Ada remembers "That windy Tuesday when Phisedelia had engine trouble," not just "Job #1024".

---

**"Excellence is not an act, but a habit."**
*Ada Stargate v3.2*
