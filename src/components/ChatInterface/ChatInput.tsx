import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  isCentered?: boolean;
}

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : never;

const getSpeechRecognitionCtor = (): (new () => any) | null => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

const hasSpeechRecognition = getSpeechRecognitionCtor() !== null;

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  isCentered = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const toggleVoice = useCallback(() => {
    if (!hasSpeechRecognition) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const Ctor = getSpeechRecognitionCtor()!;
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((result: any) => result[0].transcript)
        .join('');
      onChange(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, onChange]);

  return (
    <motion.div
      layout
      className={cn(
        'relative w-full',
        isCentered ? 'max-w-xl mx-auto' : 'max-w-2xl'
      )}
    >
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? 'Listening...' : placeholder}
          className={cn(
            'w-full px-5 py-3 rounded-full',
            'bg-white/10 backdrop-blur-md',
            'border border-white/20',
            'text-white placeholder-white/50',
            'focus:outline-none focus:ring-2 focus:ring-white/30',
            'transition-all duration-200',
            isCentered && 'text-lg',
            isListening && 'border-red-400/50'
          )}
        />

        {hasSpeechRecognition && (
          <button
            onClick={toggleVoice}
            className={cn(
              'absolute right-14 p-2 transition-colors',
              isListening ? 'text-red-400 animate-pulse' : 'text-white/60 hover:text-white'
            )}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}

        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className={cn(
            'absolute right-3 p-2 rounded-full',
            'bg-white/20 hover:bg-white/30',
            'text-white transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};
