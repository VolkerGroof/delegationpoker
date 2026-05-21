import { useState } from 'react';

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };
  return (
    <div className="copy-link">
      <input readOnly value={url} aria-label="Session link" onFocus={(e) => e.currentTarget.select()} />
      <button className="btn btn-primary" onClick={onCopy}>
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  );
}
