import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowUpRight } from 'lucide-react';

export default function EventCard({ event }) {
  return (
    <Link to={`/events/${event._id}`} className="group block premium-card p-5 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(18,20,43,0.10)] transition-all duration-200">
      <div className="flex items-start justify-between gap-3"><span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent-soft text-accent">{event.clubId?.name || 'Club event'}</span><ArrowUpRight size={17} className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
      <h3 className="font-display font-semibold text-lg text-text mt-4 mb-1 leading-snug">{event.title}</h3>
      <div className="flex flex-col gap-1 text-xs text-text-muted mt-3">
        <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
        {event.venue && <span className="flex items-center gap-1.5"><MapPin size={12} /> {event.venue}</span>}
      </div>
    </Link>
  );
}
