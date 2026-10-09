**–Context:**

- A system providing transparent infrastructure based on blockchain and a software development kit (SDK) for enterprises to help them build their own loyalty point and reward system.  
- Traditional methods are centralized, making reward point data susceptible to modification. The OctaP solution helps protect the rights and benefits of consumers and customers.

**Features:**

- Manage reward point/voucher accumulation and redemption across corresponding shops  
- Modular Partner Dashboard: Manage voucher and point redemption campaigns  
- System Admin’s Dashboard  
- AI-ready MCP  
- Developer SDK Suite

**Functional Requirement:**

| Module | Requirement ID | Requirement Description |
| :---- | :---- | :---- |
| Module 1: Authentication & Account Management | FR-AUTH-01 | The system shall provide registration options for End Users and Partners. |
|  | FR-AUTH-02 | The system shall support sign-in via Google, Email/Password, and Phone Number. |
|  | FR-AUTH-03 | The system shall require OTP verification when users authenticate via phone number, change their password, or perform password recovery. |
|  | FR-AUTH-04 | The system shall send OTP codes via SMS or email for verification actions. |
|  | FR-AUTH-05 | The system shall allow users to log out and edit profile information. |
|  | FR-AUTH-06 | The system shall allow users to navigate and sign in through enterprise subdomain websites. |
|  |  |  |
| Module 2: End-User Loyalty, Points & Vouchers | FR-LOY-01 | The system shall display point balances, available vouchers, and historical transactions to the user. |
|  | FR-LOY-02 | The system shall verify point and voucher data integrity using underlying blockchain transaction records. |
|  | FR-LOY-03 | The system shall display expiration warning alerts for points and vouchers nearing expiry. |
|  | FR-LOY-04 | The system shall allow users to earn points by scanning a QR/barcode or manually entering an alphanumeric code. |
|  | FR-LOY-05 | The system shall allow users to redeem vouchers via scanning or inputting a redemption code. |
|  | FR-LOY-06 | The system shall allow users to apply earned points or vouchers towards checkout/redemption transactions. |
|  | FR-LOY-07 | The system shall automatically expire points and vouchers according to campaign rules and trigger automated expiration alerts to affected users. |
| Module 3: Partner Organization & Campaign Management | FR-ORG-01 | The system shall allow partners to create and initialize an organization profile and configure its dedicated subdomain. |
|  | FR-ORG-02 | The system shall allow partners to submit requests to change their registered subdomain or business profile information. |
|  | FR-ORG-03 | The system shall allow partners to manage organization members, roles, and customer lists. |
|  | FR-ORG-04 | The system shall enable partners to create, configure, launch, and manage loyalty campaigns and vouchers. |
|  | FR-ORG-05 | The system shall generate analytical reports and send sales/activity notifications to partner admins. |
| Module 4: Partner Billing & Subscriptions | FR-BIL-01 | The system shall provide tier options for partners to select and manage their active billing plans. |
|  | FR-BIL-02 | The system shall allow partners to add, update, and manage their payment methods. |
|  | FR-BIL-03 | The system shall log and render partner invoice and billing transaction history. |
| Module 5: Technical Management & Developer SDK Suite | FR-DEV-01 | The system shall allow partner developers to generate, revoke, and manage API keys and secret tokens with scoped permissions. |
|  | FR-DEV-02 | The system shall allow developers to register and configure Webhook endpoints for asynchronous event notifications. |
|  | FR-DEV-03 | The system shall provide access to live API and SDK real-time logs for debugging and traffic monitoring. |
|  | FR-DEV-04 | The system shall provide an isolated developer sandbox environment allowing mock transaction execution and integration testing. |
| Module 6: System Administration & Governance | FR-ADM-01 | The system shall allow System Admins to review and approve new partner registrations. |
|  | FR-ADM-02 | Upon registration approval, the system shall automatically provision the partner account, allocate business resources, and configure the partner subdomain. |
|  | FR-ADM-03 | The system shall provide account management tools to activate, ban, or inspect partner accounts and their subscription states. |
|  | FR-ADM-04 | The system shall allow System Admins to configure global subdomains, API/SDK settings, and credit engine rules. |
|  | FR-ADM-05 | The system shall allow admins to review, approve, or reject partner business/subdomain change requests. |
|  | FR-ADM-06 | The system shall monitor platform events and trace point/voucher activities directly on the blockchain ledger for auditing and fraud prevention. |

**Non-Functional Requirement:**

| Category | Requirement ID | Requirement Description |
| :---- | :---- | :---- |
| Performance | NFR-PERF-01 | The system shall process point earning and voucher redemption requests within 2 seconds under normal load conditions. |
|  | NFR-PERF-02 | The API and SDK endpoints shall respond to balance and verification queries within 500 milliseconds. |
| Security | NFR-SEC-01 | The platform shall ensure all data in transit is encrypted using TLS 1.3 and sensitive stored data is encrypted using AES-256. |
|  | NFR-SEC-02 | The system shall enforce role-based access control (RBAC) and verify point/voucher transaction integrity via immutable Sui blockchain records. |
| Reliability | NFR-REL-01 | The OctaP platform shall maintain a service availability uptime of 99.5% excluding scheduled maintenance windows. |
|  | NFR-REL-02 | The system shall perform automated daily database backups with a Recovery Point Objective (RPO) of under 1 hour. |
| Scalability | NFR-SCA-01 | The backend architecture shall automatically scale horizontally to handle up to 5,000 concurrent active user sessions. |
|  | NFR-SCA-02 | The partner organization module shall support seamlessly onboarding new enterprise tenants without impacting existing tenant performance. |
| Usability | NFR-USA-01 | The user interface across mobile and web applications shall adhere to responsive design principles and accessibility standards. |
|  | NFR-USA-02 | The platform shall abstract underlying blockchain complexity. |

