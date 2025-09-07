import { ComposeResult } from './types';

export interface PublishResponse { id: string; url?: string }

export interface PublishAdapter {
  publish(pkg: ComposeResult): Promise<PublishResponse>;
}

export class MockPublishAdapter implements PublishAdapter {
  async publish(pkg: ComposeResult): Promise<PublishResponse> {
    // simulate latency
    await new Promise(r => setTimeout(r, 50));
    const id = pkg.manifest.id;
    return { id, url: `https://mock.exchange/packages/${id}` };
  }
}

export const publishAdapter: PublishAdapter = new MockPublishAdapter();
