import { parseStringPromise } from 'xml2js';

export interface RssItemRaw {
  title?: string[];
  link?: string[];
  pubDate?: string[];
  category?: string[] | string;
  description?: string[];
  guid?: string[];
  // content:encoded appears as 'content:encoded'
  [key: string]: any;
}

export interface ParsedFeed {
  channelTitle?: string;
  items: RssItemRaw[];
}

export async function parseRss(xml: string): Promise<ParsedFeed> {
  const data = await parseStringPromise(xml, {
    explicitArray: true,
    ignoreAttrs: false,
    mergeAttrs: false,
  });
  const channel = data?.rss?.channel?.[0] || data?.feed || {};
  const items: RssItemRaw[] = channel.item || channel.entry || [];
  const channelTitle = channel.title?.[0] || undefined;
  return { channelTitle, items };
}
