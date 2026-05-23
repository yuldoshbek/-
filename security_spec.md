# SECURITY SPECIFICATION: Zero-Trust ABAC Security Rules

## 1. Data Invariants

1. **Workspace Boundary isolation**: All collections are subcollections of individual users: `users/{userId}/...`. All resources are strictly private to the authenticated owner. No cross-user reads or writes are allowed.
2. **Deterministic Schemas**: Creation of documents must match exact field size constraints, required keys, and type checks to block "Shadow Field" spoofing.
3. **Temporal Invariants**: `createdAt` on creation and `updatedAt` on updates must match the server-side `request.time`.
4. **Immutable Identity**: `userId` field must match `request.auth.uid`. No user can create or update a record with another user's identity.

## 2. The "Dirty Dozen" Threat Payloads

The following payloads represent illegal requests engineered to bypass normal system assumptions. Security rules must explicitly block them.

1. **Shadow Update (Identity Spoofing)**: Trying to write `userId: "attacker_uid"` into someone else's space.
2. **Key Injection (Resource Poisoning)**: Adding `isVerifiedAdmin: true` field during a standard write.
3. **Array Spoofing (Value Poisoning)**: Writing raw, unbounded objects into a simple string array.
4. **Temporal Manipulation (Timestamp Spoofing)**: Settling `createdAt` fields to years in the future to bypass analytics.
5. **ID Path Poisoning**: Injecting a 2MB junk string into `{taskId}` to crash queries.
6. **Privilege Escalation**: Attempting to bypass validations on update.
7. **Cross-User Directory Scraping**: Scraping or listing `users/different_user_uid` documents under a broad `isSignedIn()` query.
8. **Invalid Status Transition**: Bypassing allowed status values (e.g. writing `status: "super_active"`).
9. **Blanket Query Abuse**: Issuing a list query without filters expecting to fetch all company files.
10. **Immortal Fields Update**: Changing `createdAt` timestamp during an update.
11. **Size Limit Exceeded (Denial of Wallet)**: Setting `title` to a 500kb text block.
12. **Spam Comments Injection**: Injecting thousands of comment strings without restriction.

---

## 3. Security Rules draft specs

The final rules inside `firestore.rules` will assert validation helpers for each defined schema.
All tests will enforce proper `PERMISSION_DENIED` blocks on these attack payloads.
