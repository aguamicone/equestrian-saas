import { useState } from 'react';
import { useData } from '../../context/DataContext';

export default function TenantSettings() {
    const { tenantSettings, updateBanner } = useData();
    const [bannerText, setBannerText] = useState(tenantSettings?.bannerText || '');
    const [bannerImage, setBannerImage] = useState(tenantSettings?.bannerImage || '');
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        updateBanner(bannerText, bannerImage);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    if (!tenantSettings) return <div>Cargando...</div>;

    return (
        <div className="max-w-4xl space-y-8">
            <h2 className="text-3xl font-bold text-slate-100 mb-6">Configuración del Tenant</h2>

            {/* Branding */}
            <div className="glass-card p-6 rounded-lg border border-slate-700">
                <h3 className="text-xl font-bold text-gold-500 mb-4">Branding & App Cliente</h3>

                <div className="mb-6">
                    <label className="block text-slate-400 mb-2 text-sm">Texto del Banner</label>
                    <textarea
                        className="input-field min-h-[80px]"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="Ingresa un mensaje para tus clientes..."
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-slate-400 mb-2 text-sm">URL Imagen de Banner (Opcional)</label>
                    <input
                        className="input-field"
                        value={bannerImage}
                        onChange={(e) => setBannerImage(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <p className="text-xs text-slate-500 mt-2">Imagen de fondo para el dashboard del cliente.</p>
                </div>

                {bannerImage && (
                    <div className="mb-6">
                        <label className="block text-slate-400 mb-2 text-sm">Vista Previa</label>
                        <div className="h-32 w-full rounded-xl overflow-hidden relative border border-slate-600">
                            <img src={bannerImage} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white font-bold">{bannerText}</span>
                            </div>
                        </div>
                    </div>
                )}

                <button onClick={handleSave} className="btn-primary">
                    {isSaved ? '¡Guardado!' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
}
