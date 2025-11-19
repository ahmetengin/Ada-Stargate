
# ⚓️ ADA - MARITIME INTELLIGENCE

<div align="center">

![System Status](https://img.shields.io/badge/SYSTEM-OPERATIONAL-success?style=for-the-badge&logo=radar)
![AI Core](https://img.shields.io/badge/AI_CORE-GEMINI_PRO_3.0-purple?style=for-the-badge&logo=google-gemini)
![Nodes](https://img.shields.io/badge/FLEET_NODES-602_ACTIVE-blue?style=for-the-badge&logo=docker)
![Privacy](https://img.shields.io/badge/PRIVACY-ZERO_TRUST-red?style=for-the-badge&logo=guard)

```text
    _    ____      _    
   / \  |  _ \    / \   
  / _ \ | | | |  / _ \  
 / ___ \| |_| | / ___ \ 
/_/   \_\____/ /_/   \_\
                        
[ ORCHESTRATING THE SILENCE OF THE SEA ]
```

**"Sen yoktun o zaman. Ama şimdi varsın, ve Ada o deneyimi ölçeklendiriyor."**

</div>

---

## 🌊 What is Ada?

Ada is not just a chatbot. It is a **living, breathing, distributed multi-agent ecosystem** designed for the maritime world. 

It simulates a massive network of **600+ autonomous vessels** docked at **West Istanbul Marina (WIM)**. Each vessel is a silent, privacy-first node (`ada.sea.*`), communicating with the central Orchestrator (`ada.marina.wim`) only when necessary.

It listens to the radio. It manages finances. It predicts the weather. It protects the captain.

## 🚀 Mission Control Capabilities

### 📡 The "VHF Sentinel" (Always Listening)
Ada doesn't just read text; she **listens**. 
*   **Real-time Audio Analysis:** Monitors **Channel 73 (Marina)** and **Channel 16 (Emergency)** 24/7.
*   **Speech-to-Action:** Transcribes radio chatter, detects "MAYDAY" or "PAN PAN" signals, and instantly alerts the operations desk.
*   **Visualizer:** A specialized VHF HUD for the operator.

### 🧠 The "Brain" (Gemini 3.0 Pro)
*   **Reasoning Engine:** Utilizing Google's latest **Gemini 3.0 Pro** with deep thinking enabled.
*   **Context Aware:** Knows the difference between a 40ft Catamaran and a 90ft Superyacht.
*   **Hybrid Architecture:** Combines raw telemetry (battery, wind) with high-level reasoning.

### 🛡️ "Kaptan Ne Derse O Olur" (Privacy First)
*   **Zero Trust Architecture:** Every `ada.sea` node is a black box. 
*   **Local-First Data:** Battery levels, GPS history, and crew lists stay ON THE BOAT.
*   **Captain's Authority:** Data is only transmitted to the marina when the Captain explicitly authorizes a transaction (e.g., Check-in).

## 📟 The Interface: "Operations Deck"

The UI is built like a modern **Agentic IDE**.
*   **Left Wing:** Sidebar controls & VHF Tuner.
*   **Center Stage:** The Agent Chat (Orchestrator).
*   **Right Wing (Canvas):** The **Live Event Bus**. A Matrix-style feed of every signal, heartbeat, and handshake occurring across the 600-node fleet.

---

## 🛠️ Tech Stack

*   **Core:** React 19 + TypeScript + Tailwind CSS
*   **Intelligence:** Google GenAI SDK (Gemini 3.0 Pro & 2.5 Flash)
*   **Voice:** Web Audio API + Gemini Live (WebSocket Streaming)
*   **Infrastructure:** Docker (Multi-stage) + Nginx
*   **Simulation:** Custom-built Node Event Emitter Engine

---

## ⚡️ Quick Start

Want to wake the giant?

```bash
# 1. Clone the frequency
git clone https://github.com/ahmetengin/Ada.git

# 2. Inject the soul (API Key)
cp .env.template .env

# 3. Launch the fleet (Docker)
docker-compose up -d --build
```

> *For detailed manual instructions, check [INSTALL.md](./INSTALL.md).*

---

## 💙 Dedication

This project is built with passion for the sea, code, and the future of autonomous agents. 

**Ada** is dedicated to every Captain who has ever navigated through a storm, waiting for a calm voice on the radio.

> *Fair winds and following seas.*

---
<div align="center">
  <sub>Designed & Engineered by <b>Ahmet Engin</b></sub>
</div>