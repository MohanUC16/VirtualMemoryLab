# Virtual Memory Lab Report

## 1. Objective

This lab explores how virtual memory is translated through paging and segmentation. The focus is on how page table size changes with address-space size and page size, how page allocation affects address translation and page faults, and how segmentation checks base and bound values to determine whether an address is valid.

## 2. Part 1: Paging Exploration

### 2.1 Page Table Size Analysis

The linear page table grows in proportion to the number of virtual pages. For a virtual address space of size A and a page size P:

- Number of pages = ceil(A / P)
- If each page-table entry is 4 bytes, then page table size = ceil(A / P) * 4 bytes

Examples from the simulator:

- A = 1 MB, P = 1 KB -> 1024 pages -> 4096 bytes
- A = 2 MB, P = 1 KB -> 2048 pages -> 8192 bytes
- A = 4 MB, P = 1 KB -> 4096 pages -> 16384 bytes

This shows that when the address space gets larger, the number of virtual pages increases directly. When page size becomes smaller, the number of pages increases, so the table becomes larger as well.

### 2.2 Allocation Percentage Experiment

The paging simulator also models different percentages of allocated pages in the address space. If the total number of pages is N and the allocation percentage is u:

- allocated pages = ceil(N * u / 100)

When u = 0, almost every access is a page fault because no pages are mapped. When u = 25, 50, or 100, more pages are resident, fewer faults occur, and address translation is more likely to succeed without faulting. The effect is visible in the simulator output: as the allocation percentage increases, the number of valid virtual-to-physical mappings increases and the number of faults decreases.

### 2.3 Random Seed Experiments

The random seed changes the page-to-frame mapping used during simulation. A different seed alters which virtual pages are mapped to which frames but should not change the underlying math for the page table itself. The simulator shows which parameter combinations are unrealistic, such as:

- address space larger than physical memory
- extremely tiny page sizes, which explode the table size
- extremely large page sizes, which create too few pages and hide many of the translation dynamics

These cases are unrealistic because they do not reflect a balanced virtual memory system in which the page table is manageable and the physical memory can hold a meaningful subset of the virtual address space.

### 2.4 Conclusion for Paging

Paging uses a page table to map a virtual page number to a physical frame number. The page table scales with the virtual address space and the page size. Larger address spaces and smaller page sizes create larger tables, while higher allocation percentages reduce the number of faults and improve translation efficiency.

## 3. Part 2: Segmentation Exploration

### 3.1 Address Translation with Segmentation

The segmentation simulator checks both the segment and the offset inside that segment. For a valid virtual address in a segment, translation is:

- physical address = segment base + offset

If the virtual address lies outside the segment range, then it is invalid and the simulator reports a violation.

For the sample configuration:

- virtual space = 128
- physical memory = 512
- segment 0: base = 0, limit = 20
- segment 1: base = 512, limit = 20

The valid range for segment 0 is 0 through 19. The next valid range begins at virtual 20 for segment 1, with its physical mapping starting at 512. Virtual addresses outside these ranges are invalid. This demonstrates how segmentation uses bounds checking before translation is performed.

### 3.2 Segment Limits and Illegal Addresses

The highest legal virtual address in the first segment is the upper bound minus one, because the allowed range is inclusive on the low end and exclusive on the upper end. For a 20-byte segment, the highest legal address is 19.

The lowest legal virtual address in segment 1 is immediately after the end of segment 0, which is 20.

Any address below 0 or above the highest valid range is illegal. A segment whose limit is 0 yields no valid virtual addresses because the address range is empty.

### 3.3 No Valid Addresses Scenario

A segmentation configuration with zero-length segments produces no legal virtual address. In this case, every address request is rejected because there is no valid segment range. This tests the boundary condition where the segment limit is not large enough to cover any address.

## 4. Overall Understanding

Paging and segmentation solve different problems in virtual memory management. Paging manages memory in fixed-size chunks and is well suited to page tables and virtual-to-physical mapping. Segmentation uses variable-size logical units and relies on base and limit checks to enforce protection and bounds.

Together, these mechanisms show how an operating system keeps virtual memory organized, translates addresses correctly, and prevents illegal accesses. The simulations highlight the relationship between address-space size, page size, allocation level, and base/bounds enforcement.
