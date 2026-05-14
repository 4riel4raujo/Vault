# Security Specification - User Profiles

## 1. Data Invariants
- A UserProfile must have a valid `userId` that exactly matches the authenticated user's UID.
- Users can only read and write their own profile.
- The `userId` field is immutable after creation.
- Fields must have reasonable size limits to prevent "Denial of Wallet" attacks.

## 2. The "Dirty Dozen" Payloads (for userProfiles)

### Identity Spoofing
1. **Payload**: `{ "userId": "attacker_id", "cidade": "SP" }`
   - **Operation**: `create` as user `victim_id`
   - **Result**: `PERMISSION_DENIED` (userId mismatch)

2. **Payload**: `{ "userId": "victim_id", "cidade": "SP" }`
   - **Operation**: `update` (changing `userId` to someone else's)
   - **Result**: `PERMISSION_DENIED` (userId is immutable)

### Schema Integrity
3. **Payload**: `{ "userId": "user_id", "rendimentoMensal": "invalid_type" }`
   - **Operation**: `create`
   - **Result**: `PERMISSION_DENIED` (type mismatch - rendimentoMensal must be number)

4. **Payload**: `{ "userId": "user_id", "cidade": "A" * 200 }`
   - **Operation**: `create`
   - **Result**: `PERMISSION_DENIED` (string size too large)

5. **Payload**: `{ "userId": "user_id", "unknownField": true }`
   - **Operation**: `create`
   - **Result**: `PERMISSION_DENIED` (strict keys - unknown field)

### State Control
6. **Payload**: `{ "userId": "user_id", "rendimentoMensal": -100 }`
   - **Operation**: `create`
   - **Result**: `PERMISSION_DENIED` (invalid value - negative income)

7. **Payload**: `{ "userId": "user_id" }`
   - **Operation**: `create`
   - **Result**: `ALLOW` (minimal valid profile)

### Access Control
8. **Operation**: `get` on `/userProfiles/victim_id` as `attacker_id`
   - **Result**: `PERMISSION_DENIED` (not the owner)

9. **Operation**: `list` on `/userProfiles` where `userId != auth.uid`
   - **Result**: `PERMISSION_DENIED` (cannot query others' profiles)

10. **Operation**: `delete` on `/userProfiles/victim_id` as `attacker_id`
    - **Result**: `PERMISSION_DENIED` (not the owner)

11. **Payload**: `{ "userId": "user_id", "uf": "TOO_LONG" }`
    - **Operation**: `create`
    - **Result**: `PERMISSION_DENIED` (UF must be max 2 chars)

12. **Payload**: `{ "userId": "user_id", "dataNascimento": "not_a_date" }`
    - **Operation**: `create` (regex check if possible, or just size)
    - **Result**: `PERMISSION_DENIED` (invalid format)
