# Issue: Merge branch v3 ke Main

**Summary**
Merge branch `v3` into `Main` to incorporate all new features and fixes from the v3 development branch.

**Current State**
- `v3` is currently checked out and contains commits ahead of `Main` (origin/Main).
- Merge base between `origin/Main` and `v3` is `8d69dd5` (head of Main), meaning `v3` includes all of Main's changes plus additional features/fixes.

**Commits to be merged (unique to v3)**
- e87c81f new feature: pagination in laporan, new filter kategori in laporan; fix bug: print pdf and excel
- ba8f9c4 fix failed build within dashboard page
- a6b426a fix error build
- 5d5de24 fix merge conflict in page.tsx
- 5a8152a new feature: line chart; fix bug: search and date picker tools in dashboard, pengawas can delete transactions
- 389db92 feat: mobile-responsive filters, card layout for small screens, and PWA manifest
- 6abd33f docs: add issue 7 for mobile UI/UX and PWA plan
- 3a9c83e feat: add LineChart visualization and active global filters (search & date range)
- a05b92f docs: add issue 6 for dashboard chart and global filters
- 187c2ed fix: restrict transaction deletion on dashboard to SUPER_ADMIN and BENDAHARA

**Expected Outcome**
- Main branch advances to the `v3` commit `e87c81f`.
- All new features (pagination, line chart, responsive UI, PWA, filter improvements) and bug fixes are included in Main.

**Checklist**
- [ ] All tests pass on v3
- [ ] Code review completed
- [ ] No breaking changes introduced (or documented)
- [ ] Documentation updated if needed