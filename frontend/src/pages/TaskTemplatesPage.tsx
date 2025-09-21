import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  FileText,
  Search,
  Filter,
  Edit3,
  Trash2,
  Copy,
  Clock,
  Flag,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { TaskTemplate, CreateTaskTemplate } from '../types';
import { useToastStore } from '../store/toastStore';
import TaskTemplateModal from '../components/Tasks/TaskTemplateModal';

export default function TaskTemplatesPage() {
  const { t } = useTranslation();
  const { addToast } = useToastStore();

  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      const mockTemplates: TaskTemplate[] = [
        {
          id: 1,
          name: 'Bug Fix Template',
          description: 'Standard template for bug fixes with testing checklist',
          title_template: 'Fix: [Bug Description]',
          description_template: `## Bug Description
[Describe the bug and its impact]

## Root Cause
[Explain what caused the bug]

## Solution
[Describe the fix implemented]

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Regression testing completed

## Verification
- [ ] Bug is resolved
- [ ] No new issues introduced`,
          priority: 'high',
          estimated_hours: 4,
          tags: ['bug', 'fix', 'testing'],
          organization_id: 1,
          created_by_id: 1,
          created_at: '2024-01-01T10:00:00Z'
        },
        {
          id: 2,
          name: 'Feature Development',
          description: 'Complete feature development workflow',
          title_template: 'Feature: [Feature Name]',
          description_template: `## Feature Overview
[Brief description of the feature]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Testing Strategy
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Accessibility testing

## Documentation
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] Code comments added`,
          priority: 'normal',
          estimated_hours: 16,
          tags: ['feature', 'development', 'documentation'],
          organization_id: 1,
          created_by_id: 1,
          created_at: '2024-01-02T09:00:00Z'
        },
        {
          id: 3,
          name: 'Code Review',
          description: 'Template for code review tasks',
          title_template: 'Review: [PR Title]',
          description_template: `## Review Checklist

### Code Quality
- [ ] Code follows style guidelines
- [ ] No code smells or anti-patterns
- [ ] Proper error handling
- [ ] Adequate comments and documentation

### Functionality
- [ ] Code meets requirements
- [ ] Edge cases handled
- [ ] Performance considerations
- [ ] Security implications reviewed

### Testing
- [ ] Adequate test coverage
- [ ] Tests are meaningful
- [ ] No failing tests

### Documentation
- [ ] README updated if needed
- [ ] API docs updated if needed
- [ ] Breaking changes documented`,
          priority: 'normal',
          estimated_hours: 2,
          tags: ['review', 'quality', 'documentation'],
          organization_id: 1,
          created_by_id: 1,
          created_at: '2024-01-03T14:30:00Z'
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      addToast('error', t('errors.generic'), 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: CreateTaskTemplate) => {
    try {
      // TODO: Replace with actual API call
      const newTemplate: TaskTemplate = {
        id: Math.max(...templates.map(t => t.id)) + 1,
        ...templateData,
        priority: templateData.priority || 'normal',
        organization_id: 1,
        created_by_id: 1,
        created_at: new Date().toISOString()
      };

      setTemplates(prev => [newTemplate, ...prev]);
      addToast('success', 'Template Created', `Template "${templateData.name}" has been created successfully`);
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  };

  const handleEditTemplate = async (templateData: CreateTaskTemplate) => {
    if (!selectedTemplate) return;

    try {
      // TODO: Replace with actual API call
      const updatedTemplate: TaskTemplate = {
        ...selectedTemplate,
        ...templateData
      };

      setTemplates(prev => prev.map(template =>
        template.id === selectedTemplate.id ? updatedTemplate : template
      ));

      addToast('success', 'Template Updated', `Template "${templateData.name}" has been updated successfully`);
    } catch (error) {
      console.error('Failed to update template:', error);
      throw error;
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        // TODO: Replace with actual API call
        setTemplates(prev => prev.filter(template => template.id !== templateId));
        addToast('success', 'Template Deleted', 'Template has been deleted successfully');
      } catch (error) {
        console.error('Failed to delete template:', error);
        addToast('error', t('errors.generic'), 'Failed to delete template');
      }
    }
  };

  const handleDuplicateTemplate = async (template: TaskTemplate) => {
    const duplicateData: CreateTaskTemplate = {
      name: `${template.name} (Copy)`,
      description: template.description,
      title_template: template.title_template,
      description_template: template.description_template,
      priority: template.priority,
      estimated_hours: template.estimated_hours,
      tags: template.tags
    };

    try {
      await handleCreateTemplate(duplicateData);
    } catch (error) {
      addToast('error', t('errors.generic'), 'Failed to duplicate template');
    }
  };

  const openEditModal = (template: TaskTemplate) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = filterPriority === 'all' || template.priority === filterPriority;

    return matchesSearch && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const priorityColors = {
    low: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
    normal: 'text-blue-700 bg-blue-100 dark:bg-blue-900',
    high: 'text-orange-700 bg-orange-100 dark:bg-orange-900',
    urgent: 'text-red-700 bg-red-100 dark:bg-red-900'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage reusable task templates
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
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
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="input py-1.5 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="low">{t('tasks.priority.low')}</option>
                <option value="normal">{t('tasks.priority.normal')}</option>
                <option value="high">{t('tasks.priority.high')}</option>
                <option value="urgent">{t('tasks.priority.urgent')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">
            {t('common.loading')}
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {searchQuery || filterPriority !== 'all'
              ? 'No templates found'
              : 'No templates yet'
            }
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || filterPriority !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first template to get started'
            }
          </p>
          {!searchQuery && filterPriority === 'all' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create Template</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-3">
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    title="Duplicate template"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openEditModal(template)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                    title="Edit template"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Template Preview */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Task Title Template:
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded border">
                    {template.title_template}
                  </p>
                </div>
              </div>

              {/* Template Metadata */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Flag className="h-3 w-3 text-gray-400" />
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priorityColors[template.priority]}`}>
                      {t(`tasks.priority.${template.priority}`)}
                    </span>
                  </div>

                  {template.estimated_hours && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{template.estimated_hours}h</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(template.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>User #{template.created_by_id}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 4).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                    >
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 4 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                      +{template.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      <TaskTemplateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateTemplate}
        mode="create"
      />

      {/* Edit Template Modal */}
      <TaskTemplateModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTemplate(undefined);
        }}
        onSave={handleEditTemplate}
        template={selectedTemplate}
        mode="edit"
      />
    </div>
  );
}