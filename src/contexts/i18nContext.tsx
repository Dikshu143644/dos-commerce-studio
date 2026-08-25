import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'es' | 'fr';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & General
    'nav.product': 'Product',
    'nav.solutions': 'Solutions',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.resources': 'Resources',
    'nav.career': 'Career',
    'nav.signIn': 'Sign In',
    'nav.startTrial': 'Start Free Trial',
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventory',
    'nav.crm': 'CRM',
    'nav.procurement': 'Procurement',
    'nav.sales': 'Sales',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.aiAssistant': 'AI Assistant',

    // Hero
    'hero.badge': 'NO.1 CRM & INVENTORY FOR YOUR BUSINESS',
    'hero.title_pre': 'Manage Your Inventory.',
    'hero.title_highlight': 'Close More Deals.',
    'hero.subtitle': 'DOS-CRM-ERP integrates powerful multi-warehouse inventory management with intuitive CRM pipelines, to help you track stock, nurture high-value leads, and accelerate deal revenue.',
    'hero.ctaPrimary': 'Start Free Trial',
    'hero.ctaSecondary': 'Watch Demo Video',
    'hero.stats_text': 'No credit card required • 14-day free trial • Join 500+ companies',

    // Features & Sections
    'section.scale_title': 'Built for Modern Enterprise Scale',
    'section.scale_subtitle': 'Unified stock visibility, multi-warehouse automated routing, and CRM deal acceleration.',
    'section.industry_title': 'Tailored For Your Industry',
    'section.industry_subtitle': 'Customized workflows engineered for manufacturing, 3PL logistics, and wholesale commerce.',
    'section.pricing_title': 'Transparent, Predictable Pricing',
    'section.pricing_subtitle': 'Start with our 14-day free trial. Scale seamlessly as your order volume grows.',
    'section.testimonials_title': 'Join over 10K+ happy customers today',
    'section.faq_title': 'Frequently Asked Questions',
    'section.pipeline_title': 'Pipeline Management',
    'section.pipeline_subtitle': 'Organize Your Deals And Gain Clear Visibility Into Every Stage Of Your Sales Pipeline Effortlessly.',
  },
  es: {
    // Nav & General
    'nav.product': 'Producto',
    'nav.solutions': 'Soluciones',
    'nav.features': 'Características',
    'nav.pricing': 'Precios',
    'nav.resources': 'Recursos',
    'nav.career': 'Carreras',
    'nav.signIn': 'Iniciar Sesión',
    'nav.startTrial': 'Prueba Gratuita',
    'nav.dashboard': 'Panel de Control',
    'nav.inventory': 'Inventario',
    'nav.crm': 'CRM',
    'nav.procurement': 'Adquisiciones',
    'nav.sales': 'Ventas',
    'nav.reports': 'Informes',
    'nav.settings': 'Configuración',
    'nav.aiAssistant': 'Asistente de IA',

    // Hero
    'hero.badge': 'EL CRM E INVENTARIO Nº 1 PARA SU EMPRESA',
    'hero.title_pre': 'Gestione su Inventario.',
    'hero.title_highlight': 'Cierre Más Ventas.',
    'hero.subtitle': 'DOS-CRM-ERP integra una potente gestión de inventario multialmacén con flujos de CRM intuitivos para rastrear existencias y acelerar ingresos.',
    'hero.ctaPrimary': 'Comenzar Prueba Gratis',
    'hero.ctaSecondary': 'Ver Demostración',
    'hero.stats_text': 'Sin tarjeta requerida • Prueba de 14 días • Más de 500 empresas',

    // Features & Sections
    'section.scale_title': 'Diseñado para la Escala Empresarial',
    'section.scale_subtitle': 'Visibilidad unificada de stock, enrutamiento automatizado multialmacén y aceleración de acuerdos.',
    'section.industry_title': 'Adaptado a su Industria',
    'section.industry_subtitle': 'Flujos de trabajo personalizados para manufactura, logística 3PL y comercio mayorista.',
    'section.pricing_title': 'Precios Transparentes y Predecibles',
    'section.pricing_subtitle': 'Comience con la prueba gratuita de 14 días. Escale a medida que crezca su volumen.',
    'section.testimonials_title': 'Únase a más de 10,000 clientes satisfechos',
    'section.faq_title': 'Preguntas Frecuentes',
    'section.pipeline_title': 'Gestión de Canales de Venta',
    'section.pipeline_subtitle': 'Organice sus acuerdos y obtenga visibilidad clara en cada etapa del embudo.',
  },
  fr: {
    // Nav & General
    'nav.product': 'Produit',
    'nav.solutions': 'Solutions',
    'nav.features': 'Fonctionnalités',
    'nav.pricing': 'Tarifs',
    'nav.resources': 'Ressources',
    'nav.career': 'Carrières',
    'nav.signIn': 'Connexion',
    'nav.startTrial': 'Essai Gratuit',
    'nav.dashboard': 'Tableau de bord',
    'nav.inventory': 'Inventaire',
    'nav.crm': 'CRM',
    'nav.procurement': 'Approvisionnement',
    'nav.sales': 'Ventes',
    'nav.reports': 'Rapports',
    'nav.settings': 'Paramètres',
    'nav.aiAssistant': 'Assistant IA',

    // Hero
    'hero.badge': 'LE CRM & INVENTAIRE N°1 POUR VOTRE ENTREPRISE',
    'hero.title_pre': 'Gérez Votre Inventaire.',
    'hero.title_highlight': 'Concluez Plus de Ventes.',
    'hero.subtitle': 'DOS-CRM-ERP intègre une gestion d’inventaire multi-entrepôts et des pipelines CRM intuitifs pour accélérer vos revenus.',
    'hero.ctaPrimary': 'Commencer l’Essai Gratuit',
    'hero.ctaSecondary': 'Regarder la Démo',
    'hero.stats_text': 'Sans carte de crédit • Essai de 14 jours • Plus de 500 entreprises',

    // Features & Sections
    'section.scale_title': 'Conçu pour la Grande Entreprise',
    'section.scale_subtitle': 'Visibilité unifiée des stocks, routage automatisé et accélération des opportunités commerciales.',
    'section.industry_title': 'Adapté à Votre Secteur',
    'section.industry_subtitle': 'Flux de travail sur mesure pour l’industrie manufacturière, la logistique 3PL et le commerce de gros.',
    'section.pricing_title': 'Tarification Transparente et Prévisible',
    'section.pricing_subtitle': 'Commencez votre essai gratuit de 14 jours. Évoluez au rythme de vos commandes.',
    'section.testimonials_title': 'Rejoignez plus de 10 000 clients satisfaits',
    'section.faq_title': 'Foire Aux Questions',
    'section.pipeline_title': 'Gestion du Pipeline Commercial',
    'section.pipeline_subtitle': 'Organisez vos opportunités et gagnez en visibilité à chaque étape de votre pipeline.',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('dos_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('dos_lang', lang);
  };

  const t = (key: string, defaultText?: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || defaultText || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
