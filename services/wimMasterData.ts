// services/wimMasterData.ts

// No longer importing from itself, as the object is defined in this file.
export const wimMasterData = {
  "identity": {
    "name": "West Istanbul Marina",
    "code": "WIM",
    "alias": "Beylikdüzü Marina",
    "operator": "Enelka Taahhüt İmalat ve Ticaret A.Ş.",
    "awards": ["5 Gold Anchors", "Blue Flag (10 Years Continuous)"],
    "location": {
      "district": "Beylikdüzü",
      "neighborhood": "Yakuplu",
      "city": "Istanbul",
      "country": "Turkey",
      "coordinates": {
        "lat": 40.9628,
        "lng": 28.6636
      }
    },
    "vision": "To provide a clean, safe and agreeable living and working environment for Yachts and Owners.",
    "contact": {
      "vhf_channels": {
        "public": ["72", "16"],
        "internal_ops": ["14"],
        "vts_sectors": ["11", "12", "13"] 
      },
      "call_sign": "West Istanbul Marina",
      "phone": "+90 212 850 22 00"
    }
  },
  "api_integrations": {
      "kpler_ais": {
          "name": "Kpler Marine Traffic MCP",
          "endpoint_live": "https://api.kpler.com/v1/ais/wim-region/live",
          "endpoint_vessel_intel": "https://api.kpler.com/v1/vessels/details",
          "documentation": "https://docs.kpler.com/mcp-ais-api"
      },
      "parasut_api": {
          "name": "Parasut Accounting & E-Invoicing",
          "endpoint_invoices": "https://api.parasut.com/v4/sales_invoices",
          "endpoint_clients": "https://api.parasut.com/v4/clients",
          "documentation": "docs/parasut_apidok.md"
      },
      "iyzico_api": {
          "name": "Iyzico Payment Gateway",
          "endpoint_payment_link": "https://api.iyzico.com/payment/auth",
          "endpoint_notifications": "https://api.ada.marina/payment/notification",
          "documentation": "docs/iyzico_api_integration.md"
      },
      "garanti_bbva_api": {
          "name": "Garanti BBVA Bank API",
          "endpoint_transactions": "https://api.garantibbva.com.tr/accounts/transactions",
          "endpoint_balance": "https://api.garantibbva.com.tr/accounts/balance",
          "documentation": "docs/garanti_bbva_api_integration.md"
      }
  },
  "system_architecture": {
      "philosophy": "Agentic IDE (Code-First Paradigm)",
      "core_stack": "Claude Code + Bash + Skills + Context Engineering",
      "observability": "Code Hooks -> Bun/SQLite -> Vue Dashboard",
      "orchestration_model": "FastRTC Mesh + Gemini 3.0 Pro / Claude 3.5 Sonnet",
      "documentation_path": "docs/architecture/",
      "components": {
          "skills": "Modular capabilities (Sea, Travel, Marina) defined as code.",
          "context": "Unified Context Architecture (.claude/context/)",
          "mcp_builder": "Self-generating FastMCP servers for tool execution.",
          "seal": "Self-Adapting Language Models for regulation learning."
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
      "kvkk_compliance": "Strictly enforce Article 20. No personal data on public channels (Ch 72).",
      "gdpr_compliance": "Right to be forgotten active. Data encryption required for Level 1+."
    }
  },
  "weather_station": {
      "node": "ada.weather.wim",
      "sources": [
          { "name": "Poseidon System", "region": "Aegean/Marmara", "priority": 1 },
          { "name": "Windy.com (ECMWF)", "type": "Global Model", "priority": 2 },
          { "name": "OpenWeatherMap", "type": "API", "priority": 3 }
      ],
      "alert_thresholds": {
          "small_craft_advisory": "Wind > 22 knots",
          "gale_warning": "Wind > 34 knots",
          "storm_warning": "Wind > 48 knots",
          "thunderstorm": "Lightning probability > 40%"
      },
      "reporting_protocol": {
          "frequency": "Daily 08:00 & 18:00 + On Demand",
          "format": "3-Day Outlook (Morning/Afternoon/Night)",
          "proactive_alert": "Broadcast immediately if thresholds exceeded."
      }
  },
  "assets": {
    "tenders": [
      { "id": "T-01", "callsign": "Tender Alpha", "type": "Mooring Boat", "status": "Active" },
      { "id": "T-02", "callsign": "Tender Bravo", "type": "Mooring Boat", "status": "Active" },
      { "id": "T-03", "callsign": "Tender Charlie", "type": "Mooring Boat", "status": "Standby" }
    ],
    "capacities": {
        "total_area": "155.000 m2",
        "sea_berths": 600,
        "land_park": 300,
        "rack_park": "96 (up to 7m)",
        "hangars": "11 (up to 90m)",
        "hardstanding": "60.000 m2"
    },
    "berth_map": {
        "A": { "type": "Concrete", "max_loa": 25, "depth": 5.5, "capacity": 40, "status": "90%" },
        "B": { "type": "Concrete", "max_loa": 20, "depth": 4.5, "capacity": 50, "status": "85%" },
        "C": { "type": "Concrete", "max_loa": 15, "depth": 4.0, "capacity": 60, "status": "FULL" },
        "VIP": { "type": "Quay", "max_loa": 90, "depth": 8.0, "capacity": 10, "status": "AVAILABLE" },
        "T": { "type": "T-Head", "max_loa": 40, "depth": 6.0, "capacity": 8, "status": "AVAILABLE" }
    }
  },
  "legal_framework": {
    "governing_law": "Republic of Türkiye",
    "jurisdiction": "Istanbul Central Courts & Enforcement Offices (Article K.1)",
    "currency": "EUR",
    "payment_terms": "Advance Payment",
    "contract_types": ["Mooring", "Lifting", "Launching", "Dry Berthing"],
    "base_pricing": {
        "mooring_daily": 1.5, // EUR per m2
        "electricity": 0.35, // EUR per kW
        "water": 3.50 // EUR per m3
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
              "broadcast_tr": "EMERGENCY. ALL STATIONS. PORT IS CLOSED. HOLD YOUR PRESENT POSITION.",
              "broadcast_en": "EMERGENCY. ALL STATIONS. PORT IS CLOSED. HOLD YOUR PRESENT POSITION.",
              "action": "Block all traffic. Dispatch Fire Tenders."
          },
          "clear_fairway": {
              "condition": "Incoming Emergency Vessel / Deep Draft",
              "broadcast_tr": "ATTENTION. CLEAR FAIRWAY IMMEDIATELY. ALTER COURSE TO STARBOARD.",
              "broadcast_en": "ATTENTION. CLEAR FAIRWAY IMMEDIATELY. ALTER COURSE TO STARBOARD."
          },
          "stand_by": {
              "condition": "Congestion / Traffic Conflict",
              "broadcast_tr": "ALL VESSELS. STAND BY DUE TO TRAFFIC. PROCEED TO ANCHORAGE AT SECTOR ZULU.",
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
          "name": "Directorate General of Coastal Safety",
          "role": "VTS, Pilotage, Salvage, Towage",
          "comms": "VHF Ch 11/12/13 (VTS), Ch 16 (Emergency)"
      },
      "SG": {
          "name": "Coast Guard",
          "role": "Security, Border Control, SAR, Pollution Control",
          "comms": "VHF Ch 08 / 16"
      },
      "Liman_Baskanligi": {
          "name": "Ambarlı Harbour Master",
          "role": "Port State Control, Permissions, Anchor Areas",
          "comms": "VHF Ch 16 / Phone"
      },
      "DZKK": {
          "name": "Naval Forces",
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
      "action": "Right of Retention",
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
      "travel_lift_major": "700 Ton Travel Lift (Mega Yachts)",
      "travel_lift_minor": "75 Ton Travel Lift",
      "haul_out": "Available (60.000m2 Hardstanding)",
      "pressure_wash": "Available",
      "bilgin_yachts": "Shipyard On-site"
    },
    "amenities": {
      "restaurants": [
        "Poem Restaurant", "Port Of Point", "The Roof Kingdom Kitchen & Bar", "FERSAH RESTAURANT",
        "LAMORE BALIK - ET MANGALBAŞI", "ISKARMOZ RESTAURANT", "CALİSTO BALIK", "Can samimiy et",
        "Seferi Ocakbaşı Meyhane", "Sade coffee & drink", "Mask Beach Music & Food", "ELLA ITALIAN",
        "Happy Moon's", "Deniz Kızı Şefin Yeri", "Zeytinlik Balık", "Pargalı Rum meyhanesi",
        "West Maya Marin", "Quki Meyhane", "Big Chefs", "İkitek Ocakbaşı", "Sefam Olsun Meyhane",
        "Spoint Meyhane", "Mavi Mey-hane", "Cümbüş Yeni Nesil Marina", "West Kanat", "Fısıltı Lounge"
      ],
      "lifestyle": [
        "Kumsal Istanbul Street", "Kumsal Beach", "Yacht Club", 
        "Mask Beach", "Paris Saint-Germain Academy Beylikdüzü"
      ],
      "sports": [
        "West Life Sports Club", "Fitness", "Sauna", "Indoor/Outdoor Pools", 
        "WEST Istanbul Marina Tennis Sports Club", "Basketball", "Football", "Sailing School (TYF/RYA)"
      ],
      "shopping": "Shopping Center & Market, BoatFest For-Sale Boat Pontoon",
      "electricity": "Metered (16A-63A) + Fiber Internet",
      "water": "Metered",
      "fuel": "Station Available (Duty-free subject to conditions)",
      "security": "24/7 Private Security + Helipad + Customs Gate",
      "parking": "550 Car Capacity",
      "atm": "Garanti BBVA ATM"
    }
  },
  "penalties": {
    "late_departure": "4 EUR per m2 per day (Article H.3)",
    "pollution": "2x cost of cleaning + Municipal Fine (Article F.13)",
    "contract_breach": "Immediate Termination without refund"
  }
};