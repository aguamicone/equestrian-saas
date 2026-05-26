import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Settings as SettingsIcon } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui';

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

    if (!tenantSettings) return <div className="p-8 text-center text-ink-500 italic">Cargando ajustes...</div>;

    return (
        <div className="max-w-4xl space-y-6 pb-20">
            <PageHeader 
                title="Configuración"
                subtitle="Ajustes de personalización, branding y mensajes para el portal de clientes"
                icon={SettingsIcon}
            />

            <Card padding="normal" className="border-ink-200 bg-white shadow-sm">
                <h3 className="text-xl font-bold text-ink-900 mb-5 pb-2 border-b border-ink-150">Branding y Portal del Cliente</h3>

                <div className="mb-5">
                    <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">Texto de Bienvenida / Comunicado</label>
                    <textarea
                        className="input-field min-h-[100px] bg-white border-ink-200 text-ink-800 focus:border-primary-500 focus:ring-0"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="Escribe un mensaje de bienvenida que verán tus clientes en su dashboard..."
                    />
                </div>

                <div className="mb-5">
                    <label className="block text-xs uppercase font-bold text-ink-500 mb-1.5">URL de Imagen de Fondo (Opcional)</label>
                    <input
                        className="input-field bg-white border-ink-200 text-ink-800 focus:border-primary-500 focus:ring-0"
                        value={bannerImage}
                        onChange={(e) => setBannerImage(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <p className="text-xs text-ink-400 mt-2 font-medium">Imagen de banner que se mostrará de fondo en la sección de inicio del cliente.</p>
                </div>

                {bannerImage && (
                    <div className="mb-6">
                        <label className="block text-xs uppercase font-bold text-ink-500 mb-2">Vista Previa del Banner</label>
                        <div className="h-32 w-full rounded-2xl overflow-hidden relative border border-ink-200 shadow-inner bg-ink-50">
                            <img src={bannerImage} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-ink-950/40 flex items-center justify-center p-4 text-center">
                                <span className="text-white font-bold text-lg drop-shadow-md">{bannerText || 'Texto de prueba'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-3 border-t border-ink-150">
                    <button 
                        onClick={handleSave} 
                        className="btn-primary px-6 shadow-sm font-bold min-w-[140px]"
                    >
                        {isSaved ? '¡Guardado con éxito!' : 'Guardar Ajustes'}
                    </button>
                </div>
            </Card>
        </div>
    );
}
