import { SampleDoc } from '../types';

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    id: 'sample-pdf',
    name: 'Quarterly_Financial_Report.pdf',
    type: 'pdf',
    category: 'pdf',
    size: '142 KB',
    description: 'Executive overview with balance tables, performance indicators, and key takeaways.',
    mockMarkdown: `# Acme Corp - Q3 Financial Performance Summary

**Reporting Period:** July 1, 2026 – September 30, 2026  
**Published by:** Office of the Chief Financial Officer  
**Auditor Status:** Reviewed by External Independent Auditors  

---

## Executive Overview

Acme Corp achieved record net revenues of **$84.2M**, representing an **18.4% YoY growth** driven primarily by enterprise expansion in cloud services and automated AI workflows. Operating income surged to **$21.6M** with healthy margins maintained across all three principal operating divisions.

### Core Highlights

- **Net Revenue:** $84.2 million (+18.4% YoY)
- **Gross Margin:** 71.2% (expanded by 240 bps)
- **Free Cash Flow:** $19.4 million
- **Active Enterprise Accounts:** 1,420 (+210 accounts added in Q3)

---

## Revenue Breakdown by Product Line

| Business Segment | Q3 2025 ($M) | Q3 2026 ($M) | YoY Change (%) | Contribution (%) |
| :--- | :---: | :---: | :---: | :---: |
| Cloud Infrastructure | $32.4 | $41.8 | +29.0% | 49.6% |
| Enterprise SaaS Suite | $26.1 | $29.2 | +11.9% | 34.7% |
| Advisory & Support | $12.6 | $13.2 | +4.8% | 15.7% |
| **Total Consolidated** | **$71.1** | **$84.2** | **+18.4%** | **100.0%** |

---

## Key Strategic Initiatives

1. **Global Data Center Rollout**  
   Completed primary deployment in Frankfurt and Tokyo to satisfy data residency requirements for Fortune 500 financial clients.
2. **AI Integration Tier**  
   Over 62% of standard recurring accounts adopted the newly introduced autonomous agentic capabilities within 45 days of launch.
3. **Operational Discipline**  
   Sales & marketing expense settled at **22.4%** of top-line revenue, improving by 180 bps compared to previous quarters.

> *"Our sustained focus on capital efficiency combined with aggressive product execution has positioned Acme Corp for accelerated profitability heading into FY2027."*  
> — **Sarah Jenkins**, Chief Financial Officer
`,
  },
  {
    id: 'sample-word',
    name: 'Project_Specification_Blueprint.docx',
    type: 'word',
    category: 'word',
    size: '86 KB',
    description: 'Formatted Word document with project milestones, architecture overview, and team responsibilities.',
    mockMarkdown: `# Engineering Blueprint: Multi-Engine Distributed Pipeline

**Document Version:** 2.4.0  
**Authors:** Architecture Review Board (Lead: Alex Mercer)  
**Status:** Approved for Implementation  
**Target Milestone:** Release Candidate v3.1  

---

## 1. Project Objectives

The purpose of this specification is to define the architectural boundary conditions, communication protocols, and schema standards for the high-throughput file ingestion system.

- **Throughput SLA:** Ingestion under 400ms for payloads up to 10MB.
- **Resilience:** Graceful degradation on model rate-limit saturation.
- **Security:** In-memory transformation with zero persistent caching of plain customer documents.

---

## 2. Component Architecture

The transformation engine operates through three decoupled tiers:

\`\`\`
[ Client Browser ]
        │  (Direct Upload / Drag & Drop)
        ▼
[ Ingestion Gateway ]
        │
   ┌────┴──────────────────────────┐
   │                               │
   ▼                               ▼
[ Binary Parser (Mammoth/PDF) ]   [ Gemini Multimodal OCR ]
   │                               │
   └───────────────┬───────────────┘
                   ▼
       [ Markdown Synthesizer ]
                   │
                   ▼
         [ Sanitized Output ]
\`\`\`

---

## 3. Phase Deliverables & Responsibility Matrix

| Phase | Milestone Name | Tech Lead | Target Date | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | Ingestion & MIME Sniffing | D. Vance | Oct 12, 2026 | Completed |
| **Phase 2** | Multimodal OCR Pipeline | K. Tanaka | Nov 04, 2026 | In Progress |
| **Phase 3** | Cross-Format Table Normalization | M. Rossi | Nov 28, 2026 | Planned |
| **Phase 4** | End-to-End Stress Testing | S. Chen | Dec 15, 2026 | Planned |

---

## 4. Operational Guardrails

- [x] Enforce RFC 2046 MIME header verification prior to parsing.
- [x] Strip surrounding markdown code block wrappers automatically.
- [ ] Implement chunked streaming for documents exceeding 100 pages.
- [ ] Guarantee WCAG AA high-contrast compliance for rendered output.
`,
  },
  {
    id: 'sample-receipt',
    name: 'Bistro_Cafe_Receipt_Scan.jpg',
    type: 'image',
    category: 'image',
    size: '215 KB',
    description: 'High-resolution photo scan of a restaurant receipt with itemized totals and tax.',
    mockMarkdown: `# Scanned Receipt: The Green Mill Bistro

**Merchant:** The Green Mill Bistro & Espresso Bar  
**Address:** 482 Market Street, Suite 100, San Francisco, CA 94105  
**Phone:** (415) 555-0198  
**Date:** September 11, 2026 — 12:44 PM  
**Server:** Marcus T. | **Table:** 14  
**Order ID:** #TRX-89412  

---

## Itemized Charges

| Item | Qty | Unit Price | Total Price |
| :--- | :---: | :---: | :---: |
| Flat White (Oat Milk) | 2 | $5.75 | $11.50 |
| Avocado Sourdough Tartine | 1 | $14.50 | $14.50 |
| Truffle Herb Fries | 1 | $9.00 | $9.00 |
| Sparkling Water (750ml) | 1 | $6.50 | $6.50 |
| Gluten-Free Lemon Poppy Scone | 1 | $4.75 | $4.75 |

---

## Payment Breakdown

- **Subtotal:** $46.25
- **Local Sales Tax (8.625%):** $3.99
- **San Francisco Health Mandate (4%):** $1.85
- **Total Before Gratuity:** **$52.09**
- **Tip (20%):** $10.42
- **Grand Total Paid:** **$62.51**

---

### Payment Method
- **Card Type:** Visa Platinum ending in \`*4829\`
- **Auth Code:** \`04821A\`
- **Status:** APPROVED (Chip Verified)
`,
  },
  {
    id: 'sample-csv',
    name: 'Customer_Churn_Analysis.csv',
    type: 'text',
    category: 'sheet',
    size: '18 KB',
    description: 'CSV data export converted into formatted Markdown statistics and data tables.',
    mockMarkdown: `# Customer Retention & Churn Analysis (2026)

**Data Source:** Production Analytics Database  
**Sample Cohort:** 4,800 SaaS subscribers  
**Generated On:** September 2026  

---

## Retention by Tier

| Customer Tier | Total Accounts | Active (90d) | Churned | Churn Rate | Avg LTV |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Starter ($29/mo)** | 2,100 | 1,827 | 273 | 13.0% | $410 |
| **Pro ($99/mo)** | 1,850 | 1,739 | 111 | 6.0% | $1,880 |
| **Enterprise ($499+/mo)** | 850 | 833 | 17 | 2.0% | $14,200 |
| **Consolidated** | **4,800** | **4,399** | **401** | **8.35%** | **$3,420** |

---

## Key Observations

1. **Enterprise Stickiness:** Enterprise churn is suppressed at **2.0%** due to dedicated customer success managers and SSO integration.
2. **Onboarding Dropoff:** Over 68% of starter churn happens within the first 14 days of account activation.
3. **Action Items:** Introduce proactive in-app guided onboarding checklists to increase Day-7 retention.
`,
  },
];
