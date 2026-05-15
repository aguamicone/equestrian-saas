import { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Bell, Check, X, Info, MessageSquare } from 'lucide-react';

export default function NotificationBell() {
    const { notifications, markAsRead } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.read).length;
    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const handleMarkAsRead = (id) => {
        markAsRead(id);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-700/50"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-slate-900 animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-200 text-sm">Notificaciones</h3>
                        {unreadCount > 0 && <span className="text-xs text-gold-500 font-bold">{unreadCount} nuevas</span>}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {sortedNotifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-xs">
                                No tienes notificaciones.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700">
                                {sortedNotifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 transition-colors ${notif.read ? 'bg-slate-800' : 'bg-slate-700/30'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                {!notif.read ? <div className="h-2 w-2 rounded-full bg-blue-500"></div> : <div className="h-2 w-2 rounded-full bg-slate-600"></div>}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm mb-1 ${notif.read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div>
                                                {!notif.read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                        className="text-slate-500 hover:text-green-500 p-1"
                                                        title="Marcar como leída"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
