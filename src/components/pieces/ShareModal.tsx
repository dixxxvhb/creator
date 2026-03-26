import { useState, useEffect } from 'react';
import { Link2, Copy, Check, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { createShare, listShares, revokeShare } from '@/services/pieceShares';
import { toast } from '@/stores/toastStore';
import type { PieceShare } from '@/types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  pieceId: string;
  pieceTitle: string;
}

const EXPIRATION_OPTIONS = [
  { value: 'never', label: 'Never expires' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

function getExpiresAt(option: string): string | undefined {
  const now = new Date();
  switch (option) {
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return undefined;
  }
}

function isExpired(share: PieceShare): boolean {
  if (!share.expires_at) return false;
  return new Date(share.expires_at) < new Date();
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return 'Never';
  const date = new Date(expiresAt);
  if (date < new Date()) return 'Expired';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getShareUrl(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}view/${token}`;
}

export function ShareModal({ open, onClose, pieceId, pieceTitle }: ShareModalProps) {
  const [shares, setShares] = useState<PieceShare[]>([]);
  const [expiration, setExpiration] = useState('never');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      listShares(pieceId)
        .then(setShares)
        .catch(() => toast.error('Failed to load share links'))
        .finally(() => setIsLoading(false));
    }
  }, [open, pieceId]);

  async function handleCreate() {
    setIsCreating(true);
    try {
      const share = await createShare(pieceId, getExpiresAt(expiration));
      if (share) {
        setShares((prev) => [share, ...prev]);
        toast.success('Share link created');
      }
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revokeShare(id);
      setShares((prev) => prev.filter((s) => s.id !== id));
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke share link');
    }
  }

  async function handleCopy(share: PieceShare) {
    const url = getShareUrl(share.token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(share.id);
      toast.success('Link copied');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }

  const activeShares = shares.filter((s) => !isExpired(s));
  const expiredShares = shares.filter((s) => isExpired(s));

  return (
    <Modal open={open} onClose={onClose} title="Share with Dancers" size="md">
      <div className="space-y-5">
        {/* Create new share */}
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Generate a link for <strong>{pieceTitle}</strong> that dancers can view on their phones. No login required.
          </p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Select
                label="Expires"
                options={EXPIRATION_OPTIONS}
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
              />
            </div>
            <Button onClick={handleCreate} loading={isCreating} size="md">
              <Link2 size={16} />
              Generate Link
            </Button>
          </div>
        </div>

        {/* Active shares */}
        {activeShares.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Active Links ({activeShares.length})
            </h3>
            <div className="space-y-2">
              {activeShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary border border-border-light"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-text-secondary truncate">
                      {getShareUrl(share.token)}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Expires: {formatExpiry(share.expires_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(share)}
                    className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors shrink-0"
                    aria-label="Copy link"
                  >
                    {copiedId === share.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => handleRevoke(share.id)}
                    className="p-2 rounded-lg text-text-secondary hover:text-danger-500 hover:bg-surface transition-colors shrink-0"
                    aria-label="Revoke link"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expired shares */}
        {expiredShares.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
              Expired ({expiredShares.length})
            </h3>
            <div className="space-y-2">
              {expiredShares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary/50 border border-border-light opacity-60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-text-tertiary truncate">
                      {getShareUrl(share.token)}
                    </p>
                    <p className="text-xs text-danger-500 mt-0.5">Expired</p>
                  </div>
                  <button
                    onClick={() => handleRevoke(share.id)}
                    className="p-2 rounded-lg text-text-secondary hover:text-danger-500 hover:bg-surface transition-colors shrink-0"
                    aria-label="Delete expired link"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && shares.length === 0 && (
          <p className="text-sm text-text-tertiary text-center py-4">
            No share links yet. Generate one above.
          </p>
        )}
      </div>
    </Modal>
  );
}
