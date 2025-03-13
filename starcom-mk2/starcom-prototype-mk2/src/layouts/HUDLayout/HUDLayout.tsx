import React from 'react';
import styles from './HUDLayout.module.css';
import TopBar from '../../components/HUD/Bars/TopBar/TopBar';
import BottomBar from '../../components/HUD/Bars/BottomBar/BottomBar';
import LeftSideBar from '../../components/HUD/Bars/LeftSideBar/LeftSideBar';
import RightSideBar from '../../components/HUD/Bars/RightSideBar/RightSideBar';
import TopLeftCorner from '../../components/HUD/Corners/TopLeft/TopLeft';
import TopRightCorner from '../../components/HUD/Corners/TopRight/TopRight';
import BottomLeftCorner from '../../components/HUD/Corners/BottomLeft/BottomLeft';
import BottomRightCorner from '../../components/HUD/Corners/BottomRight/BottomRight';

const HUDLayout: React.FC = () => {
  return (
    <div className={styles.hudLayout}>
      <div className={styles.topLeftCorner}><TopLeftCorner /></div>
      <div className={styles.topRightCorner}><TopRightCorner /></div>
      <div className={styles.bottomLeftCorner}><BottomLeftCorner /></div>
      <div className={styles.bottomRightCorner}><BottomRightCorner /></div>
      <div className={styles.topBar}><TopBar /></div>
      <div className={styles.bottomBar}><BottomBar /></div>
      <div className={styles.leftSideBar}><LeftSideBar /></div>
      <div className={styles.rightSideBar}><RightSideBar /></div>
      <div className={styles.center}></div>
    </div>
  );
};

export default HUDLayout;