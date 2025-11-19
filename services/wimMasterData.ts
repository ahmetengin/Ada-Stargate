
export const wimMasterData = {
  "identity": {
    "name": "West Istanbul Marina",
    "code": "WIM",
    "operator": "Enelka Taahhüt İmalat ve Ticaret A.Ş.",
    "location": {
      "district": "Beylikdüzü",
      "neighborhood": "Yakuplu",
      "city": "Istanbul",
      "country": "Turkey",
      "coordinates": {
        "lat": 40.9634,
        "lng": 28.6289
      }
    },
    "vision": "To provide a clean, safe and agreeable living and working environment for Yachts and Owners.",
    "contact": {
      "vhf_channels": {
        "public": ["73", "16"],
        "internal_ops": ["14"],
        "vts_sectors": ["11", "12", "13"] 
      },
      "call_sign": "West Istanbul Marina"
    }
  },
  "security_policy": {
    "authority": "ada.passkit (IAM Node)",
    "data_classification": {
      "PUBLIC (Level 0)": ["Vessel Name", "Hail Port", "ETA (Approx)", "VHF Channel"],
      "PRIVATE (Level 1 - Captain)": ["Exact Location (Pontoon)", "Crew List", "Battery Status", "Provisions"],
      "RESTRICTED (Level 5 - GM)": ["Financial Debt", "Legal Disputes", "Full Telemetry History", "Security Logs"]
    },
    "protocols": {
      "kvkk_compliance": "Strictly enforce Article 20. No personal data on public channels (Ch 73).",
      "gdpr_compliance": "Right to be forgotten active. Data encryption required for Level 1+."
    }
  },
  "assets": {
    "tenders": [
      { "id": "T-01", "callsign": "Tender Alpha", "type": "Palamar Botu", "status": "Active" },
      { "id": "T-02", "callsign": "Tender Bravo", "type": "Palamar Botu", "status": "Active" },
      { "id": "T-03", "callsign": "Tender Charlie", "type": "Palamar Botu", "status": "Standby" }
    ]
  },
  "legal_framework": {
    "governing_law": "Republic of Türkiye",
    "jurisdiction": "Istanbul Central Courts & Enforcement Offices (Article K.1)",
    "currency": "EUR",
    "payment_terms": "Advance Payment (Peşin)",
    "contract_types": ["Mooring", "Lifting", "Launching", "Dry Berthing"]
  },
  "operational_rules": {
    "navigation": {
      "max_speed_sea": "3 knots (Article E.1.10)",
      "max_speed_land": "10 km/h (Article G.1)",
      "anchoring": "Strictly Prohibited within Marina"
    },
    "safety": {
      "swimming": "Prohibited (Article F.10)",
      "fishing": "Prohibited (Article F.10)",
      "water_sports": "Prohibited (Jet Ski, Diving)",
      "fire_safety": "Open fire/BBQ prohibited (Article F.12). Hot works require permit."
    },
    "tender_operations": {
      "workflow": "Public contact Ch 73 -> Handover to Tender Ch 14",
      "priority": ["Emergency", "Superyachts (>40m)", "Racing Yachts (VO65)", "Standard"],
      "maneuver_assist": "Mandatory for vessels >20m or high wind conditions"
    },
    "environment": {
      "waste_disposal": "Designated areas only. Bilge discharge prohibited (Article F.13).",
      "noise_control": "Engine/Generator usage subject to authorization."
    }
  },
  "traffic_control": {
      "system_type": "ATC-Style Sequencing (Tower Control)",
      "holding_area": "Sector Zulu (1nm South of Breakwater)",
      "priority_hierarchy": [
          "LEVEL 1: Emergency (Mayday/Pan Pan) / State Vessels",
          "LEVEL 2: Maneuver Restricted (NUC/RAM/Deep Draft/Sail)",
          "LEVEL 3: Commercial Passenger Traffic (Scheduled Ferries)",
          "LEVEL 4: VIP / Superyachts (>40m)",
          "LEVEL 5: Standard Pleasure Craft (Motor)",
          "LEVEL 6: Tenders / Jet Skis"
      ],
      "separation_rules": {
          "standard": "3 minutes separation at entrance",
          "heavy_traffic": "Hold outbound traffic for inbound heavy vessels",
          "conflict_resolution": "Lower priority vessel holds at Sector Zulu."
      },
      "emergency_broadcast_protocols": {
          "code_red": {
              "condition": "Fire / Collision / Explosion",
              "broadcast_tr": "ACİL DURUM. TÜM İSTASYONLAR. LİMAN GİRİŞ-ÇIKIŞ KAPATILMIŞTIR. MEVCUT POZİSYONUNUZU KORUYUN.",
              "broadcast_en": "EMERGENCY. ALL STATIONS. PORT CLOSED. HOLD POSITION.",
              "action": "Block all traffic. Dispatch Fire Tenders."
          },
          "clear_fairway": {
              "condition": "Incoming Emergency Vessel / Deep Draft",
              "broadcast_tr": "DİKKAT. KANAL GİRİŞİNİ DERHAL BOŞALTIN. SANCAĞA KAÇIN.",
              "broadcast_en": "ATTENTION. CLEAR FAIRWAY IMMEDIATELY. ALTER COURSE TO STARBOARD."
          },
          "stand_by": {
              "condition": "Congestion / Traffic Conflict",
              "broadcast_tr": "TÜM TEKNELER. TRAFİK YOĞUNLUĞU NEDENİYLE BEKLEMEDE KALIN. SEKTÖR ZULU'DA ALARGA OLUN.",
              "broadcast_en": "ALL VESSELS. STAND BY DUE TO TRAFFIC. PROCEED TO ANCHORAGE AT SECTOR ZULU."
          }
      }
  },
  "colregs_integration": {
    "status": "ACTIVE",
    "priority_rules": {
      "rule_5": "Look-out: Maintain continuous visual/radar watch.",
      "rule_6": "Safe Speed: Adapt to visibility and traffic density.",
      "rule_15": "Crossing Situation: Starboard vessel is Stand-on (Privileged). Port vessel Gives-way.",
      "rule_18": "Responsibilities: Motor gives way to Sail/Fishing/NUC."
    },
    "bosphorus_rules": {
      "vts_channels": "Sector Kadikoy (12), Sector Kandilli (13), Sector Kavak (11)",
      "max_speed": "10 Knots",
      "traffic_separation": "Strict adherence to TSS lanes.",
      "current_warning": "Orkoz and currents up to 6 knots possible."
    }
  },
  "maritime_authorities": {
      "KEGM": {
          "name": "Kıyı Emniyeti Genel Müdürlüğü (Coastal Safety)",
          "role": "VTS, Pilotage, Salvage, Towage",
          "comms": "VHF Ch 11/12/13 (VTS), Ch 16 (Emergency)"
      },
      "SG": {
          "name": "Sahil Güvenlik (Coast Guard)",
          "role": "Security, Border Control, SAR, Pollution Control",
          "comms": "VHF Ch 08 / 16"
      },
      "Liman_Baskanligi": {
          "name": "Ambarlı Liman Başkanlığı (Harbour Master)",
          "role": "Port State Control, Permissions, Anchor Areas",
          "comms": "VHF Ch 16 / Phone"
      },
      "DZKK": {
          "name": "Deniz Kuvvetleri (Navy)",
          "role": "Restricted Zones, SAT/SAS Ops",
          "comms": "Special Circuits"
      }
  },
  "enforcement_protocols": {
    "role": "MARSHALL",
    "traffic_violations": {
      "sea_speeding": {
        "limit": "3 knots",
        "penalty": "500 EUR Fine",
        "escalation": "Contract Termination (Article E.1.10)"
      },
      "land_speeding": {
        "limit": "10 km/h",
        "action": "Immediate Entry Card Cancellation",
        "escalation": "Vehicle Ban from Marina (Article G.1)"
      }
    },
    "financial_default": {
      "action": "Right of Retention (Hapis Hakkı)",
      "consequence": "Vessel Seizure & Departure Ban (Article H.2)"
    },
    "overstay_penalty": {
        "article": "H.3",
        "formula": "Vessel Area (m2) * 4 EUR * Days Overstayed",
        "description": "Indemnity for remaining in marina after contract expiry"
    },
    "surveillance": {
      "integration": "YOLOv10 Camera System",
      "automated_actions": ["License Plate Recognition", "Speed Detection", "Face Recognition (Blacklist)"]
    }
  },
  "services": {
    "technical": {
      "travel_lift": "Available (Subject to appointment)",
      "haul_out": "Available",
      "pressure_wash": "Available"
    },
    "amenities": {
      "electricity": "Metered (16A-63A)",
      "water": "Metered",
      "fuel": "Station Available (Duty-free subject to conditions)",
      "security": "24/7 Private Security",
      "parking": "Designated areas only"
    }
  },
  "penalties": {
    "late_departure": "4 EUR per m2 per day (Article H.3)",
    "pollution": "2x cost of cleaning + Municipal Fine (Article F.13)",
    "contract_breach": "Immediate Termination without refund"
  }
};
