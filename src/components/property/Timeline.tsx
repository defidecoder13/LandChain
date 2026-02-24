import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui';

interface TimelineEvent {
  title: string;
  date: string;
  txHash: string;
  status?: "active" | "pending" | "dispute" | "frozen";
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const OwnershipTimeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="flex flex-col gap-0">
      {events.map((event, index) => (
        <div key={index} className="flex gap-6">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full border-2 ${index === 0 ? 'bg-primary-700 border-primary-700' : 'bg-white border-neutral-border'} z-10`} />
            {index !== events.length - 1 && (
              <div className="w-0.5 h-20 bg-neutral-border -my-1" />
            )}
          </div>
          
          <div className="pb-10 flex flex-col gap-1 -mt-1">
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-semibold text-neutral-text-primary">{event.title}</span>
              {event.status && <Badge variant={event.status}>{event.status}</Badge>}
            </div>
            <span className="text-[14px] text-neutral-text-secondary">{event.date}</span>
            <a 
              href={`https://amoy.polygonscan.com/tx/${event.txHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[12px] text-primary-600 font-mono hover:underline mt-1"
            >
              {event.txHash}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};
