const formatNumber = (value) => Number(value).toLocaleString();

function seededRandom(seed) {
  let state = (seed % 2147483647 + 2147483647) % 2147483647;
  if (state === 0) state = 1;
  return function next() {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function computePagingMetrics({ addressSpace, pageSize, physicalMemory, allocPercent, entrySize }) {
  const totalPages = Math.max(1, Math.ceil(addressSpace / pageSize));
  const allocatedPages = Math.max(0, Math.ceil((totalPages * allocPercent) / 100));
  const pageTableBytes = Math.max(0, totalPages * entrySize);
  const frames = Math.max(1, Math.ceil(physicalMemory / pageSize));
  const pageFaults = allocPercent === 100 ? 0 : Math.max(0, totalPages - allocatedPages);
  const loadedPages = Math.min(allocatedPages, frames);

  return {
    totalPages,
    allocatedPages,
    pageTableBytes,
    frames,
    loadedPages,
    pageFaults,
  };
}

function runPagingScenario() {
  const addressSpace = Number(document.getElementById('addressSpace').value) || 1;
  const pageSize = Number(document.getElementById('pageSize').value) || 1;
  const physicalMemory = Number(document.getElementById('physicalMemory').value) || 1;
  const allocPercent = Number(document.getElementById('allocPercent').value) || 0;
  const entrySize = Number(document.getElementById('entrySize').value) || 4;
  const seed = Number(document.getElementById('seed').value) || 0;

  const metrics = computePagingMetrics({
    addressSpace,
    pageSize,
    physicalMemory,
    allocPercent,
    entrySize,
  });

  const random = seededRandom(seed);
  const scenario = [];

  for (let i = 0; i < Math.min(10, metrics.totalPages); i += 1) {
    const virtualPage = i;
    const mapped = i < metrics.loadedPages;
    const pageFault = !mapped;
    const frameNumber = mapped ? Math.floor(random() * metrics.frames) : null;
    scenario.push({
      virtualPage,
      mapped,
      pageFault,
      frameNumber,
      virtualAddress: virtualPage * pageSize,
      physicalAddress: mapped ? frameNumber * pageSize + (virtualPage % (pageSize || 1)) : 'fault',
    });
  }

  const output = [
    'Paging Analysis',
    `Address space: ${formatNumber(addressSpace)} bytes`,
    `Page size: ${formatNumber(pageSize)} bytes`,
    `Physical memory: ${formatNumber(physicalMemory)} bytes`,
    `Allocation percentage: ${allocPercent}%`,
    `Entry size: ${entrySize} bytes`,
    `Random seed: ${seed}`,
    '',
    `Total virtual pages = ceil(${formatNumber(addressSpace)} / ${formatNumber(pageSize)}) = ${formatNumber(metrics.totalPages)}`,
    `Allocated pages = ceil(${formatNumber(metrics.totalPages)} * ${allocPercent} / 100) = ${formatNumber(metrics.allocatedPages)}`,
    `Linear page table size = ${formatNumber(metrics.totalPages)} * ${entrySize} bytes = ${formatNumber(metrics.pageTableBytes)} bytes`,
    `Physical frames = ceil(${formatNumber(physicalMemory)} / ${formatNumber(pageSize)}) = ${formatNumber(metrics.frames)}`,
    `Approximate page faults = ${formatNumber(metrics.pageFaults)}`,
    '',
    'Sample translation map:',
    ...scenario.map((item) => {
      return `VPN ${item.virtualPage}: virtual ${formatNumber(item.virtualAddress)} -> ${item.pageFault ? 'page fault' : `physical ${formatNumber(item.physicalAddress)}`}`;
    }),
  ];

  document.getElementById('pagingOutput').textContent = output.join('\n');
  updateReport();
}

function runSuggestedPagingExamples() {
  const examples = [
    { addressSpace: 1_048_576, pageSize: 1024, physicalMemory: 536_870_912, allocPercent: 100, entrySize: 4, seed: 0 },
    { addressSpace: 2_097_152, pageSize: 1024, physicalMemory: 536_870_912, allocPercent: 100, entrySize: 4, seed: 0 },
    { addressSpace: 4_194_304, pageSize: 1024, physicalMemory: 536_870_912, allocPercent: 100, entrySize: 4, seed: 0 },
    { addressSpace: 16_384, pageSize: 32_768, physicalMemory: 32_768, allocPercent: 0, entrySize: 4, seed: 1 },
    { addressSpace: 16_384, pageSize: 32_768, physicalMemory: 32_768, allocPercent: 25, entrySize: 4, seed: 1 },
    { addressSpace: 16_384, pageSize: 32_768, physicalMemory: 32_768, allocPercent: 50, entrySize: 4, seed: 1 },
    { addressSpace: 16_384, pageSize: 32_768, physicalMemory: 32_768, allocPercent: 100, entrySize: 4, seed: 1 },
  ];

  const chunks = examples.map((cfg) => {
    const metrics = computePagingMetrics(cfg);
    return [
      `Example: -P ${cfg.pageSize} -a ${cfg.addressSpace} -p ${cfg.physicalMemory} -u ${cfg.allocPercent} -s ${cfg.seed}`,
      `  pages = ${metrics.totalPages}; allocated = ${metrics.allocatedPages}; table = ${metrics.pageTableBytes} bytes`,
    ].join('\n');
  });

  document.getElementById('pagingOutput').textContent = ['Suggested OSTEP-style paging runs', ...chunks].join('\n\n');
  updateReport();
}

function translateSegmentAddress(virtualAddress, segments) {
  for (const segment of segments) {
    if (virtualAddress >= segment.start && virtualAddress < segment.end) {
      const offset = virtualAddress - segment.start;
      const physical = segment.base + offset;
      return {
        valid: true,
        segment: segment.name,
        offset,
        physical,
      };
    }
  }

  return { valid: false, segment: 'none', offset: null, physical: null };
}

function runSegmentationScenario() {
  const virtualSpace = Number(document.getElementById('virtualSpace').value) || 128;
  const physicalSpace = Number(document.getElementById('physicalSpace').value) || 512;
  const seg0Base = Number(document.getElementById('seg0Base').value) || 0;
  const seg0Limit = Number(document.getElementById('seg0Limit').value) || 0;
  const seg1Base = Number(document.getElementById('seg1Base').value) || 0;
  const seg1Limit = Number(document.getElementById('seg1Limit').value) || 0;

  const segments = [
    { name: 'segment0', start: 0, end: seg0Limit, base: seg0Base, limit: seg0Limit },
    { name: 'segment1', start: seg0Limit, end: seg0Limit + seg1Limit, base: seg1Base, limit: seg1Limit },
  ];

  const addressSet = [0, 1, 5, 19, 20, 21, 39, 64, 127, 128, 255, 511];
  const lines = [
    'Segmentation Translation',
    `Virtual space: ${virtualSpace} bytes`,
    `Physical space: ${physicalSpace} bytes`,
    `Segment 0: base=${seg0Base}, limit=${seg0Limit}, range=[${segments[0].start}, ${segments[0].end})`,
    `Segment 1: base=${seg1Base}, limit=${seg1Limit}, range=[${segments[1].start}, ${segments[1].end})`,
    '',
    'Address checks:',
  ];

  addressSet.forEach((address) => {
    const result = translateSegmentAddress(address, segments);
    if (result.valid) {
      lines.push(`VA ${address} -> valid in ${result.segment}; offset=${result.offset}; PA=${result.physical}`);
    } else {
      lines.push(`VA ${address} -> invalid (out of segment range)`);
    }
  });

  const highestLegalSegment0 = Math.max(0, seg0Limit - 1);
  const lowestLegalSegment1 = seg0Limit;
  const lowestIllegal = Math.min(segments[0].end, segments[1].end);
  const highestIllegal = Math.max(virtualSpace, segments[1].end);

  lines.push(
    '',
    `Highest legal address in segment 0: ${highestLegalSegment0}`,
    `Lowest legal address in segment 1: ${lowestLegalSegment1}`,
    `Lowest illegal address in the full address space: ${lowestIllegal}`,
    `Highest illegal address in the full address space: ${highestIllegal}`,
  );

  document.getElementById('segmentationOutput').textContent = lines.join('\n');
  updateReport();
}

function runInvalidSegmentationScenario() {
  const segments = [
    { name: 'segment0', start: 0, end: 0, base: 0, limit: 0 },
    { name: 'segment1', start: 0, end: 0, base: 512, limit: 0 },
  ];

  const output = [
    'Invalid-case segmentation scenario',
    'No virtual addresses are valid because each segment limit is zero.',
    '',
    'Segment 0: [0, 0)',
    'Segment 1: [0, 0)',
    '',
    ...[0, 1, 5, 20, 127].map((address) => `VA ${address} -> invalid (no valid segment range)`),
  ];

  document.getElementById('segmentationOutput').textContent = output.join('\n');
  updateReport();
}

function buildReport() {
  const paging = computePagingMetrics({
    addressSpace: Number(document.getElementById('addressSpace').value) || 1,
    pageSize: Number(document.getElementById('pageSize').value) || 1,
    physicalMemory: Number(document.getElementById('physicalMemory').value) || 1,
    allocPercent: Number(document.getElementById('allocPercent').value) || 0,
    entrySize: Number(document.getElementById('entrySize').value) || 4,
  });

  const seg0 = Number(document.getElementById('seg0Limit').value) || 0;
  const seg1 = Number(document.getElementById('seg1Limit').value) || 0;

  const report = [
    '<strong>Key insight:</strong> the linear page table grows with the number of virtual pages, so larger address spaces or smaller page sizes create larger page tables.',
    '',
    `<strong>Paging:</strong> total virtual pages = ${paging.totalPages}; page table = ${paging.pageTableBytes} bytes; allocated pages = ${paging.allocatedPages}; page faults ≈ ${paging.pageFaults}.`,
    '',
    `<strong>Segmentation:</strong> segment 0 is valid from 0 to ${Math.max(0, seg0 - 1)} and segment 1 begins at ${seg0}. If a limit is zero or the ranges do not overlap with valid virtual addresses, the address can become invalid.`,
    '',
    '<strong>Conclusion:</strong> paging provides a fixed-size virtual-to-physical translation mapping based on page frames, while segmentation uses base and bound checks to ensure addresses stay within legal ranges. A larger percentage of allocated pages reduces the chance of page faults, while invalid segment ranges reject addresses before translation occurs.',
  ].join('\n');

  document.getElementById('reportOutput').innerHTML = report;
}

function updateReport() {
  buildReport();
}

document.getElementById('pagingDemoBtn').addEventListener('click', runPagingScenario);
document.getElementById('pagingPresetBtn').addEventListener('click', runSuggestedPagingExamples);
document.getElementById('segmentationBtn').addEventListener('click', runSegmentationScenario);
document.getElementById('segmentationInvalidBtn').addEventListener('click', runInvalidSegmentationScenario);

for (const id of ['addressSpace', 'pageSize', 'physicalMemory', 'allocPercent', 'entrySize', 'seg0Limit', 'seg1Limit']) {
  document.getElementById(id).addEventListener('input', updateReport);
}

runPagingScenario();
runSegmentationScenario();
updateReport();
