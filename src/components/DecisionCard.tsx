import { useState } from 'react';
import { Decision, Participant, decisionScore } from '../lib/types';
import { ParticipantBadge } from './ParticipantBadge';

type Mode = 'private' | 'voting' | 'discussion';

type Props = {
  decision: Decision;
  participants: Participant[];
  me: Participant;
  mode: Mode;
  isLeader: boolean;
  onVote?: (value: 1 | -1) => void;
  onComment?: (text: string) => void;
  onEdit?: (title: string, description: string) => void;
  onDelete?: () => void;
  onPoker?: () => void;
};

export function DecisionCard({
  decision,
  participants,
  me,
  mode,
  isLeader,
  onVote,
  onComment,
  onEdit,
  onDelete,
  onPoker,
}: Props) {
  const score = decisionScore(decision);
  const myVote = decision.votes[me.id];
  const author = participants.find((p) => p.id === decision.authorId);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(decision.title);
  const [descDraft, setDescDraft] = useState(decision.description);
  const [commentDraft, setCommentDraft] = useState('');

  const startEdit = () => {
    setTitleDraft(decision.title);
    setDescDraft(decision.description);
    setEditing(true);
  };
  const saveEdit = () => {
    if (!titleDraft.trim()) return;
    onEdit?.(titleDraft.trim(), descDraft.trim());
    setEditing(false);
  };

  return (
    <article className={`decision ${decision.pokered ? 'decision-done' : ''}`}>
      <div className="decision-main">
        {editing ? (
          <>
            <input
              className="decision-title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              autoFocus
            />
            <textarea
              className="decision-desc-input"
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              rows={2}
              placeholder="Description (optional)"
            />
            <div className="row gap-sm">
              <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h3 className="decision-title">{decision.title}</h3>
            {decision.description && <p className="decision-desc">{decision.description}</p>}
            {author && <div className="decision-author">by {author.name}</div>}
          </>
        )}
      </div>

      {(mode === 'voting' || mode === 'discussion') && (
        <div className="decision-side">
          <div className="vote-stack">
            <button
              className={`vote-btn ${myVote === 1 ? 'vote-up-active' : ''}`}
              onClick={() => onVote?.(1)}
              disabled={mode !== 'voting'}
              aria-label="Upvote"
            >
              ▲
            </button>
            <span className={`vote-score ${score > 0 ? 'pos' : score < 0 ? 'neg' : ''}`}>{score}</span>
            <button
              className={`vote-btn ${myVote === -1 ? 'vote-down-active' : ''}`}
              onClick={() => onVote?.(-1)}
              disabled={mode !== 'voting'}
              aria-label="Downvote"
            >
              ▼
            </button>
          </div>
        </div>
      )}

      {mode === 'voting' && (
        <div className="decision-comments">
          {decision.comments.map((c) => {
            const a = participants.find((p) => p.id === c.authorId);
            return (
              <div key={c.id} className="comment">
                <strong>{a?.name ?? 'Unknown'}:</strong> {c.text}
              </div>
            );
          })}
          <form
            className="comment-form"
            onSubmit={(e) => {
              e.preventDefault();
              const t = commentDraft.trim();
              if (!t) return;
              onComment?.(t);
              setCommentDraft('');
            }}
          >
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Add a comment…"
            />
            <button className="btn btn-ghost btn-sm" type="submit" disabled={!commentDraft.trim()}>
              Post
            </button>
          </form>
        </div>
      )}

      {mode === 'discussion' && isLeader && !editing && (
        <div className="decision-leader-actions">
          {!decision.pokered && (
            <button className="btn btn-primary" onClick={onPoker}>
              Poker this →
            </button>
          )}
          {decision.pokered && (
            <span className="decision-done-tag">✓ Pokered (level {decision.teamDecision})</span>
          )}
          <button className="btn btn-ghost btn-sm" onClick={startEdit}>Edit</button>
          <button className="btn btn-link btn-sm" onClick={onDelete}>Delete</button>
        </div>
      )}
    </article>
  );
}
