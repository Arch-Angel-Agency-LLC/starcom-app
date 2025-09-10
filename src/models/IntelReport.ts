/**
 * DEPRECATED Legacy IntelReport class
 * --------------------------------------------------
 * Replaced by IntelReportUI (src/types/intel/IntelReportUI.ts)
 * Retained temporarily for any straggler imports; scheduled for removal in Phase 5 cleanup.
 * Do NOT extend usage. Import { IntelReportUI } instead.
 */
export class IntelReport {
    constructor(
        public lat: number,
        public long: number,
        public title: string,
        public subtitle: string,
        public date: string,
        public author: string,
        public content: string,
        public tags: string[],
        public categories: string[],
        public metaDescription: string
    ) {}
}