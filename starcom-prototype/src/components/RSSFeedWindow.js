import React from 'react';
import './RSSFeedWindow.css'; // Create this CSS file for styling

const RSSFeedWindow = ({ rssFeedData, onClose }) => {
  // Logic to display the RSS feed data in a draggable window

  return (
    <div className="rss-feed-window">
      <div className="rss-feed-header">
        <h3>RSS Feed</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="rss-feed-body">
        {/* Display RSS feed data here */}
        {/* Example: Mapping over rssFeedData and rendering titles */}
        {rssFeedData.map((item, index) => (
          <div key={index}>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RSSFeedWindow;
