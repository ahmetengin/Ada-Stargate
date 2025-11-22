
// services/wimMasterData.ts

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
      },
      "dedicated_locations": {
        "fuel_station": {
          "label": "Fuel Station (Lukoil)",
          "coordinates": { "lat": 40.9618, "lng": 28.6645 }
        },
        "customs_area": {
           "label": "Customs & Passport Control",
           "coordinates": { "lat": 40.9635, "lng": 28.6625 }
        }
      },
      "pontoons": [
          { "label": "Pontoon A", "relative_position": { "lng_offset": -0.002, "lat_offset": 0.001, "width_scale": 0.5, "length_scale": 4 } },
          { "label": "Pontoon B", "relative_position": { "lng_offset": -0.001, "lat_offset": 0.001, "width_scale": 0.5, "length_scale": 5 } },
          { "label": "Pontoon C", "relative_position": { "lng_offset": 0, "lat_offset": 0.001, "width_scale": 0.5, "length_scale": 5 } },
          { "label": "Pontoon D", "relative_position": { "lng_offset": 0.001, "lat_offset": 0.001, "width_scale": 0.5, "length_scale": 5 } },
          { "label": "VIP Quay", "relative_position": { "lng_offset": 0.002, "lat_offset": 0, "width_scale": 0.8, "length_scale": 6 } }
      ]
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
  "security_policy": {
    "authority": "ada.passkit (IAM Node)",
    "data_sovereignty": {
        "ada_sea": "Autonomous Node (Captain Owned). Internal telemetry (fuel, battery, interior) is PRIVATE. Cannot be queried by Marina.",
        "ada_marina": "Infrastructure Node. Shore power, water meter, CCTV (Public Areas), and Mooring data is VISIBLE.",
        "kvkk_status": "Strict Enforcement. Personal data is masked at rest and in transit."
    },
    "data_classification": {
      "PUBLIC (Level 0)": ["Vessel Name", "Hail Port", "ETA (Approx)", "VHF Channel", "AIS Position"],
      "PRIVATE (Level 1 - Captain Only)": ["Exact Location (Pontoon)", "Crew List", "Battery Status", "Fuel Level", "Provisions"],
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
      { "id": "T-01", "name": "ada.sea.wimAlfa", "status": "Idle", "type": "Pilot/Tender" },
      { "id": "T-02", "name": "ada.sea.wimBravo", "status": "Idle", "type": "Pilot/Tender" },
      { "id": "T-03", "name": "ada.sea.wimCharlie", "status": "Maintenance", "type": "Technical/Rescue" }
    ] as any[],
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
      "holding_area": {
          "name": "Sector Zulu",
          "location": "1nm South of Breakwater",
          "rules": "Maintain 3 cables separation. Anchor ready."
      },
      "ambarli_integration": {
          "name": "Ambarlı Port Authority",
          "type": "Commercial Port",
          "traffic_types": ["Container Ship", "Tanker", "Ro-Ro"],
          "rules": "Pleasure craft must yield to commercial traffic > 50m.",
          "monitor_channel": "12"
      },
      "priority_hierarchy": [
          "LEVEL 1: Emergency (Mayday/Pan Pan) / State Vessels",
          "LEVEL 2: Medical Emergency / Fuel Critical",
          "LEVEL 3: Commercial Passenger Traffic (Scheduled Ferries)",
          "LEVEL 4: VIP / Superyachts (>40m) / High Value Assets",
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
          }
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
