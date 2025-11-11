# Fix Login and Registration Issues

## Issues Identified:
1. **Double password hashing**: Frontend hashes passwords before sending, backend hashes them again
2. **Missing mobile field**: Frontend sends mobile but backend doesn't accept it
3. **Missing email verification**: Frontend expects email verification but backend lacks endpoints
4. **Schema mismatches**: Some fields don't match between frontend and backend

## Tasks:
- [x] Fix password hashing logic (remove frontend hashing, let backend handle it)
- [x] Add mobile field to User model and schemas
- [x] Implement email verification endpoints (/verify-email, /resend-verification)
- [x] Update UserCreate schema to include mobile field
- [x] Fix demo mode password handling
- [x] Test login and registration flow

## Updated Plan:
- [x] Remove frontend password hashing in script.js (none found)
- [x] Update demo mode password handling to not hash passwords (already not hashing)
- [x] Test the complete login and registration flow
- [x] Fix API endpoints to accept form data instead of JSON
- [x] Verify email verification flow works

## Current Fix Plan:
- [ ] Update frontend login/signup to send FormData instead of JSON to match backend expectations
- [ ] Remove any frontend password hashing (let backend handle it)
- [ ] Ensure mobile field is properly handled in signup
- [ ] Test email verification flow
- [ ] Update any schema mismatches
