import { useState } from 'react';
import {
  MoreVertical,
  Trash2,
  Edit3,
  Clock,
  Calendar,
  Crown,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

interface TeamMember {
  id: number;
  email: string;
  full_name?: string;
  role: UserRole;
  status: 'active' | 'invited' | 'inactive';
  last_active?: string;
  created_at: string;
}

interface MemberListProps {
  members: TeamMember[];
  onRemoveMember: (memberId: number) => void;
  onChangeRole: (memberId: number, newRole: UserRole) => void;
  getRoleIcon: (role: UserRole) => any;
  getRoleColor: (role: UserRole) => string;
  getStatusColor: (status: string) => string;
  formatRelativeTime: (dateString: string) => string;
}

export default function MemberList({
  members,
  onRemoveMember,
  onChangeRole,
  getRoleIcon,
  getRoleColor,
  getStatusColor,
  formatRelativeTime
}: MemberListProps) {
  const [expandedMenuId, setExpandedMenuId] = useState<number | null>(null);
  const [roleChangeMenuId, setRoleChangeMenuId] = useState<number | null>(null);

  const handleRoleChange = (memberId: number, newRole: UserRole) => {
    onChangeRole(memberId, newRole);
    setRoleChangeMenuId(null);
    setExpandedMenuId(null);
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (members.length === 0) {
    return (
      <div className="p-8 text-center">
        <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No team members found
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {members.map((member) => {
        const RoleIcon = getRoleIcon(member.role);

        return (
          <div key={member.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {getInitials(member.full_name || '', member.email)}
                </div>

                {/* Member Info */}
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.full_name || member.email}
                    </p>
                    {member.role === 'owner' && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  {member.full_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {member.role}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                      {member.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions and Metadata */}
              <div className="flex items-center space-x-4">
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  {member.last_active && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>Active {formatRelativeTime(member.last_active)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {formatRelativeTime(member.created_at)}</span>
                  </div>
                </div>

                {/* Actions Menu */}
                {member.role !== 'owner' && (
                  <div className="relative">
                    <button
                      onClick={() => setExpandedMenuId(expandedMenuId === member.id ? null : member.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {expandedMenuId === member.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        {/* Change Role */}
                        <div className="relative">
                          <button
                            onClick={() => setRoleChangeMenuId(roleChangeMenuId === member.id ? null : member.id)}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Change Role</span>
                          </button>

                          {roleChangeMenuId === member.id && (
                            <div className="absolute left-full top-0 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 ml-1">
                              {(['admin', 'member', 'viewer'] as UserRole[]).map((role) => {
                                if (role === member.role) return null;
                                const RoleIcon = getRoleIcon(role);

                                return (
                                  <button
                                    key={role}
                                    onClick={() => handleRoleChange(member.id, role)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <RoleIcon className="h-3 w-3" />
                                    <span className="capitalize">{role}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Remove Member */}
                        <button
                          onClick={() => {
                            onRemoveMember(member.id);
                            setExpandedMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove Member</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}