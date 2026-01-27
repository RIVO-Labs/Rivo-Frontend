'use client';

import { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

const EMOJI_CATEGORIES = {
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💪', '🦾'],
    emotions: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'],
    work: ['💼', '💻', '⌨️', '🖥️', '🖨️', '📱', '📞', '☎️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪'],
    symbols: ['✅', '❌', '⭐', '🎯', '🔥', '💯', '⚡', '🚀', '🎉', '🎊', '🏆', '🥇', '🥈', '🥉', '🔔', '💡'],
};

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    const [selectedCategory, setSelectedCategory] = useState<keyof typeof EMOJI_CATEGORIES>('smileys');

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                    <Smile className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end">
                <div className="space-y-2">
                    {/* Category Tabs */}
                    <div className="flex gap-1 border-b pb-2">
                        {Object.keys(EMOJI_CATEGORIES).map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? 'secondary' : 'ghost'}
                                size="sm"
                                className="text-xs capitalize"
                                onClick={() => setSelectedCategory(category as keyof typeof EMOJI_CATEGORIES)}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>

                    {/* Emoji Grid */}
                    <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                        {EMOJI_CATEGORIES[selectedCategory].map((emoji, index) => (
                            <button
                                key={index}
                                onClick={() => onEmojiSelect(emoji)}
                                className="text-2xl hover:bg-muted rounded p-1 transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
