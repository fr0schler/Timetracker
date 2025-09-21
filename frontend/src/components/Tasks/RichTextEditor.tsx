import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Eye,
  Edit3
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  maxHeight = '300px'
}: RichTextEditorProps) {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = value;
    }
  }, [value, isPreview]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection) {
      setSelectedText(selection.toString());
    }
  };

  const executeCommand = (command: string, value?: string) => {
    if (disabled) return;

    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Helper function for inserting text (currently unused but may be needed later)
  // const insertText = (text: string) => {
  //   if (disabled) return;
  //   const selection = window.getSelection();
  //   if (selection && selection.rangeCount > 0) {
  //     const range = selection.getRangeAt(0);
  //     range.deleteContents();
  //     range.insertNode(document.createTextNode(text));
  //     range.collapse(false);
  //     selection.removeAllRanges();
  //     selection.addRange(range);
  //     handleInput();
  //   }
  // };

  const insertLink = () => {
    const url = prompt(t('richEditor.enterUrl'));
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const toolbarButtons = [
    {
      command: 'bold',
      icon: Bold,
      title: t('richEditor.bold'),
      shortcut: 'Ctrl+B'
    },
    {
      command: 'italic',
      icon: Italic,
      title: t('richEditor.italic'),
      shortcut: 'Ctrl+I'
    },
    {
      command: 'underline',
      icon: Underline,
      title: t('richEditor.underline'),
      shortcut: 'Ctrl+U'
    },
    {
      command: 'insertUnorderedList',
      icon: List,
      title: t('richEditor.bulletList')
    },
    {
      command: 'insertOrderedList',
      icon: ListOrdered,
      title: t('richEditor.numberedList')
    },
    {
      command: 'formatBlock',
      icon: Quote,
      title: t('richEditor.quote'),
      value: 'blockquote'
    },
    {
      command: 'formatBlock',
      icon: Code,
      title: t('richEditor.code'),
      value: 'pre'
    }
  ];

  // Helper function for HTML to Markdown conversion (currently unused but may be needed later)
  // const convertToMarkdown = (html: string): string => {
  //   return html
  //     .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
  //     .replace(/<b>(.*?)<\/b>/g, '**$1**')
  //     .replace(/<em>(.*?)<\/em>/g, '*$1*')
  //     .replace(/<i>(.*?)<\/i>/g, '*$1*')
  //     .replace(/<u>(.*?)<\/u>/g, '__$1__')
  //     .replace(/<ul><li>(.*?)<\/li><\/ul>/g, '• $1')
  //     .replace(/<ol><li>(.*?)<\/li><\/ol>/g, '1. $1')
  //     .replace(/<li>(.*?)<\/li>/g, '• $1')
  //     .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1')
  //     .replace(/<pre>(.*?)<\/pre>/g, '```\n$1\n```')
  //     .replace(/<a href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
  //     .replace(/<br\s*\/?>/g, '\n')
  //     .replace(/<p>(.*?)<\/p>/g, '$1\n')
  //     .replace(/<[^>]*>/g, '');
  // };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
        <div className="flex items-center space-x-1">
          {toolbarButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => button.value ? executeCommand(button.command, button.value) : executeCommand(button.command)}
                disabled={disabled}
                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`${button.title}${button.shortcut ? ` (${button.shortcut})` : ''}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

          <button
            type="button"
            onClick={insertLink}
            disabled={disabled}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('richEditor.insertLink')}
          >
            <Link className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded transition-colors"
          >
            {isPreview ? (
              <>
                <Edit3 className="h-3 w-3" />
                <span>{t('richEditor.edit')}</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                <span>{t('richEditor.preview')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        className="relative"
        style={{ maxHeight }}
      >
        {isPreview ? (
          /* Preview Mode */
          <div
            className="p-3 prose prose-sm max-w-none dark:prose-invert overflow-y-auto"
            style={{ maxHeight }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          /* Edit Mode */
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onMouseUp={handleSelection}
            onKeyUp={handleSelection}
            className={`p-3 min-h-[120px] overflow-y-auto focus:outline-none ${
              disabled ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900'
            } text-gray-900 dark:text-gray-100`}
            style={{ maxHeight }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}

        {/* Placeholder */}
        {!value && !isPreview && (
          <div className="absolute top-3 left-3 text-gray-400 dark:text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Footer with character count */}
      <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            {selectedText && (
              <span>{t('richEditor.selected')}: {selectedText.length} </span>
            )}
          </div>
          <div>
            {t('richEditor.characters')}: {value.replace(/<[^>]*>/g, '').length}
          </div>
        </div>
      </div>
    </div>
  );
}