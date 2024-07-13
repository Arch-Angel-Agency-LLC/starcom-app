import React, { useEffect, useState } from 'react';
import Parser from 'rss-parser';

const FeedComponent = () => {
  const [titles, setTitles] = useState([]);

  useEffect(() => {
    const parser = new Parser();

    const fetchFeed = async () => {
      try {
        const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/'; // Use a CORS proxy if needed
        const feed = await parser.parseURL(`${CORS_PROXY}https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml`);
        
        // Extract titles from the feed items
        const extractedTitles = feed.items.map(item => ({
          title: item.title,
          link: item.link,
          // Add more properties as needed (e.g., description, publication date)
        }));
        
        setTitles(extractedTitles);
      } catch (error) {
        console.error('Error fetching or parsing the feed:', error);
      }
    };

    fetchFeed();
  }, []);

  return (
    <div>
      <h1>Defense News Feed</h1>
      <ul>
        {titles.map((item, index) => (
          <li key={index}>
            <a href={item.link} target="_blank" rel="noopener noreferrer">{item.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeedComponent;
