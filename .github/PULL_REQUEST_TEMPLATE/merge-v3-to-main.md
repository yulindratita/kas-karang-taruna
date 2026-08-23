# Pull Request: Merge v3 into Main

## Description
This PR merges the `v3` development branch into the `Main` branch, incorporating all new features, improvements, and bug fixes developed in v3.

## Type of Change
- [x] New feature (non-breaking change which adds functionality)
- [x] Bug fix (non-breaking change which fixes an issue)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)

## Changes Include
### Features
- **Pagination in Laporan**: Added pagination functionality to the laporan (report) page
- **Filter Kategori**: New category filter option in laporan
- **Line Chart Visualization**: Added LineChart component for dashboard data visualization
- **Mobile-Responsive UI**: Implemented responsive filters and card layouts for small screens
- **PWA Manifest**: Added Progressive Web App support
- **Global Filters**: Active search and date range filters on dashboard

### Bug Fixes
- Fixed PDF and Excel print functionality in laporan
- Fixed failed build in dashboard page
- Fixed error build issues
- Resolved merge conflicts in page.tsx
- Fixed search and date picker tools in dashboard
- Restricted transaction deletion to SUPER_ADMIN and BENDAHARA roles

## Testing
- [ ] Manual testing completed on v3 branch
- [ ] No regressions identified
- [ ] All new features verified working

## Merge Strategy
This is a **fast-forward merge** since `v3` is directly ahead of `Main` (merge base: 8d69dd5).

**Git Command to Merge:**
```bash
git checkout Main
git pull origin Main
git merge v3
git push origin Main
```

**Or Alternative (Direct Push to Main):**
```bash
git checkout Main
git pull origin Main
git merge --no-ff v3 -m "Merge v3 into Main: add pagination, line chart, responsive UI, and bug fixes"
git push origin Main
```

## Related Issue
Closes #N/A (Create corresponding issue if needed)

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests passed locally with my changes

## Screenshots/Evidence (if applicable)
N/A

## Notes
- All commits from v3 are included in this merge
- Recommended to test thoroughly in staging before deploying to production
