import { createContext, useContext, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const NotificationContext = createContext();

export function useNotification() {
    return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const notify = (message, type = 'info') => {
        const id = Date.now().toString() + Math.random().toString(36).substring(2);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto dismiss
        setTimeout(() => {
            dismiss(id);
        }, 4000);
    };

    const dismiss = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getToastStyles = (type) => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-green-900/60 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]',
                    icon: <CheckCircle2 className="text-green-400" size={24} />,
                    text: 'text-green-100'
                };
            case 'error':
                return {
                    bg: 'bg-red-900/60 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]',
                    icon: <AlertCircle className="text-red-400" size={24} />,
                    text: 'text-red-100'
                };
            case 'warning':
                return {
                    bg: 'bg-orange-900/60 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]',
                    icon: <AlertCircle className="text-orange-400" size={24} />,
                    text: 'text-orange-100'
                };
            default:
                return {
                    bg: 'bg-blue-900/60 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]',
                    icon: <Info className="text-blue-400" size={24} />,
                    text: 'text-blue-100'
                };
        }
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-20 right-4 flex flex-col gap-3 pointer-events-none" style={{ zIndex: 9999 }}>
                {toasts.map(toast => {
                    const styles = getToastStyles(toast.type);
                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto min-w-[320px] max-w-sm p-4 rounded-xl border backdrop-blur-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-right-8 zoom-in-95 duration-400 ease-out ${styles.bg}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="shrink-0 drop-shadow-lg">
                                    {styles.icon}
                                </div>
                                <div className={`text-sm font-bold tracking-wide ${styles.text}`}>
                                    {toast.message}
                                </div>
                            </div>
                            <button onClick={() => dismiss(toast.id)} className="opacity-60 hover:opacity-100 transition-opacity bg-black/20 p-1.5 rounded-full hover:bg-black/40">
                                <X size={16} className="text-white" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </NotificationContext.Provider>
    );
}
