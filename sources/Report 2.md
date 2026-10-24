

![][image1]

**CAPSTONE PROJECT REPORT**

**Report 2 – Project Management Plan**

–Ho Chi Minh, 2026 –

**Table of Contents**  
[I. Record of Changes	3](#i.-record-of-changes)

[II. Project Management Plan	4](#ii.-project-management-plan)

[1\. Overview	4](#1.-overview)

[1.1 Scope & Estimation	4](#1.1-scope-&-estimation)

[1.2 Project Objectives](#1.2-project-objectives)	5

[1.3 Project Risks](#1.3-project-risks)	6

[2\. Management Approach](#2.-management-approach)	7

[2.1 Project Process](#2.1-project-process)	7

[2.2 Quality Management](#2.2-quality-management)	8

[2.3 Training Plan](#2.3-training-plan)	9

[3\. Project Deliverables](#3.-project-deliverables)	9

[4\. Responsibility Assignments](#4.-responsibility-assignments)	10

[5\. Project Communications](#5.-project-communications)	10

[6\. Configuration Management](#6.-configuration-management)	11

[6.1 Document Management](#6.1-document-management)	11

[6.2 Source Code Management](#6.2-source-code-management)	11

[6.3 Tools & Infrastructures](#6.3-tools-&-infrastructures)	12

# **I. Record of Changes** {#i.-record-of-changes}

| Date | A\*M, D | In charge | Change Description |
| ----- | ----- | ----- | ----- |
| 17/08/2026 | A | KhanhMND | Draft doc for all sections |
| 18/08/2026 | A | NhanPNT | Refine the section Responsibility Assignments |
| 23/09/2026 | M | HieuDV | Aligned scope and planning with use-case SSOT; corrected WBS, quality, risks and configuration management |
| 25/09/2026 | M | HieuDV | Aligned the estimated effort of the team  |
| 29/09/2026 | M | NhanPNT | Standardize document formatting. |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |
|  |  |  |  |

\*A \- Added M \- Modified D \- Deleted

# **II. Project Management Plan** {#ii.-project-management-plan}

## **1\. Overview** {#1.-overview}

### **1.1 Scope & Estimation** {#1.1-scope-&-estimation}

OctaP is a blockchain-backed Credit-as-a-Service platform that enables partner businesses to operate isolated loyalty programs. The functional scope is governed by Report 1\. End users can enroll, earn points, view balances and history, and redeem or apply merchant-specific vouchers. Partner owners and developers manage organizations, campaigns, members, vouchers, billing, subdomains, SDK credentials, webhooks, logs, and sandbox interactions. Platform administrators approve and govern partners, rewards, credit configuration, API/SDK access, monitoring, audit, and Sui transaction tracing. Merchant subscription billing is distinct from loyalty credits: users cannot buy OCP with fiat, cash out points, transfer points between tenants, or use an external cross-brand voucher marketplace in the MVP.

The scope is grouped into five delivery modules: Identity, Credit Core & Trust; End-User Rewards Experience; Partner Organization & Operations; Developer Integration; and Platform Administration, Governance & Assurance. MCP is an integration channel over existing RBAC-authorized use cases, not a separate autonomous purchasing capability.

The project is estimated at 1,584 hours, equivalent to **396 academic man-days** at 4 hours per academic man-day. This consists of 800 direct-delivery hours (200 academic man-days) and 784 supporting hours (196 academic man-days). Man-hours are the planning SSOT; schedule duration is tracked separately, and detailed allocation is maintained in the WBS.

| \# | WBS Item | Complexity | Est. Effort (man-days) |
| ----- | :---- | :---- | ----- |
| **1** | **Identity, Credit Core & Trust** |  | **44** |
| 1.1 | Account registration, authentication and profile lifecycle  | Medium | 8 |
| 1.2 | Tenant-isolated credit engine and configuration | Complex | 12 |
| 1.3 | Sui/Enoki issuance, redemption and integrity verification | Complex | 16 |
| 1.4 | Expiration processing and user notifications | Medium | 8 |
| **2** | **End-User Rewards Experience** |  | **32** |
| 2.1 | Partner subdomain discovery and end-user enrollment | Simple | 4 |
| 2.2 | Points, voucher and transaction-history views | Medium | 6 |
| 2.3 | Scan/code-based point earning | Medium | 6 |
| 2.4 | Redeem and apply merchant-specific vouchers | Complex | 8 |
| 2.5 | Reference web/mobile integration harness | Medium | 8 |
| **3** | **Partner Organization & Operations** |  | **42** |
| 3.1 | Organization information, change requests and subdomains | Medium | 8 |
| 3.2 | Campaign management | Medium | 8 |
| 3.3 | Member and customer management | Medium | 6 |
| 3.4 | Internal voucher and reward management | Medium | 8 |
| 3.5 | Reports and sales notifications | Medium | 6 |
| 3.6 | Merchant billing plan, payment method and history  | Medium | 6 |
| **4** | **Developer Integration** |  | **36** |
| 4.1 | TypeScript SDK and core API integration | Complex | 12 |
| 4.2 | API keys, secret tokens and scopes | Medium | 6 |
| 4.3 | Webhook endpoints and real-time API/SDK logs | Medium | 6 |
| 4.4 | Developer sandbox and mock transaction suite | Medium | 4 |
| 4.5 | MCP adapter for existing RBAC-authorized use cases | Medium | 8 |
| **5** | **Platform Administration, Governance & Assurance** |  | **46** |
| 5.1 | Partner approval, provisioning, activation, bans and subscriptions |  Complex | 10 |
| 5.2 | Platform API/SDK administration | Medium | 6 |
| 5.3 | Reward and credit-engine administration | Complex | 8 |
| 5.4 | Platform monitoring, audit and Sui transaction tracing | Complex | 10 |
| 5.5 | Partner change-request approval workflow |  Medium | 4 |
| 5.6 | Security, system verification and deployment readiness | Complex | 8 |
| **Total Estimated Effort (man-days)** |  |  | **200** |

### **1.2 Project Objectives** {#1.2-project-objectives}

The primary objective is to deliver and verify a tenant-isolated loyalty infrastructure within the 12-week academic schedule from 07/09/2026 to 29/11/2026. The planned product includes merchant and administrator experiences, end-user reference interfaces, a TypeScript SDK, an MCP adapter constrained to approved use cases, and Sui/Enoki-backed credit operations. Targets in this plan are acceptance criteria rather than completed results; implementation, test and deployment claims must be supported by reproducible evidence.

**Quality Objectives**

| \# | Testing Stage | Test Coverage | No. of Defects | % of Defect | Notes |
| :---: | :---- | :---: | :---: | :---: | :---- |
| 1 | Reviewing | 100% baseline artifacts | Track actual | N/A | SSOT, requirements, design and plan reviewed with findings logged |
| 2 | Unit Test | ≥80% line coverage; 100% critical invariants | Track actual | N/A | Credit arithmetic, authorization, expiry and idempotency |
| 3 | Integration Test | 100% critical adapter paths | Track actual | N/A | SDK/API, Sui/Enoki, webhook, billing-test and MCP boundaries |
| 4 | System Test | 100% high-priority SSOT scenarios | Track actual | N/A | Role, tenant, failure and recovery scenarios |
| 5 | Acceptance Test | 100% selected Review scenarios | Track actual | N/A | Stakeholder-observed outcomes; defense is not counted as UAT |

**Milestone Timeliness Target**: at least 95% of committed weekly milestones completed on time; deferred work must be explicitly rebaselined.

**Allocated Effort Distribution (Total: 200 academic man-days / 800 hours)**:

* Requirement Analysis: 20 man-days (10%)

* System & Architecture Design: 30 academic man-days (15%)

* Coding & Development: 90 academic man-days (45%)

* Testing & Quality Assurance: 40 academic man-days (20%)

**Project Management, Documentation & Configuration**: 20 academic man-days (10%)

**Supporting Academic Workload**: 196 academic man-days / 784 hours, covering coordination, learning and research, reporting and evidence, peer review and approved rework, tooling, and contingency. Detailed allocation is maintained in the WBS.

**Technology learning and research**: 396 academic man-days / 1,584 hours.

**Weekly progress reporting, evidence administration and submission coordination**: 24 man-days / 192 hours

**Peer review, mentor-feedback resolution and approved rework**: 24 man-days / 192 hours

**Tooling, operational contingency and release support**: 12 man-days / 96 hours

**Total Planned Academic Workload**: 198 man-days / 1,584 hours

### **1.3 Project Risks** {#1.3-project-risks}

The key technical and operational risks identified for the OctaP project, along with their assessed impact, probability, and corresponding response plans, are summarized below.

| \# | Risk Description | Impact | Possibility | Response Plans |
| :---: | :---- | ----- | ----- | :---- |
| 1 | Scope drift between use-case SSOT, reports and backlog | High | High | Use the Report 1 as the functional baseline; require traceability and approval for every scope change.  |
| 2 | Schedule compression and optimistic estimates | High | Medium | Review actual effort weekly, protect Review milestones, and rebaseline deferred work explicitly; do not hide schedule slippage through unplanned weekend work. |
| 3 | Sui, Enoki and zkLogin integration complexity  | High | Medium | Run an early Testnet proof, pin SDK/network versions, and record service blockers without claiming mock success. |
| 4 | Smart-contract, partner or authorization defects  | High  | Medium  | Define invariants, conduct peer review, and test direct bypass, cross-partner and replay attempts.  |
| 5 | Prototype or mock behavior reported as implemented | Medium | High | Label mock data and environments; require code, test output or digest evidence for implementation claims.  |
| 6 | External service outage or quota limits  | Medium | Medium | Document quotas, degraded behavior and retry limits; keep external failures visible to users and reviewers. |
| 7 | Secret exposure or cross-tenant data leakage  | High | Medium | Keep secrets server-side, use scoped credentials, scan repositories, and execute a two-tenant access matrix. |
| 8 | MCP actions exceed the approved use-case permissions  | High | Medium | Reuse application authorization, restrict MCP to existing use cases, and require explicit approval for mutations. |

## **2\. Management Approach** {#2.-management-approach}

The OctaP project adopts an Agile/Scrum management approach tailored to ensure high transparency, iterative delivery, and rapid response to technical and functional changes across the 12-week development lifecycle.

### **2.1 Project Process** {#2.1-project-process}

The project uses twelve academic one-week iterations from Monday to Sunday, aligned with the university calendar. Planned delivery work uses Monday–Friday, providing 60 weekday working days; Sunday dates mark academic cycle boundaries rather than normal task days. The team plans 33 hours per member per week, for 132 team-hours per week and 1,584 hours / 396 academic man-days across the project. Weekly SprintBacklogs separate direct delivery from supporting academic activities and record actual hours without double-counting. Weeks 1–2 establish Report 1, the use-case SSOT, the management plan, and prototypes; Weeks 3–4 support Review 1; Weeks 6–7 support Review 2 and scope freeze; Weeks 8–9 focus on deployment/integration; Weeks 10–11 focus on verification and Review 3; Week 12 is reserved for submission and defense preparation, not new feature development.

**Key Ceremonies:**

* Sprint Planning: Held at the beginning of each 1-week sprint to select and commit to backlog items based on priority and velocity.

* Daily Standups: 15-minute syncs on working days to discuss accomplishments, daily goals, and potential blockers.        

* Backlog Refinement: Mid-sprint session to clarify requirements, update effort estimates, and groom upcoming backlog items.

* Sprint Review & Demo: Demonstration of working software increments to project stakeholders and mentors at the end of each sprint.

* Sprint Retrospective: Team discussion at the end of each sprint to evaluate process effectiveness and establish continuous improvement actions.

**Team Roles:**

* Product Owner / Project Manager: Manages project backlog, scope, milestone tracking, and stakeholder communications.

* Scrum Master: Facilitates agile ceremonies, removes impediments, and enforces process quality.

**Development Team:** Cross-functional engineers responsible for full-stack implementation, Web3 integrations, bounded MCP integration services, and quality assurance.        

### **2.2 Quality Management** {#2.2-quality-management}

To ensure high performance, security, and reliability of OctaP core SDKs and platform services, a comprehensive Quality Assurance strategy is applied throughout the software development lifecycle:

* Defect Prevention: Clear requirement specifications, architectural standards, static code analysis (ESLint), and automated CI/CD pipeline checks before code integration.

* Peer Code Reviews: Every pull request requires at least one reviewer other than the author; critical security and business-rule changes require tests and recorded evidence before merge.

* Unit Testing: Mandatory automated unit tests written for core logic and backend APIs, targeting a minimum code coverage of 80%.

* Integration Testing: Verify SDK/API, Sui/Enoki, webhook, merchant billing-test and MCP adapter boundaries. User loyalty points are never purchased through the merchant billing flow.

**System & Acceptance Testing (UAT):** Execute role-based scenarios traced to the use-case SSOT, including tenant-isolation and negative authorization cases. Record UAT separately from the final defense.

### **2.3 Training Plan** {#2.3-training-plan}

To bridge technical knowledge gaps and ensure smooth implementation of OctaP's specialized stack, targeted internal training sessions are scheduled during the initial project phase.

| Training Area | Participants | When, Duration | Waiver Criteria |
| :---- | :---- | :---- | :---- |
| NestJS & Microservices | Backend Developers | Weeks 2–3, 8 hours | Waive after a reviewed API/worker exercise |
| Sui Move, Enoki and zkLogin integration | Full Team | Weeks 2–4, 12 hours | Waive only with a reproducible Testnet operation and peer explanation |
| React & Flutter Mobile App Development | Frontend/mobile contributors | Weeks 1–3, 8 hours | Waive after passing the team UI implementation exercise |
| MCP transport, RBAC and safe tool design | SDK/backend contributors | Weeks 5–6, 8 hours | Waive after negative authorization tests pass |

## **3\. Project Deliverables** {#3.-project-deliverables}

The key external and internal project deliverables across the 12-week development master schedule are outlined below. Due dates use Sunday academic-cycle boundaries; planned task work is completed by the preceding Friday unless the university announces a different official deadline.

| \# | Deliverable | Due Date | Notes |
| :---: | :---- | :---- | :---- |
| 1 | Report 1, Use-Case SSOT and Project Management Plan | 20/09/2026 | Baseline project scope and schedule |
| 2 | Review 1 Package and Technical Proof-of-Concept | 04/10/2026 | Reviewed scope, UI harness and core POC evidence |
| 3 | Core Credit, SDK and Partner Vertical Slice | 11/10/2026 | Tenant-isolated earn/redeem and integration baseline |
| 4 | Review 2 Integrated Scope Baseline | 25/10/2026 | Rewards, partner, billing, admin and bounded MCP flows |
| 5 | Integrated Staging Release | 08/11/2026 | Deployment, integration and recovery evidence |
| 6 | Release Candidate, Test Evidence and Review 3 Package | 22/11/2026 | 99% product and documentation target |
| 7 | Final Submission and Defense Package | 29/11/2026 | Versioned artifacts, guides, demo and fallback |

## **4\. Responsibility Assignments** {#4.-responsibility-assignments}

*D\~Do; R\~Review; S\~Support; I\~Informed; \<blank\>- Omitted*

| Responsibility | KhanhMNDSE196605 | QuanTMDSE196621  | HieuDVSE196310 | NhanPNTDE180196 |
| :---- | :---- | ----- | :---- | ----- |
| Project Management & Progress Tracking | D | S | S | I |
| Report 1 & Use-Case SSOT | R | S | R | D |
| Report 2 & Master WBS | R | S | D | S |
| Requirements Specification | D | S | R | S |
| System & Architecture Design | R | D | S | S |
| Core Credit & Blockchain Integration | R | D | S | S |
| Partner/Admin & End-User Interfaces | S | S | R | D |
| SDK, API and MCP Integration | S | R | D | S |
| Testing & Verification | S | S | R | D |
| Deployment & Recovery | R | D | S | S |
| Documentation & Review Packages | R | S | D | S |

## **5\. Project Communications** {#5.-project-communications}

| Communication Item | Who/ Target | Purpose | When, Frequency | Type, Tool, Method(s) |
| :---- | ----- | ----- | ----- | ----- |
| Daily Status Update | Development team | Progress, next action and blockers | Each working day | Linear update; Discord for urgent blockers |
| Weekly Sprint Planning | Development team | Commit scope, owner, reviewer and evidence | Every Monday | Linear \+ Discord |
| Mentor/Advisor Sync | Team and advisor | Review decisions, risks and deliverables | 1–2 times/week | Meeting \+ progress report/minutes |
| Sprint Review & Retrospective | Team and stakeholders | Demonstrate evidence and improve process | Weekly | Live demo \+ action log |
| Scope/Architecture Decision | Relevant owners and reviewer | Prevent report, SSOT and code drift | As needed before merge | Draw.io/Drive decision record \+ Linear |
| Defect Triage | Assignee and reviewer | Classify severity, owner and target release | At least weekly | Linear defects |

## 

## **6\. Configuration Management** {#6.-configuration-management}

### **6.1 Document Management** {#6.1-document-management}

All project documentation is centralized in Google Drive with the following standardized directory structure:

* 01\_Management: Project Charter, PMP, Schedules, and Status Reports.

* 02\_Requirements: SRS, Use Case Specifications, and User Stories.

* 03\_Design: Architecture diagrams, API specs, and Database schemas.

* 04\_Testing: Test Plans, Test Cases, and Defect Logs.

**Naming Convention & Versioning:**

Documents are named using the pattern: *\[ProjectName\]\_\[DocType\]\_\[ModuleName\]\_vX.Y* (e.g., *OctaPoint\_SRS\_VoucherModule\_v1.0*). Major updates increase **X** (e.g., v1.0, v2.0 upon baseline approval), whereas routine drafts increment **Y** (e.g., v0.1, v0.2).

### **6.2 Source Code Management** {#6.2-source-code-management}

Source code for all OctaP repositories (Core SDK, Backend Microservices, Web/Mobile Portals, AI MCP Server) is managed using GitHub under a strict GitFlow branching strategy:

* main Branch: The protected integration baseline; every merged state must remain buildable.

* feature/fix Branches: Short-lived work linked to a Linear issue and rebased or updated before review.

* Pull Requests: Require passing available lint/build/test checks and at least one reviewer other than the author.

* Release tags: Identify review and submission baselines; urgent fixes still use a reviewed fix branch.

**Commit Standards & Merge Policy:**

Commit messages follow Conventional Commits. Pull requests identify the Linear issue, affected use cases, test evidence, known limitations and documentation changes. Mock-only behavior must be labeled explicitly.

### **6.3 Tools & Infrastructures** {#6.3-tools-&-infrastructures}

*\*Marking service serves as back-up in case the primary fails.*

| Category | Tools / Infrastructure |
| ----- | ----- |
| **Technology** | React/Vite prototypes; Flutter reference app; NestJS/Node.js TypeScript modular application with workers |
| **Blockchain & Identity** | Sui Move, @mysten/sui, Enoki/zkLogin and sponsored transactions (planned/verified per evidence) |
| **Database & Messaging** | PostgreSQL as durable store; Redis cache/rate limits; ClickHouse analytics replica (planned) |
| **Audit & Billing** | Walrus/Seal audit evidence and Stripe test-mode merchant billing (planned) |
| **IDEs/Editors** | Visual Studio Code |
| **Diagramming** | Draw.io (functional SSOT), StarUML where required |
| **Documentation** | *Microsoft Office and Google Docs/Sheets/Slides* |
| **Version Control** | GitHub source repositories; Google Drive document baselines |
| **Deployment** | AWS staging target; actual services and fallback behavior recorded after verification |
| **Project Management** | Linear issues/defects/cycles; GitHub pull requests and Projects |

[image1]: <data:image/png;base64,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>