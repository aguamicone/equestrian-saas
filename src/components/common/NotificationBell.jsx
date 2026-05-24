import { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Bell, Check, X, Info, MessageSquare } from 'lucide-react';

export default function NotificationBell({ variant = 'light' }) {
    const { notifications, markAsRead } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const styles = variant === 'light' ? {
        button: 'relative p-2 text-ink-600 hover:text-ink-800 transition-colors rounded-full hover:bg-ink-100',
        badge: 'absolute top-1 right-1 h-2.5 w-2.5 bg-danger-500 rounded-full border border-white animate-pulse',
        dropdown: 'absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-card border border-ink-200 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right',
        dropdownHeader: 'px-4 py-3 border-b border-ink-200 bg-ink-50/50 flex justify-between items-center',
        dropdownTitle: 'font-bold text-ink-800 text-sm',
        unreadCounter: 'text-xs text-primary-600 font-bold',
        emptyText: 'p-8 text-center text-ink-500 text-xs',
        listContainer: 'divide-y divide-ink-100',
        notificationItemRead: 'p-4 transition-colors bg-white',
        notificationItemUnread: 'p-4 transition-colors bg-primary-50/50',
        markerRead: 'h-2 w-2 rounded-full bg-ink-300',
        markerUnread: 'h-2 w-2 rounded-full bg-primary-500',
        textRead: 'text-sm mb-1 text-ink-500',
        textUnread: 'text-sm mb-1 text-ink-800 font-medium',
        timestamp: 'text-[10px] text-ink-400 uppercase font-bold tracking-wider',
        markReadBtn: 'text-ink-400 hover:text-success-600 p-1'
    } : {
        button: 'relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-700/50',
        badge: 'absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border border-slate-900 animate-pulse',
        dropdown: 'absolute right-0 mt-2 w-80 glass-card rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right',
        dropdownHeader: 'px-4 py-3 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center',
        dropdownTitle: 'font-bold text-slate-200 text-sm',
        unreadCounter: 'text-xs text-gold-500 font-bold',
        emptyText: 'p-8 text-center text-slate-500 text-xs',
        listContainer: 'divide-y divide-slate-700',
        notificationItemRead: 'p-4 transition-colors bg-slate-800',
        notificationItemUnread: 'p-4 transition-colors bg-slate-700/30',
        markerRead: 'h-2 w-2 rounded-full bg-slate-600',
        markerUnread: 'h-2 w-2 rounded-full bg-blue-500',
        textRead: 'text-sm mb-1 text-slate-400',
        textUnread: 'text-sm mb-1 text-slate-200 font-medium',
        timestamp: 'text-[10px] text-slate-500 uppercase font-bold tracking-wider',
        markReadBtn: 'text-slate-500 hover:text-green-500 p-1'
    };

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
                className={styles.button}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={styles.badge}></span>
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <h3 className={styles.dropdownTitle}>Notificaciones</h3>
                        {unreadCount > 0 && <span className={styles.unreadCounter}>{unreadCount} nuevas</span>}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {sortedNotifications.length === 0 ? (
                            <div className={styles.emptyText}>
                                No tienes notificaciones.
                            </div>
                        ) : (
                            <div className={styles.listContainer}>
                                {sortedNotifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={notif.read ? styles.notificationItemRead : styles.notificationItemUnread}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                {!notif.read ? <div className={styles.markerUnread}></div> : <div className={styles.markerRead}></div>}
                                            </div>
                                            <div className="flex-1">
                                                <p className={notif.read ? styles.textRead : styles.textUnread}>
                                                    {notif.message}
                                                </p>
                                                <span className={styles.timestamp}>
                                                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div>
                                                {!notif.read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                        className={styles.markReadBtn}
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
