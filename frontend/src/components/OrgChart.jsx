import React from 'react';
import { Crown, Users, LogOut, UserX } from 'lucide-react';

const positionLabels = {
  FACULTY_COORDINATOR: 'Faculty Coordinator',
  HEAD_COORDINATOR: 'Head Coordinator',
  JOINT_HEAD_COORDINATOR: 'Joint Head Coordinator'
};

const roleLabels = { HEAD: 'Head', CO_HEAD: 'Co-head', MEMBER: 'Member' };

export default function OrgChart({ coordinators, teams, currentUserId, canManageTeam, onLeaveTeam, onRemoveMember }) {
  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Coordinators</p>
        <div className="flex flex-wrap gap-2">
          {coordinators.map((c) => (
            <div key={c._id} className="flex items-center gap-1.5 bg-accent-soft text-accent text-xs font-medium px-3 py-1.5 rounded-full">
              <Crown size={12} /> {c.userId?.name} <span className="opacity-70">- {positionLabels[c.position]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {teams.map((team) => (
          <div key={team._id} className="border border-black/5 rounded-lg p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Users size={14} className="text-accent" />
              <span className="font-display font-semibold text-sm">{team.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              {team.members.map((m) => {
                const isMe = String(m.userId?._id) === String(currentUserId);
                return (
                  <div key={m._id} className="flex items-center justify-between text-xs">
                    <span className="text-text">{m.userId?.name} <span className="text-text-muted">- {roleLabels[m.role]}</span></span>
                    {isMe ? (
                      <button onClick={() => onLeaveTeam(team._id)} title="Leave team" className="text-text-muted hover:text-danger p-0.5">
                        <LogOut size={12} />
                      </button>
                    ) : canManageTeam?.(team) ? (
                      <button onClick={() => onRemoveMember(team._id, m._id)} title="Remove member" className="text-text-muted hover:text-danger p-0.5">
                        <UserX size={12} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
              {team.members.length === 0 && <p className="text-xs text-text-muted italic">No members yet.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
