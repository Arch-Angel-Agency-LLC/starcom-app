import { createContext } from 'react';
import { ViewContextType } from './ViewContext';

export const ViewContext = createContext<ViewContextType | undefined>(undefined);
