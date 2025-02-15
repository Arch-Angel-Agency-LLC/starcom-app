import React from 'react';
import styles from './TopBar.module.css';
import { useTopBarData } from "./useTopBarData";

const TopBar: React.FC = () => {
    const { threatLevel, osintReports, stockSentiment, cyberThreats, currentTime } = useTopBarData();

    return (
      <div className={styles.topBar}>
        <div className={styles.section}>
          <span className={styles.label}>Threat Level:</span>
          <span className={`${styles.threat} ${styles[threatLevel]}`}>{threatLevel}</span>
        </div>
        
        <div className={styles.section}>
          <span className={styles.label}>Latest Intel:</span>
          <span className={styles.intel}>{osintReports[0] || "No recent updates"}</span>
        </div>
  
        <div className={styles.section}>
          <span className={styles.label}>Market Sentiment:</span>
          <span className={styles.market}>{stockSentiment}</span>
        </div>
  
        <div className={styles.section}>
          <span className={styles.label}>Cyber Threats:</span>
          <span className={styles.cyber}>{cyberThreats[0] || "No active threats"}</span>
        </div>
  
        <div className={styles.section}>
          <span className={styles.label}>Time:</span>
          <span className={styles.time}>{currentTime}</span>
        </div>
      </div>
    );const { threatLevel, osintReports, stockSentiment, cyberThreats, currentTime } = useTopBarData();

  return (
    <div className={styles.topBar}>
      <div className={styles.section}>
        <span className={styles.label}>Threat Level:</span>
        <span className={`${styles.threat} ${styles[threatLevel]}`}>{threatLevel}</span>
      </div>
      
      <div className={styles.section}>
        <span className={styles.label}>Latest Intel:</span>
        <span className={styles.intel}>{osintReports[0] || "No recent updates"}</span>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Market Sentiment:</span>
        <span className={styles.market}>{stockSentiment}</span>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Cyber Threats:</span>
        <span className={styles.cyber}>{cyberThreats[0] || "No active threats"}</span>
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Time:</span>
        <span className={styles.time}>{currentTime}</span>
      </div>
    </div>
  );
};

export default TopBar;


// emoji for resources: 🪙Silver 💵Dollar 💶Euro 💷Pound 💴Yen 💳Debt Gasoline⛽️ Oil🛢️ Bombs💣 Weapons🗡️ Tools🔨 Phones📱 Computers💻 Games🎮 Gems💎 Jewelery💍 Wine🍷 Beer🍺 Aerocraft🛩️ Exocraft🚀 Batteries🔋 AC Power🔌 Light💡 🧑‍🏫Teachers 🧑‍💻Programmers 🧑‍🔧Engineers 🧑‍🔬Scientists 👮‍♀️Police 🧑‍⚖️Legal 👩‍🍳Cooks 👷‍♀️Workers 👩‍🌾Farmers 👩‍⚕️Doctors 👩‍🚒Firemen 🕵️‍♀️Agents 🚼Babies 🚺Women 🚹Men 🏭Factories 🏗️Construction 🏢Offices 🏬Malls 🏣Government 🍔Fast Food 🍕Pizza 🍣Sushi 🍜Noodles 🍱Bento 🍚Rice 🍛Curry 🍲Soup 🐔Chicken 🐄Cow 🐖Pig 🐑Sheep 🦃Turkey 🦙Llama 🌾Wheat 🌽Corn 🍅Tomato 🥕Carrot 🥬Lettuce 🥒Cucumber 🐟Fish 🦐Shrimp 🦑Squid 🦞Lobster 🦈Shark 🦌Deer 🐻Bear 🦁Lion 🐅Tiger 🐊Crocodile ⛏️Pickaxe 🪓Axe ⛏️Shovel 🪨Rock ⛏️Ore 🪓Wood 🌳Tree 🌲Pine 🌴Palm 🌵Cactus 🌾Grass 🏗️Crane 🏢Building 🏬Mall 🏣Government 🏭Factory 🚗Car 🚚Truck 🚛Lorry 🚜Tractor 🚂Train 🛳️Cargo Ship 🚢Cruise Ship ✈️Airplane 🚁Helicopter 🚀Rockets 🛸Exocraft 🛰️Satellites 🛩️Aerodyne 💣Bombs 🪖Helmets 🪓Axes 🗡️Swords 🛡️Shields 🔬Microscopes 🔭Telescopes 🧬DNA 🧪Chemistry 🧫Biology 🏫Schools 🎓Graduation 🎒Backpacks 📚Books 🏥Hospitals 💊Medicine 💉Vaccines 🩺Stethoscopes