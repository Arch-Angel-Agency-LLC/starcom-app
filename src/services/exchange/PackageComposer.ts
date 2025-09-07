import { ComposeInput, ComposeResult, PackageManifest } from './types';
import JSZip from 'jszip';
import { createEd25519Signer } from './signing';

function checksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export class PackageComposer {
  static compose(input: ComposeInput): ComposeResult {
    const now = new Date().toISOString();
    const id = `pkg-${Date.now().toString(36)}`;

    const maskEmail = (s: string) => s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted@email]');
    const maskDigits = (s: string) => s.replace(/\d{9,}/g, (m) => '[redacted:number-' + m.length + ']');
    const redact = (s: string) => {
      let out = s;
      if (input.redaction?.maskEmails) out = maskEmail(out);
      if (input.redaction?.maskNumbers) out = maskDigits(out);
      return out;
    };

    const reports = input.reports.map(r => {
      const content = redact(r.content);
      return { id: r.id, title: r.title, checksum: checksum(content) };
    });
    const intel = input.intel.map(i => {
      const content = redact(i.content);
      return { id: i.id, title: i.title, checksum: checksum(content) };
    });
    const assets = (input.assets || []).map(a => {
      const contentStr = typeof a.content === 'string' ? a.content : new TextDecoder().decode(a.content);
      return { filename: a.filename, checksum: checksum(contentStr), size: contentStr.length };
    });

    const manifest: PackageManifest = {
      id,
      name: input.name,
      version: '0.1.0',
      description: input.description,
      classification: input.classification,
      createdAt: now,
      author: input.author,
      license: input.license,
      reports,
      intel,
      assets,
  metadata: input.analysisDeepLink && !input.redaction?.stripDeepLink ? { analysisDeepLink: input.analysisDeepLink } : {}
    };

    // Optional signing: if enabled, sign manifest using provided private key
  // Note: signing occurs in composeZip where async is available.

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    return { manifest, blob };
  }

  static async composeZip(input: ComposeInput): Promise<ComposeResult> {
    let { manifest } = this.compose(input);
    if (input.signing?.enabled && input.signing.privateKeyHex) {
      const signManifest = createEd25519Signer(input.signing.privateKeyHex);
      manifest = await signManifest(manifest);
    }
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    // Include assets when available
  if (input.assets && input.assets.length) {
      const folder = zip.folder('assets');
      for (const a of input.assets) {
    const content: string | Uint8Array = typeof a.content === 'string' ? a.content : a.content;
    folder?.file(a.filename, content);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    return { manifest, blob };
  }

  static async composeZipWithManifest(manifest: PackageManifest, assets?: ComposeInput['assets']): Promise<ComposeResult> {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    if (assets && assets.length) {
      const folder = zip.folder('assets');
      for (const a of assets) {
        const content: string | Uint8Array = typeof a.content === 'string' ? a.content : a.content;
        folder?.file(a.filename, content);
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    return { manifest, blob };
  }
}

export const packageComposer = PackageComposer;
