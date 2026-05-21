import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DELEGATION_LEVELS, Session, Participant } from '../lib/types';
import { deleteSession } from '../lib/store';
import { clearIdentity } from '../lib/identity';
import { downloadElementAsPng } from '../lib/exportPng';
import { DelegationCard } from '../components/DelegationCard';
import { ParticipantBadge } from '../components/ParticipantBadge';

type Props = {
  session: Session;
  me: Participant;
};

export function Results({ session, me }: Props) {
  const tableRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();
  const pokered = session.decisions.filter((d) => d.pokered);

  const exportPng = async () => {
    if (!tableRef.current) return;
    await downloadElementAsPng(tableRef.current, `delegation-poker-${session.id}.png`);
  };

  const endSession = () => {
    if (!confirm('End the session? All session data will be erased.')) return;
    clearIdentity(session.id);
    deleteSession(session.id);
    nav('/');
  };

  return (
    <main className="screen results">
      <header className="phase-header">
        <h1>Results</h1>
        <div className="row gap-md">
          <button className="btn btn-primary" onClick={exportPng} disabled={pokered.length === 0}>
            Download as PNG
          </button>
          {me.isLeader && (
            <button className="btn btn-ghost" onClick={endSession}>
              End session
            </button>
          )}
        </div>
      </header>

      {pokered.length === 0 ? (
        <p className="muted">No decisions were pokered. Nothing to show.</p>
      ) : (
        <div className="results-table-wrap" ref={tableRef}>
          <div className="results-table-header">
            <img src="/Logo.png" alt="Groof Delegation Poker" className="logo logo-sm" />
            <div className="results-meta">
              <div>Session {session.id}</div>
              <div>{new Date(session.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <table className="results-table">
            <thead>
              <tr>
                <th className="col-decision">Decision</th>
                {session.participants.map((p) => (
                  <th key={p.id} className="col-vote">
                    <ParticipantBadge p={p} size="sm" />
                  </th>
                ))}
                <th className="col-team">Team decision</th>
              </tr>
            </thead>
            <tbody>
              {pokered.map((d) => (
                <tr key={d.id}>
                  <td className="col-decision">
                    <strong>{d.title}</strong>
                    {d.description && <div className="muted small">{d.description}</div>}
                  </td>
                  {session.participants.map((p) => {
                    const lvl = d.pokerVotes[p.id];
                    return (
                      <td key={p.id} className="col-vote">
                        {lvl ? (
                          <div className="cell-card">
                            <DelegationCard level={lvl} size="sm" />
                            <div className="small">
                              {DELEGATION_LEVELS[lvl - 1].name}
                            </div>
                          </div>
                        ) : (
                          <span className="muted small">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="col-team">
                    {d.teamDecision ? (
                      <div className="cell-card">
                        <DelegationCard level={d.teamDecision} size="sm" />
                        <div>
                          <strong>{DELEGATION_LEVELS[d.teamDecision - 1].name}</strong>
                        </div>
                      </div>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
