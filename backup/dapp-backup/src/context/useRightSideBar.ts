import { useContext } from 'react';
import RightSideBarContext from './RightSideBarContext';

export const useRightSideBar = () => useContext(RightSideBarContext);
