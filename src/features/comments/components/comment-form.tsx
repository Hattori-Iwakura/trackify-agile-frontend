'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => void;
  initialContent?: string;
  placeholder?: string;
  submitLabel?: string;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function CommentForm({
  onSubmit,
  initialContent = '',
  placeholder = 'Write a comment...',
  submitLabel = 'Comment',
  isLoading = false,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    if (!initialContent) {
      setContent('');
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="resize-none"
      />
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isLoading}>
          <Send className="h-3.5 w-3.5 mr-1.5" />
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
