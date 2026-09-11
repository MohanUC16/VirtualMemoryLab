# Virtual Memory Lab Project

This project is a self-contained simulator for the OSTEP-style paging and segmentation lab tasks. It is intentionally separated from the prior project so it can be used as an independent deliverable without dependency on the existing shell application.

## Included features

- Paging analysis with address-space, page size, physical memory, percentage of allocated pages, and random seed inputs
- Example OSTEP-style paging runs based on the lab tasks
- Segmentation address translation and validity checks
- Invalid-address scenario testing for segmentation
- A generated lab summary explaining the mechanisms behind paging and segmentation

## Run locally

From this folder, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Lab task coverage

### Part 1: Paging

The simulator supports the lab tasks for:

- Comparing linear page table sizes across different address spaces and page sizes
- Observing the effect of allocation percentage on the number of mapped pages and page faults
- Testing random seed-based layouts
- Reviewing unrealistic parameter combinations for address spaces larger than physical memory or extremely small/large page sizes

### Part 2: Segmentation

The simulator supports:

- Address translation using segment base and limit values
- Valid and invalid address checks
- Finding legal and illegal address ranges
- Creating a scenario where no virtual addresses are valid

## Notes

This project intentionally does not include screenshots, as requested for the final submission workflow. The simulator generates readable text logs and analysis in the browser so the student can include them in the written report.
