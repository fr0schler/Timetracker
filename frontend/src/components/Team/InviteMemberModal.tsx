import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Mail,
  UserPlus,
  Crown,
  Shield,
  UserCheck,
  UserX,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../../types';
import { useToastStore } from '../../store/toastStore';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => Promise<void>;
}

const roleDescriptions = {
  owner: {
    icon: Crown,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
    description: 'Full access to all features and settings. Can manage billing and delete the organization.'
  },
  admin: {
    icon: Shield,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200',
    description: 'Can manage team members, projects, and organization settings. Cannot manage billing.'
  },
  member: {
    icon: UserCheck,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
    description: 'Can create and manage projects, tasks, and time entries. Can view team activity.'
  },
  viewer: {
    icon: UserX,
    color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
    description: 'Read-only access to projects and reports. Cannot create or edit content.'
  }
};

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite
}: InviteMemberModalProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onInvite(email.trim().toLowerCase(), selectedRole);
      handleClose();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      addToast('error', 'Invitation Failed', 'Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSelectedRole('member');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <UserPlus className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Invite Team Member
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input pl-10 w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="colleague@company.com"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Role & Permissions
            </label>
            <div className="space-y-3">
              {(Object.keys(roleDescriptions) as UserRole[]).map((role) => {
                const roleInfo = roleDescriptions[role];
                const RoleIcon = roleInfo.icon;
                const isSelected = selectedRole === role;

                // Don't allow inviting as owner
                if (role === 'owner') return null;

                return (
                  <div
                    key={role}
                    className={`relative rounded-lg border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-0.5 p-2 rounded-lg ${roleInfo.color}`}>
                          <RoleIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {role}
                            </h3>
                            {isSelected && (
                              <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {roleInfo.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={isSelected}
                      onChange={() => setSelectedRole(role)}
                      className="sr-only"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex">
              <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Invitation Details
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>An invitation email will be sent to the provided address</li>
                    <li>The invitation will expire in 7 days</li>
                    <li>You can resend or cancel invitations at any time</li>
                    <li>The user will need to accept the invitation to join the team</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !email.trim()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isLoading ? 'Sending...' : 'Send Invitation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}