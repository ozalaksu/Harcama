/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'tr';

interface Translations {
  [key: string]: {
    en: string;
    tr: string;
  };
}

const translations: Translations = {
  loading: {
    en: 'Loading...',
    tr: 'Yükleniyor...'
  },
  eventName: {
    en: 'Event Name',
    tr: 'Etkinlik Adı'
  },
  eventPlaceholder: {
    en: 'e.g., Dinner',
    tr: 'Örn: Akşam Yemeği'
  },
  createEvent: {
    en: 'Create Event',
    tr: 'Etkinlik Oluştur'
  },
  myEvents: {
    en: 'My Events',
    tr: 'Etkinliklerim'
  },
  searchEvents: {
    en: 'Search events...',
    tr: 'Etkinlik ara...'
  },
  participants: {
    en: 'participants',
    tr: 'katılımcı'
  },
  expenses: {
    en: 'expenses',
    tr: 'masraf'
  },
  goBack: {
    en: 'Go Back',
    tr: 'Geri Dön'
  },
  participantName: {
    en: 'Participant name',
    tr: 'Katılımcı adı'
  },
  addNewExpense: {
    en: 'Add New Expense',
    tr: 'Yeni Masraf Ekle'
  },
  description: {
    en: 'Description',
    tr: 'Açıklama'
  },
  expensePlaceholder: {
    en: 'e.g., Groceries',
    tr: 'Örn: Market alışverişi'
  },
  amount: {
    en: 'Amount',
    tr: 'Tutar'
  },
  paidBy: {
    en: 'Paid By',
    tr: 'Ödeyen Kişi'
  },
  selectWhoPaid: {
    en: 'Select who paid...',
    tr: 'Seçiniz...'
  },
  splitBetween: {
    en: 'Split Between',
    tr: 'Masrafı Paylaşacak Kişiler'
  },
  selectAll: {
    en: 'Select All',
    tr: 'Herkesi Seç'
  },
  addExpense: {
    en: 'Add Expense',
    tr: 'Masraf Ekle'
  },
  expenseSummary: {
    en: 'Expense Summary',
    tr: 'Masraf Özeti'
  },
  exportToExcel: {
    en: 'Export to Excel',
    tr: "Excel'e Aktar"
  },
  totalExpense: {
    en: 'Total Expense',
    tr: 'Toplam Masraf'
  },
  paid: {
    en: 'Paid',
    tr: 'Ödediği'
  },
  shouldPay: {
    en: 'Should Pay',
    tr: 'Ödemesi Gereken'
  },
  confirmDeletion: {
    en: 'Confirm Deletion',
    tr: 'Silme İşlemini Onaylayın'
  },
  deleteConfirmationMessage: {
    en: 'To delete this event, please enter the confirmation code:',
    tr: 'Bu etkinliği silmek için lütfen onay kodunu girin:'
  },
  enterConfirmationCode: {
    en: 'Enter confirmation code',
    tr: 'Onay kodunu girin'
  },
  cancel: {
    en: 'Cancel',
    tr: 'İptal'
  },
  delete: {
    en: 'Delete',
    tr: 'Sil'
  },
  incorrectCode: {
    en: 'Incorrect confirmation code',
    tr: 'Hatalı onay kodu'
  },
  selectParticipants: {
    en: 'Please select at least one person to split with',
    tr: 'Lütfen masrafı paylaşacak en az bir kişi seçin'
  },
  appName: {
    en: 'Expense Tracking App',
    tr: 'Masraf Takip Uygulaması'
  },
  heroDescription: {
    en: 'Track and manage your expenses easily. Split costs with friends, family, or colleagues. Get clear summaries and settle up without hassle.',
    tr: 'Masraflarınızı kolayca takip edin ve yönetin. Arkadaşlarınız, aileniz veya iş arkadaşlarınızla masrafları paylaşın. Net özetler alın ve zahmetsizce hesaplaşın.'
  },
  startNewTrip: {
    en: 'Start New Event',
    tr: 'Yeni Etkinlik Başlat'
  },
  feature1Title: {
    en: 'Easy Expense Tracking',
    tr: 'Kolay Masraf Takibi'
  },
  feature1Description: {
    en: 'Record expenses instantly. Add details, split costs, and keep everything organized.',
    tr: 'Masrafları anında kaydedin. Detayları ekleyin, maliyetleri bölün ve her şeyi düzenli tutun.'
  },
  feature2Title: {
    en: 'Smart Splitting',
    tr: 'Akıllı Paylaşım'
  },
  feature2Description: {
    en: 'Split expenses equally or customize how costs are shared.',
    tr: 'Masrafları eşit olarak bölün veya nasıl paylaşılacağını özelleştirin.'
  },
  feature3Title: {
    en: 'Instant Settlement',
    tr: 'Anında Hesaplaşma'
  },
  feature3Description: {
    en: 'See who owes what and settle debts easily.',
    tr: 'Kimin ne kadar borcu olduğunu görün ve borçları kolayca kapatın.'
  },
  howItWorksTitle: {
    en: 'How It Works',
    tr: 'Nasıl Çalışır'
  },
  step1Title: {
    en: 'Create Event',
    tr: 'Etkinlik Oluştur'
  },
  step1Description: {
    en: 'Start by creating a new event and adding participants.',
    tr: 'Yeni bir etkinlik oluşturarak ve katılımcıları ekleyerek başlayın.'
  },
  step2Title: {
    en: 'Add Expenses',
    tr: 'Masrafları Ekle'
  },
  step2Description: {
    en: 'Record expenses as they happen with details.',
    tr: 'Masrafları detaylarıyla birlikte anında kaydedin.'
  },
  step3Title: {
    en: 'Track Balances',
    tr: 'Bakiyeleri Takip Et'
  },
  step3Description: {
    en: 'See totals and individual balances instantly.',
    tr: 'Toplam tutarları ve kişisel bakiyeleri anında görün.'
  },
  step4Title: {
    en: 'Settle Up',
    tr: 'Hesaplaş'
  },
  step4Description: {
    en: 'Get a clear summary of who owes what.',
    tr: 'Kimin ne kadar borcu olduğunun net bir özetini alın.'
  },
  recentEvents: {
    en: 'Recent Events',
    tr: 'Son Etkinlikler'
  },
  viewAll: {
    en: 'View all',
    tr: 'Tümünü gör'
  },
  noDescription: {
    en: 'No description',
    tr: 'Açıklama yok'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('tr');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
