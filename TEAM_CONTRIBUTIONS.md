# 👥 Team Members & Contribution Breakdown

**Project Name**: EasyPay & SafePay — CyberCare Intelligence  
**Institution / Event**: REVA University Hackathon  
**Repository**: [https://github.com/Sarika1628/reva_safepay](https://github.com/Sarika1628/reva_safepay)  

---

## 🌟 Team Overview

| Member | GitHub Username | Role & Focus Area | Key Modules Owned |
| :--- | :--- | :--- | :--- |
| **Sarika M** *(Team Lead)* | [@Sarika1628](https://github.com/Sarika1628) | Fullstack Architecture & Security Lead | Backend Core, Database, Payment Simulator, Cloud Deployment |
| **Dhanyashree** | [@dhanyashree0409](https://github.com/dhanyashree0409) | AI & Fraud Intelligence Engineer | ML Scam Detector, 4-Tier Risk Engine, Screenshot Checker |
| **Syeda Zoya** | [@zoyasyeda2006](https://github.com/zoyasyeda2006) | Frontend & Senior Accessibility Lead | Two-Way AI Voice Assistant, Privacy Camera, UI Design System |

---

## 📋 Detailed Responsibility & Code Ownership Matrix

### 👤 Member 1: Sarika M ([@Sarika1628](https://github.com/Sarika1628))
**Role**: Team Lead & Fullstack Security Engineer
- **Architectural & Backend Foundation**:
  - Designed the decoupled FastAPI + React + SQLite system architecture.
  - Configured database ORM models ([`backend/app/models.py`](./backend/app/models.py)) and schema validation ([`backend/app/schemas.py`](./backend/app/schemas.py)).
  - Built sample dataset and senior persona seeders ([`backend/app/services/seed_data.py`](./backend/app/services/seed_data.py)).
- **Guided Payment Simulator**:
  - Implemented the safe 3-step payment flow: Form &rarr; Safety Review &rarr; Confirmation &rarr; Receipt.
  - Implemented amount limits, recipient validation, and demo transaction persistence ([`backend/app/routers/payments.py`](./backend/app/routers/payments.py)).
- **Cloud Deployment & DevOps**:
  - Authored multi-stage production container [`Dockerfile`](./Dockerfile).
  - Configured 1-click cloud deployment via [`render.yaml`](./render.yaml), [`Procfile`](./Procfile), and [`nixpacks.toml`](./nixpacks.toml).
  - Implemented unified SPA static routing in [`backend/app/main.py`](./backend/app/main.py) to eliminate CORS and serve the app from a single port.
- **Emergency Protection**:
  - Built 1-tap SOS Emergency Wallet Freeze ([`backend/app/routers/emergency.py`](./backend/app/routers/emergency.py)) and Golden Hour incident mitigation guidance.

---

### 👤 Member 2: Dhanyashree ([@dhanyashree0409](https://github.com/dhanyashree0409))
**Role**: AI & Fraud Intelligence Specialist
- **Machine Learning Scam Detection Pipeline**:
  - Built and trained the scikit-learn `TfidfVectorizer` + `LogisticRegression` pipeline ([`backend/app/ml/train.py`](./backend/app/ml/train.py)).
  - Curated transparent synthetic Indian payment fraud dataset ([`backend/app/ml/dataset.py`](./backend/app/ml/dataset.py)).
  - Built the local inference engine and hybrid rule override system ([`backend/app/ml/model_service.py`](./backend/app/ml/model_service.py)).
- **Rule-Based Fraud Engine & Overrides**:
  - Programmed 7 cyber fraud threat vectors: OTP theft, power disconnection threats, reverse PIN traps, lottery scams, remote access app APKs, authority impersonation ([`backend/app/services/scam_engine.py`](./backend/app/services/scam_engine.py)).
  - Enforced mandatory rule overrides: requests for OTPs, PINs, or AnyDesk/TeamViewer strictly override ML to CRITICAL / HIGH risk.
- **FEATURE 1: 4-Tier Conditional Scam-Risk Interface**:
  - Connected live backend scam assessments to distinct UI screens for `LOW`, `MEDIUM`, `HIGH`, and `CRITICAL` risk ([`frontend/src/components/ConditionalScamRiskInterface.jsx`](./frontend/src/components/ConditionalScamRiskInterface.jsx)).
  - Implemented the multi-step deliberate safety review flow for Critical risk with zero 1-click bypass.
- **Verification Tools**:
  - Developed the SQLite demo ledger Screenshot Checker ([`backend/app/services/screenshot_verifier.py`](./backend/app/services/scam_engine.py)).
  - Built the Community Scam Catalog ([`backend/app/routers/scam_shield.py`](./backend/app/routers/scam_shield.py)).

---

### 👤 Member 3: Syeda Zoya ([@zoyasyeda2006](https://github.com/zoyasyeda2006))
**Role**: Frontend & Senior Accessibility Lead
- **FEATURE 2: Two-Way AI Voice Assistant ("Speak to SafePay")**:
  - Integrated browser Web Speech API for voice recognition and text-to-speech ([`frontend/src/components/SafePayVoiceAssistant.jsx`](./frontend/src/components/SafePayVoiceAssistant.jsx)).
  - Implemented zero-cloud multilingual intent understanding across 4 regional languages: **English**, **Kannada**, **Hindi**, and **Telugu**.
  - Programmed architectural security guardrail: voice commands NEVER authorize payments alone.
- **FEATURE 3: Privacy-Conscious Camera & Face Features**:
  - Designed the dedicated Face Camera Demo interface ([`frontend/src/pages/FaceCameraDemo.jsx`](./frontend/src/pages/FaceCameraDemo.jsx)).
  - Local on-device face presence detection via browser Shape Detection API and canvas processing.
  - Implemented the zero-biometrics privacy safeguard (zero biometric data stored in SQLite or on disk).
  - Built the senior manual 4-digit PIN authentication alternative.
- **Accessibility & Design System**:
  - Implemented the EasySafePay Dark Obsidian and Electric Rose UI design system ([`frontend/src/App.css`](./frontend/src/App.css)).
  - Built AAA high-contrast modes (Yellow on Black, Dark, Clean), senior text zoom, and Silent Mode ([`frontend/src/components/AccessibilityBar.jsx`](./frontend/src/components/AccessibilityBar.jsx)).
  - Non-speaking visual payment card selector ([`frontend/src/pages/NonSpeakingQuickPay.jsx`](./frontend/src/pages/NonSpeakingQuickPay.jsx)).

---

## 🔀 Branching Strategy & GitHub Collaboration Workflow

To ensure clean code separation and professional git collaboration, the project follows a feature-branch workflow:

```
main (Production Ready)
 │
 ├── feature/backend-payment-core      (Sarika M)
 ├── feature/ml-fraud-detection        (Dhanyashree)
 └── feature/accessibility-voice-ui    (Team Member 3)
```

1. **`main`**: Protected branch containing passing tests, unified production build, and cloud configuration.
2. **`feature/backend-payment-core`**: Core FastAPI backend, models, payment simulator, and deployment configs.
3. **`feature/ml-fraud-detection`**: Scikit-learn ML pipeline, scam heuristics, and Conditional Risk UI.
4. **`feature/accessibility-voice-ui`**: Multilingual voice assistant, accessibility bar, face camera demo, and UI styling.
