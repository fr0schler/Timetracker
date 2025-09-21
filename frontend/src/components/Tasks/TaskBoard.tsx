import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import { Task } from '../../types';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onTaskStatusChange: (taskId: number, newStatus: Task['status']) => void;
  onTaskEdit?: (task: Task) => void;
}

interface TaskColumn {
  id: Task['status'];
  title: string;
  color: string;
  bgColor: string;
  tasks: Task[];
}

export default function TaskBoard({ tasks, onTaskStatusChange, onTaskEdit }: TaskBoardProps) {
  const { t } = useTranslation();

  const getTaskColumns = useCallback((): TaskColumn[] => {
    const columns: TaskColumn[] = [
      {
        id: 'todo',
        title: t('tasks.status.todo'),
        color: 'text-gray-700 dark:text-gray-300',
        bgColor: 'bg-gray-50 dark:bg-gray-800',
        tasks: tasks.filter(task => task.status === 'todo')
      },
      {
        id: 'in_progress',
        title: t('tasks.status.in_progress'),
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        tasks: tasks.filter(task => task.status === 'in_progress')
      },
      {
        id: 'done',
        title: t('tasks.status.done'),
        color: 'text-green-700 dark:text-green-300',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        tasks: tasks.filter(task => task.status === 'done')
      },
      {
        id: 'cancelled',
        title: t('tasks.status.cancelled'),
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        tasks: tasks.filter(task => task.status === 'cancelled')
      }
    ];

    return columns;
  }, [tasks, t]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    // If no destination or dropped in same position, do nothing
    if (!destination || (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )) {
      return;
    }

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId as Task['status'];

    onTaskStatusChange(taskId, newStatus);
  }, [onTaskStatusChange]);

  const columns = getTaskColumns();

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`${column.bgColor} rounded-lg border border-gray-200 dark:border-gray-700`}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${column.color}`}>
                  {column.title}
                </h3>
                <span className="text-sm text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded-full">
                  {column.tasks.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`p-4 min-h-[400px] transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-opacity-70 dark:bg-opacity-70'
                      : ''
                  }`}
                >
                  <div className="space-y-3">
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-transform ${
                              snapshot.isDragging
                                ? 'rotate-3 shadow-lg'
                                : ''
                            }`}
                          >
                            <TaskCard task={task} onEdit={onTaskEdit} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {/* Empty State */}
                    {column.tasks.length === 0 && (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                        <div className="text-sm">
                          {column.id === 'todo' && 'No tasks to do'}
                          {column.id === 'in_progress' && 'No tasks in progress'}
                          {column.id === 'done' && 'No completed tasks'}
                          {column.id === 'cancelled' && 'No cancelled tasks'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}