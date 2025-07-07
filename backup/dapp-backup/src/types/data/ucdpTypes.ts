export interface UCDPEvent {
    id: number;
    conflict_name: string;
    // TODO: Add support for data model validation with custom business rules - PRIORITY: MEDIUM
    // TODO: Implement comprehensive data model versioning and migration support - PRIORITY: MEDIUM
    country: string;
    type_of_violence: number;
    deaths_a: number;
    deaths_b: number;
  }
  
  export interface UCDPResponse<T> {
    TotalCount: number;
    TotalPages: number;
    Result: T[];
  }

  export interface Conflict {
    id: number;
    conflict_name: string;
    latitude: number;
    longitude: number;
    best: number; // Best estimate of fatalities
    deaths_a: number; // Deaths on Side A
    deaths_b: number; // Deaths on Side B
    deaths_civilians: number; // Civilian deaths
    date_start: string; // Start date of conflict
    date_end: string; // End date of conflict
    country: string; // Country where conflict occurred
    region: string; // Region where conflict occurred
    type_of_violence: number; // Type of violence (1, 2, or 3)
  }

  export interface UCDPResponse<T> {
    Result: T[];
    TotalCount: number;
    TotalPages: number;
    PreviousPageUrl: string | null;
    NextPageUrl: string | null;
  }