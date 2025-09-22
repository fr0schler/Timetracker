import React, { ReactNode } from 'react';
import { MoreHorizontal, Maximize2, RefreshCw } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  isLoading?: boolean;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  icon,
  children,
  actions,
  className = '',
  onRefresh,
  onExpand,
  isLoading = false
}) => {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon && (
              <div className="text-primary-500">
                {icon}
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {actions}

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}

            {onExpand && (
              <button
                onClick={onExpand}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Expand"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default DashboardWidget;