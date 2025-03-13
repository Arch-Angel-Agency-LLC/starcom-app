// src/interfaces/EIAData.ts
export interface EIADataPoint {
    period: string;
    value: string;
    product: string;
    series: string;
    area_name?: string;
    units?: string;
}

export interface EIAResponse {
    data: EIADataPoint[];
    total: number;
    frequency: string;
    dateFormat: string;
}