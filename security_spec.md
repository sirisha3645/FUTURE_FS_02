# Firestore Security TDD Specifications - ClientSphere

## 1. Data Invariants
- **Authentication**: A client cannot read or write to any resource unless authenticated (`request.auth != null`).
- **Identity Integrity**: Admin documents `/admins/{adminId}` must only be writable by the matching authenticated user of the same `adminId` (`request.auth.uid == adminId`). Security rules prevent self-assigned admin roles in the generic users collections.
- **Strict Keys**: Creation of lead documents must enforce exact fields: `name`, `source`, `status`, `notes`.
- **System Integrity (Immortality)**: Important metadata fields such as `createdAt` cannot be modified after initial creation.
- **Value Integrity**: Status updates are constrained strictly to `'New' | 'Contacted' | 'Converted'`.

---

## 2. The "Dirty Dozen" Payloads (Vulnerability Scenarios)
The following operations must return `PERMISSION_DENIED`:

1. **Anonymous Read Attempt on Leads**
   - *Payload*: `get(/databases/(default)/documents/leads/lead-123)` with `request.auth = null`.
   - *Exploit*: Read sensitive user data unauthorized.

2. **Anonymous Write Attempt on Leads**
   - *Payload*: `create(/databases/(default)/documents/leads/lead-123)` with `request.auth = null`.
   - *Exploit*: Inject spam leads.

3. **Admin Identity Spoofing (Write other Admin config)**
   - *Payload*: `create(/databases/(default)/documents/admins/admin-attacker)` with `request.auth.uid = "admin-innocent"`.
   - *Exploit*: Overwrite credentials or assume admin ID.

4. **Self-Assigned Admin Creation Bypass**
   - *Payload*: Attempting to write into `/admins` collection with a mismatching user UID.
   - *Exploit*: Create unauthorized admin account.

5. **Blanket Query Scraping (Querying all leads without auth)**
   - *Payload*: Querying all leads with `request.auth = null`.
   - *Exploit*: Mass data extraction.

6. **Lead State Hijacking (Shadow fields)**
   - *Payload*: `create(/databases/(default)/documents/leads/lead-123)` containing `isVIP: true` or `vulnerabilities: []` (ghost keys outside schema definition).
   - *Exploit*: Shadow updates.

7. **Immortality Field Violation (Modifying createdAt on update)**
   - *Payload*: Modify `createdAt` property of an existing Lead to a past or future timestamp.
   - *Exploit*: Disrupt audit trails.

8. **Value Poisoning (Setting status to garbage values)**
   - *Payload*: `update` Lead status to `'Superb'`.
   - *Exploit*: DB corruption and crash UI elements.

9. **Terminal State Unlocking (Re-editing or overriding converted leads without proper field validations)**
   - *Payload*: Set status from Converted to random values without constraints.
   - *Exploit*: State machine bypassing.

10. **Note ID Poisoning (Creating empty notes or corrupted format arrays)**
    - *Payload*: Note array item with missing sub-keys or giant content arrays.
    - *Exploit*: Deny customer dashboards / visual freezes.

11. **Denial of Wallet Recursion (Injecting giant ID keys)**
    - *Payload*: Document IDs with 5KB length.
    - *Exploit*: Deplete Google Cloud Firestore free tier quota.

12. **Spamming Timestamp Values manually**
    - *Payload*: Creating a lead with `createdAt` set to a manually-specified client timestamp rather than the official `request.time`.
    - *Exploit*: Skew dates in graphs.

---

## 3. Test Runner Configurations
The security test is implemented and verified via firestore emulator rules and direct Firestore Client SDK validation errors handled using `handleFirestoreError`.
