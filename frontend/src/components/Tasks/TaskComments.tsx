import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send,
  MessageSquare,
  User,
  Edit3,
  Trash2,
  MoreVertical,
  Reply
} from 'lucide-react';
import { TaskComment } from '../../types';
import { useToastStore } from '../../store/toastStore';

interface TaskCommentsProps {
  taskId: number;
  comments: TaskComment[];
  onAddComment?: (taskId: number, comment: string, parentId?: number) => Promise<void>;
  onEditComment?: (commentId: number, content: string) => Promise<void>;
  onDeleteComment?: (commentId: number) => Promise<void>;
}

export default function TaskComments({
  taskId,
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment
}: TaskCommentsProps) {
  const { t } = useTranslation();
  const { addToast } = useToastStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedMenuId, setExpandedMenuId] = useState<number | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newComment]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(taskId, newComment.trim());
      setNewComment('');
      addToast('success', 'Comment Added', 'Your comment has been added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      addToast('error', t('errors.generic'), 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!replyContent.trim() || !onAddComment) return;

    setIsSubmitting(true);
    try {
      await onAddComment(taskId, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyToCommentId(null);
      addToast('success', 'Reply Added', 'Your reply has been added successfully');
    } catch (error) {
      console.error('Failed to add reply:', error);
      addToast('error', t('errors.generic'), 'Failed to add reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingContent.trim() || !onEditComment) return;

    try {
      await onEditComment(commentId, editingContent.trim());
      setEditingCommentId(null);
      setEditingContent('');
      addToast('success', 'Comment Updated', 'Comment has been updated successfully');
    } catch (error) {
      console.error('Failed to edit comment:', error);
      addToast('error', t('errors.generic'), 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!onDeleteComment) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await onDeleteComment(commentId);
        addToast('success', 'Comment Deleted', 'Comment has been deleted successfully');
      } catch (error) {
        console.error('Failed to delete comment:', error);
        addToast('error', t('errors.generic'), 'Failed to delete comment');
      }
    }
  };

  const startEditing = (comment: TaskComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
    setExpandedMenuId(null);
  };

  const startReply = (commentId: number) => {
    setReplyToCommentId(commentId);
    setExpandedMenuId(null);
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Organize comments into threads (parent comments with their replies)
  const parentComments = comments.filter(comment => !comment.parent_id);
  const getReplies = (parentId: number) =>
    comments.filter(comment => comment.parent_id === parentId);

  return (
    <div className="p-6">
      {/* Comments Header */}
      <div className="flex items-center space-x-2 mb-6">
        <MessageSquare className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add New Comment */}
      <form onSubmit={handleSubmitComment} className="mb-6">
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input w-full min-h-[80px] resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Use Markdown for formatting
              </p>
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isSubmitting ? 'Posting...' : 'Post Comment'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-6">
        {parentComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          parentComments.map((comment) => {
            const replies = getReplies(comment.id);

            return (
              <div key={comment.id} className="space-y-4">
                {/* Parent Comment */}
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              User #{comment.created_by_id}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(comment.created_at)}
                            </span>
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="input w-full min-h-[60px] resize-none"
                                rows={2}
                              />
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditComment(comment.id)}
                                  disabled={!editingContent.trim()}
                                  className="btn btn-primary btn-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(null);
                                    setEditingContent('');
                                  }}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {comment.content}
                            </div>
                          )}
                        </div>

                        {editingCommentId !== comment.id && (
                          <div className="relative">
                            <button
                              onClick={() => setExpandedMenuId(expandedMenuId === comment.id ? null : comment.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {expandedMenuId === comment.id && (
                              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <button
                                  onClick={() => startReply(comment.id)}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Reply className="h-3 w-3" />
                                  <span>Reply</span>
                                </button>
                                {onEditComment && (
                                  <button
                                    onClick={() => startEditing(comment)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                    <span>Edit</span>
                                  </button>
                                )}
                                {onDeleteComment && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reply Form */}
                    {replyToCommentId === comment.id && (
                      <div className="mt-3 ml-4">
                        <div className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                              <User className="h-3 w-3 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="input w-full min-h-[60px] resize-none"
                              rows={2}
                              disabled={isSubmitting}
                            />
                            <div className="flex items-center space-x-2 mt-2">
                              <button
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!replyContent.trim() || isSubmitting}
                                className="btn btn-primary btn-sm"
                              >
                                Reply
                              </button>
                              <button
                                onClick={() => {
                                  setReplyToCommentId(null);
                                  setReplyContent('');
                                }}
                                className="btn btn-secondary btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-11 space-y-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-xs text-gray-900 dark:text-white">
                                User #{reply.created_by_id}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDateTime(reply.created_at)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {reply.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}