
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