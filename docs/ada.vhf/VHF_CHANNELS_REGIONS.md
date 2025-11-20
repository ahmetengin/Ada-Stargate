# Regional Marina & Port Channel List and Automation Protocols

**Date:** 18 November 2025  
**Status:** Current  
**Standard:** IMO SMCP (Standard Marine Communication Phrases) Compliant

This document defines which VHF channel the autonomous vessel nodes (`ada.sea.*`) in the Ada ecosystem should monitor based on their geographical location and how they should automatically respond to marina calls.

---

## 📍 Regional Channel List (Geo-Fencing)

Ada nodes automatically set their "Primary Watch" channel to the following, based on their GPS location, in order of priority.

| Priority | Region | Channel | Frequency (MHz) | Typical Users |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Marmara Sea** | **72** | 156.625 | West Istanbul Marina, Ataköy, Kalamış, Setur Fenerbahçe |
| **2** | **Bosphorus Strait** | **12** | 156.600 | VTS Istanbul, Bosphorus Traffic |
| **3** | **Dardanelles Strait** | **73** | 156.675 | Çanakkale Marina, Kepez Port |
| **4** | **North Aegean** | **74** | 156.725 | Ayvalık, Dikili, Foça, Kuşadası |
| **5** | **Central Aegean** | **72** | 156.625 | Çeşme, Alaçatı Port, Sığacık, Didim D-Marin |
| **6** | **South Aegean** | **71** | 156.600 | Bodrum (all marinas), Yalıkavak Palmarina, Turgutreis |
| **7** | **Göcek – Fethiye** | **72** | 156.625 | Skopea Port, Göcek (D-Marin, Marinturk), Fethiye |
| **8** | **Marmaris** | **74** | 156.725 | Netsel, Yacht Marin, Albatros |
| **9** | **Greek Islands (North)** | **71** | 156.600 | Mykonos, Paros, Naxos, Kos, Rhodes (Mandraki) |
| **10** | **Greek Islands (South)** | **09** | 156.450 | Santorini, Crete (Many islands use 09) |

> **Note:** Channel 16 (156.800 MHz) is always monitored in the background in "Dual Watch" mode, regardless of the region.

---

## 🤖 Automated Operation Logic

The `ada.vhf` node follows this logical flow:

1.  **Location Determination:** Checks GPS position upon startup or every hour.
2.  **Channel Selection:** Identifies the nearest region from the table and locks the RTL-SDR to that region's marina channel (e.g., Ch 72 for Marmara).
3.  **Continuous Listening:**
    *   When a signal is detected, the **OpenAI Whisper API** is activated.
    *   Audio is transcribed to text in real-time (STT).
4.  **Trigger Detection:**
    *   The system wakes up if the text contains **"ADA SEA"** or the vessel's own name (e.g., **"PHISEDELIA"**).
5.  **Response Generation:**
    *   The LLM analyzes the context.
    *   PTT (Push-to-Talk) is triggered within 1-2 seconds.
    *   A response compliant with the SMCP standards below is broadcast via TTS (Text-to-Speech).
6.  **Logging:** The entire conversation is written to the OLED screen and saved to the `ada.orchestrator` database.

---

## 🗣️ Example Automated Responses (SMCP + Turkish Practice)

The system automatically distinguishes between Turkish and English calls and responds in the same language.

### Scenario 1: Marina Call
**Marina:** "Ada Sea, Kalamış Marina."
**Ada (TR):** "Kalamış Marina, burada Ada Sea, kanal 72, dinlemede."
**Ada (EN):** "Kalamış Marina, this is Ada Sea, standing by channel 72."

### Scenario 2: Requesting Mooring Info
**Marina:** "Ada Sea, berth assignment?"
**Ada (TR):** "Ada Sea, giriş için berth bilgisi rica ediyorum."
**Ada (EN):** "Ada Sea, requesting berth assignment."

### Scenario 3: Berthing Instruction
**Marina:** "Ada Sea, proceed to C-12."
**Ada (TR):** "Anlaşıldı, C-12’ye ilerliyorum, palamar ekibi rica ediyorum."
**Ada (EN):** "Understood, proceeding to C-12, requesting linesmen."

### Scenario 4: Departure Clearance
**Vessel:** "Ada Sea, departure clearance?"
**Ada (TR):** "Ada Sea, çıkış onayı rica ediyorum."
**Ada (EN):** "Ada Sea, requesting departure clearance."

### Scenario 5: Acknowledgment
**Marina:** "Ada Sea, you are cleared."
**Ada (TR):** "Onay için teşekkürler, iyi çalışmalar."
**Ada (EN):** "Clearance acknowledged, thank you, good watch."

### Scenario 6: Greek Port Entry
**Vessel:** "Mandraki port control, this is sailing yacht Ada Sea on channel 71, requesting berthing instructions."
*(Note: English is standard in Greek waters)*