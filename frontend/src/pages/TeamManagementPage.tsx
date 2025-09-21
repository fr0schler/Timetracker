import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Crown,
  UserCheck,
  UserX,
} from 'lucide-react';
import { User, UserInvitation, UserRole } from '../types';
import { useToastStore } from '../store/toastStore';
import InviteMemberModal from '../components/Team/InviteMemberModal';
import MemberList from '../components/Team/MemberList';

interface TeamMember extends User {
  role: UserRole;
  invited_at?: string;
  last_active?: string;
  status: 'active' | 'invited' | 'inactive';
}

export default function TeamManagementPage() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load team data on component mount
  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API calls

      // Mock team members
      const mockMembers: TeamMember[] = [
        {
          id: 1,
          email: 'admin@timetracker.com',
          full_name: 'Admin User',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          role: 'owner',
          status: 'active',
          last_active: '2024-01-12T14:30:00Z'
        },
        {
          id: 2,
          email: 'john.doe@company.com',
          full_name: 'John Doe',
          is_active: true,
          created_at: '2024-01-05T00:00:00Z',
          role: 'admin',
          status: 'active',
          last_active: '2024-01-12T10:15:00Z'
        },
        {
          id: 3,
          email: 'jane.smith@company.com',
          full_name: 'Jane Smith',
          is_active: true,
          created_at: '2024-01-08T00:00:00Z',
          role: 'member',
          status: 'active',
          last_active: '2024-01-11T16:45:00Z'
        },
        {
          id: 4,
          email: 'bob.wilson@company.com',
          full_name: 'Bob Wilson',
          is_active: true,
          created_at: '2024-01-10T00:00:00Z',
          role: 'viewer',
          status: 'inactive',
          last_active: '2024-01-08T09:20:00Z'
        }
      ];

      // Mock pending invitations
      const mockInvitations: UserInvitation[] = [
        {
          id: 1,
          email: 'sarah.johnson@company.com',
          role: 'member',
          token: 'abc123def456',
          invited_by_id: 1,
          invited_at: '2024-01-11T12:00:00Z',
          expires_at: '2024-01-18T12:00:00Z',
          status: 'pending'
        },
        {
          id: 2,
          email: 'mike.brown@company.com',
          role: 'viewer',
          token: 'xyz789uvw012',
          invited_by_id: 1,
          invited_at: '2024-01-10T15:30:00Z',
          expires_at: '2024-01-17T15:30:00Z',
          status: 'pending'
        }
      ];

      setMembers(mockMembers);
      setInvitations(mockInvitations);
    } catch (error) {
      console.error('Failed to load team data:', error);
      addToast('error', t('errors.generic'), 'Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async (email: string, role: UserRole) => {
    try {
      // TODO: Replace with actual API call
      const newInvitation: UserInvitation = {
        id: Math.max(...invitations.map(i => i.id)) + 1,
        email,
        role,
        token: Math.random().toString(36).substring(2, 15),
        invited_by_id: 1, // Current user ID
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        status: 'pending'
      };

      setInvitations(prev => [newInvitation, ...prev]);
      addToast('success', 'Invitation Sent', `Invitation sent to ${email}`);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      throw error;
    }
  };

  const handleResendInvitation = async (invitationId: number) => {
    try {
      // TODO: Replace with actual API call
      setInvitations(prev => prev.map(inv =>
        inv.id === invitationId
          ? { ...inv, invited_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }
          : inv
      ));

      const invitation = invitations.find(inv => inv.id === invitationId);
      addToast('success', 'Invitation Resent', `Invitation resent to ${invitation?.email}`);
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      addToast('error', t('errors.generic'), 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        // TODO: Replace with actual API call
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        addToast('success', 'Invitation Cancelled', 'Invitation has been cancelled');
      } catch (error) {
        console.error('Failed to cancel invitation:', error);
        addToast('error', t('errors.generic'), 'Failed to cancel invitation');
      }
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    if (window.confirm(`Are you sure you want to remove ${member.full_name || member.email} from the team?`)) {
      try {
        // TODO: Replace with actual API call
        setMembers(prev => prev.filter(m => m.id !== memberId));
        addToast('success', 'Member Removed', `${member.full_name || member.email} has been removed from the team`);
      } catch (error) {
        console.error('Failed to remove member:', error);
        addToast('error', t('errors.generic'), 'Failed to remove member');
      }
    }
  };

  const handleChangeRole = async (memberId: number, newRole: UserRole) => {
    try {
      // TODO: Replace with actual API call
      setMembers(prev => prev.map(member =>
        member.id === memberId ? { ...member, role: newRole } : member
      ));

      const member = members.find(m => m.id === memberId);
      addToast('success', 'Role Updated', `${member?.full_name || member?.email}'s role has been updated to ${newRole}`);
    } catch (error) {
      console.error('Failed to change role:', error);
      addToast('error', t('errors.generic'), 'Failed to update role');
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || invitation.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) { // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return Crown;
      case 'admin':
        return Shield;
      case 'member':
        return UserCheck;
      case 'viewer':
        return UserX;
      default:
        return UserCheck;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'admin':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      case 'member':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'viewer':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'invited':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200';
      case 'inactive':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage team members, roles, and invitations
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {members.filter(m => m.status === 'active').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invitations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{invitations.length}</p>
            </div>
            <Mail className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {members.filter(m => m.role === 'admin' || m.role === 'owner').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input py-1.5 text-sm"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input py-1.5 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Team Members ({filteredMembers.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 dark:text-gray-400">
              {t('common.loading')}
            </div>
          </div>
        ) : (
          <MemberList
            members={filteredMembers}
            onRemoveMember={handleRemoveMember}
            onChangeRole={handleChangeRole}
            getRoleIcon={getRoleIcon}
            getRoleColor={getRoleColor}
            getStatusColor={getStatusColor}
            formatRelativeTime={formatRelativeTime}
          />
        )}

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                Pending Invitations ({filteredInvitations.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvitations.map((invitation) => {
                const RoleIcon = getRoleIcon(invitation.role);
                const isExpired = new Date(invitation.expires_at) < new Date();

                return (
                  <div key={invitation.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {invitation.email}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(invitation.role)}`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {invitation.role}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isExpired
                                ? 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
                                : 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {isExpired ? 'Expired' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                          <p>Invited {formatRelativeTime(invitation.invited_at)}</p>
                          <p>Expires {formatDate(invitation.expires_at)}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                            title="Resend invitation"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                            title="Cancel invitation"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteMember}
      />
    </div>
  );
}