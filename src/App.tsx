import React, { useState, useEffect, KeyboardEvent } from 'react';
import { Plus, Users, Receipt, Download, ArrowLeft, Trash2, X, Loader2, Calendar, Search, Clock, Lock, TrendingUp, Award, BarChart3, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from './lib/api';
import { useLanguage } from './contexts/LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';
import { Event, Expense, Participant } from './types/app';

const normalizeEvents = (items: Event[]) => {
  return items.map(event => ({
    ...event,
    participants: event.participants || [],
    expenses: (event.expenses || []).map(expense => ({
      ...expense,
      splitBetween: expense.splitBetween || []
    }))
  }));
};

function App() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [eventName, setEventName] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    paidBy: '',
    splitBetween: []
  });

  // Participant colors
  const participantColors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-yellow-100 text-yellow-800',
    'bg-indigo-100 text-indigo-800',
    'bg-red-100 text-red-800',
    'bg-teal-100 text-teal-800'
  ];

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('sessionToken');

        if (storedToken) {
          try {
            await api.validateSession(storedToken);
            const fetchedEvents = await api.listEvents(storedToken);
            setSessionToken(storedToken);
            setIsAuthenticated(true);
            setEvents(normalizeEvents(fetchedEvents));
            setLoading(false);
            return;
          } catch {
            localStorage.removeItem('sessionToken');
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setLoading(false);
      }
    };

    void restoreSession();
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const resetExpenseForm = () => {
    setEditingExpense(null);
    setNewExpense({
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paidBy: '',
      splitBetween: []
    });
  };

  const clearAuthState = () => {
    localStorage.removeItem('sessionToken');
    setSessionToken(null);
    setIsAuthenticated(false);
    setSelectedEvent(null);
    setEvents([]);
    setPassword('');
    setPasswordError('');
  };

  const replaceEventInState = (updatedEvent: Event) => {
    setEvents(prevEvents =>
      prevEvents.map(event => event.id === updatedEvent.id ? updatedEvent : event)
    );
    setSelectedEvent(updatedEvent);
  };

  const persistEvent = async (event: Event) => {
    if (!sessionToken) {
      throw new Error('Session expired');
    }

    const savedEvent = await api.updateEvent(sessionToken, event);
    replaceEventInState(savedEvent);
    return savedEvent;
  };

  const handlePasswordSubmit = async (e?: KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    
    try {
      const session = await api.login(password);
      localStorage.setItem('sessionToken', session.sessionToken);
      setSessionToken(session.sessionToken);
      setIsAuthenticated(true);
      setPasswordError('');
      await fetchEvents(session.sessionToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hatali sifre. Lutfen tekrar deneyin.';
      setPasswordError(message);
      setPassword('');
    }
  };

  const handleLogout = async () => {
    try {
      if (sessionToken) {
        await api.logout(sessionToken);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearAuthState();
    }
  };

  const fetchEvents = async (tokenOverride?: string) => {
    try {
      const activeToken = tokenOverride || sessionToken;
      if (!activeToken) {
        return;
      }

      const fetchedEvents = await api.listEvents(activeToken);
      setEvents(normalizeEvents(fetchedEvents));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e?: KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    
    if (eventName.trim() && sessionToken) {
      try {
        const createdEvent = await api.createEvent(sessionToken, {
          title: eventName.trim(),
          date: new Date().toISOString(),
          participants: [],
          expenses: []
        });

        setEvents(prevEvents => [createdEvent, ...prevEvents]);
        setSelectedEvent(createdEvent);
        setEventName('');
      } catch (error) {
        console.error('Error creating event:', error);
      }
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setConfirmationCode(code);
    setEventToDelete(eventId);
    setEnteredCode('');
    setDeleteError('');
  };

  const confirmDeleteEvent = async () => {
    if (enteredCode.toUpperCase() !== confirmationCode) {
      setDeleteError(t('incorrectCode'));
      return;
    }

    if (eventToDelete) {
      try {
        if (!sessionToken) {
          throw new Error('Session expired');
        }

        await api.deleteEvent(sessionToken, eventToDelete);
        setEvents(prevEvents => prevEvents.filter(event => event.id !== eventToDelete));
        if (selectedEvent?.id === eventToDelete) {
          setSelectedEvent(null);
        }
        setEventToDelete(null);
        setConfirmationCode('');
        setEnteredCode('');
        setDeleteError('');
      } catch (error) {
        console.error('Error deleting event:', error);
        setDeleteError('Failed to delete event');
      }
    }
  };

  const handleAddParticipant = async (e?: KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    
    if (participantName.trim() && selectedEvent) {
      const newParticipant: Participant = {
        id: crypto.randomUUID(),
        name: participantName.trim()
      };
      
      const updatedEvent = {
        ...selectedEvent,
        participants: [...selectedEvent.participants, newParticipant]
      };

      try {
        await persistEvent(updatedEvent);
        setParticipantName('');
      } catch (error) {
        console.error('Error adding participant:', error);
      }
    }
  };

  const handleAddExpense = async (e?: KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    
    if (selectedEvent && newExpense.title && newExpense.amount && newExpense.paidBy) {
      if (!newExpense.splitBetween || newExpense.splitBetween.length === 0) {
        alert(t('selectParticipants'));
        return;
      }

      const expense: Expense = {
        id: crypto.randomUUID(),
        title: newExpense.title,
        amount: Number(newExpense.amount),
        date: newExpense.date || new Date().toISOString().split('T')[0],
        paidBy: newExpense.paidBy,
        splitBetween: newExpense.splitBetween || []
      };
      
      const updatedEvent = {
        ...selectedEvent,
        expenses: [...selectedEvent.expenses, expense]
      };

      try {
        await persistEvent(updatedEvent);
        resetExpenseForm();
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      title: expense.title,
      amount: expense.amount,
      date: expense.date,
      paidBy: expense.paidBy,
      splitBetween: expense.splitBetween
    });
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense || !selectedEvent || !newExpense.title || !newExpense.amount || !newExpense.paidBy) {
      return;
    }

    if (!newExpense.splitBetween || newExpense.splitBetween.length === 0) {
      alert(t('selectParticipants'));
      return;
    }

    const updatedExpense: Expense = {
      ...editingExpense,
      title: newExpense.title,
      amount: Number(newExpense.amount),
      date: newExpense.date || editingExpense.date,
      paidBy: newExpense.paidBy,
      splitBetween: newExpense.splitBetween
    };

    const updatedEvent = {
      ...selectedEvent,
      expenses: selectedEvent.expenses.map(e => 
        e.id === editingExpense.id ? updatedExpense : e
      )
    };

    try {
      await persistEvent(updatedEvent);
      resetExpenseForm();
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const cancelEditExpense = () => {
    resetExpenseForm();
  };

  const toggleParticipantInSplit = (participantId: string) => {
    setNewExpense(prev => {
      const currentSplitBetween = prev.splitBetween || [];
      const newSplitBetween = currentSplitBetween.includes(participantId)
        ? currentSplitBetween.filter(id => id !== participantId)
        : [...currentSplitBetween, participantId];
      
      return {
        ...prev,
        splitBetween: newSplitBetween
      };
    });
  };

  const selectAllParticipants = () => {
    if (selectedEvent) {
      setNewExpense(prev => ({
        ...prev,
        splitBetween: selectedEvent.participants.map(p => p.id)
      }));
    }
  };

  const removeParticipant = async (participantId: string) => {
    if (selectedEvent) {
      const updatedEvent = {
        ...selectedEvent,
        participants: selectedEvent.participants.filter(p => p.id !== participantId),
        expenses: selectedEvent.expenses.filter(e => e.paidBy !== participantId)
      };

      try {
        await persistEvent(updatedEvent);
      } catch (error) {
        console.error('Error removing participant:', error);
      }
    }
  };

  const removeExpense = async (expenseId: string) => {
    if (selectedEvent) {
      const updatedEvent = {
        ...selectedEvent,
        expenses: selectedEvent.expenses.filter(e => e.id !== expenseId)
      };

      try {
        await persistEvent(updatedEvent);
      } catch (error) {
        console.error('Error removing expense:', error);
      }
    }
  };

  // İyileştirilmiş hesaplama fonksiyonu - Muhasebesel doğruluk için
  const calculateSummary = () => {
    if (!selectedEvent) return null;

    // Toplam masrafları hesapla
    const totalExpenses = selectedEvent.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Her katılımcı için hesaplamaları yap
    const personalSummary = selectedEvent.participants.map(participant => {
      // Bu kişinin ödediği toplam tutar
      const paid = selectedEvent.expenses
        .filter(e => e.paidBy === participant.id)
        .reduce((sum, e) => sum + e.amount, 0);
      
      // Bu kişinin ödemesi gereken toplam tutar
      const shouldPay = selectedEvent.expenses
        .filter(e => (e.splitBetween || []).includes(participant.id))
        .reduce((sum, e) => {
          const splitCount = (e.splitBetween || []).length;
          return splitCount > 0 ? sum + (e.amount / splitCount) : sum;
        }, 0);
      
      // Bakiye hesaplama: pozitif = alacaklı, negatif = borçlu
      const balance = paid - shouldPay;
      
      return {
        ...participant,
        paid: Math.round(paid * 100) / 100, // 2 ondalık basamağa yuvarla
        shouldPay: Math.round(shouldPay * 100) / 100,
        balance: Math.round(balance * 100) / 100
      };
    });

    // Doğrulama: Tüm bakiyelerin toplamı 0 olmalı (muhasebesel denge)
    const totalBalance = personalSummary.reduce((sum, person) => sum + person.balance, 0);
    const balanceCheck = Math.abs(totalBalance) < 0.01; // Floating point hatalarını tolere et

    if (!balanceCheck) {
      console.warn('Muhasebesel denge hatası! Toplam bakiye:', totalBalance);
    }

    // İstatistikler
    const averagePerPerson = selectedEvent.participants.length > 0 ? 
      Math.round((totalExpenses / selectedEvent.participants.length) * 100) / 100 : 0;
    
    const topSpender = personalSummary.reduce((max, person) => 
      person.paid > max.paid ? person : max, 
      { paid: 0, name: '', id: '' }
    );
    
    const mostOwed = personalSummary.reduce((max, person) => 
      person.balance < max.balance ? person : max, 
      { balance: 0, name: '', id: '' }
    );

    // Hesaplama doğruluğu kontrolü
    const totalPaid = personalSummary.reduce((sum, person) => sum + person.paid, 0);
    const totalShouldPay = personalSummary.reduce((sum, person) => sum + person.shouldPay, 0);
    
    const paidCheck = Math.abs(totalPaid - totalExpenses) < 0.01;
    const shouldPayCheck = Math.abs(totalShouldPay - totalExpenses) < 0.01;

    if (!paidCheck) {
      console.warn('Ödeme toplamı hatası! Beklenen:', totalExpenses, 'Hesaplanan:', totalPaid);
    }
    if (!shouldPayCheck) {
      console.warn('Ödenecek tutar toplamı hatası! Beklenen:', totalExpenses, 'Hesaplanan:', totalShouldPay);
    }

    return {
      total: Math.round(totalExpenses * 100) / 100,
      personal: personalSummary,
      averagePerPerson,
      topSpender: topSpender.paid > 0 ? topSpender : null,
      mostOwed: mostOwed.balance < 0 ? mostOwed : null,
      // Doğrulama bilgileri
      validation: {
        balanceCheck,
        paidCheck,
        shouldPayCheck,
        totalBalance: Math.round(totalBalance * 100) / 100
      }
    };
  };

  const summary = calculateSummary();

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex items-center space-x-2 text-purple-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-purple-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                {t('appName')}
              </h1>
              <p className="text-gray-600">
                Etkinliklere erişmek için şifre gereklidir
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Şifre ile giriş yaptıktan sonra tüm cihazlarınızdan erişebilirsiniz
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handlePasswordSubmit(e)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-lg tracking-widest"
                  placeholder="••••••"
                  maxLength={6}
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                )}
              </div>

              <button
                onClick={() => handlePasswordSubmit()}
                disabled={!password.trim()}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Giriş Yap
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center mb-4">
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100"
            >
              Çıkış Yap
            </button>
          </div>
          
          {/* Current Date and Time */}
          <div className="bg-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-center space-x-2 text-purple-600">
              <Clock className="w-5 h-5" />
              <span className="text-sm md:text-base font-medium text-center">
                {formatDateTime(currentTime)}
              </span>
            </div>
          </div>
          
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6">
              {t('appName')}
            </h1>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('eventName')}
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  onKeyDown={(e) => handleCreateEvent(e)}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  placeholder={t('eventPlaceholder')}
                />
              </div>

              <button
                onClick={() => handleCreateEvent()}
                disabled={!eventName.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md:text-base"
              >
                <Plus className="inline-block w-4 h-4 md:w-5 md:h-5 mr-2" />
                {t('createEvent')}
              </button>
            </div>
          </div>

          {events.length > 0 && (
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-medium text-gray-800 mb-4">{t('myEvents')}</h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('searchEvents')}
                    className="w-full pl-9 md:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredEvents.map(event => {
                  const totalExpenses = event.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                  
                  return (
                    <div
                      key={event.id}
                      className="p-3 md:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className="flex-grow cursor-pointer min-w-0"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <h3 className="font-medium text-gray-900 text-sm md:text-base truncate">{event.title}</h3>
                          <div className="mt-1 text-xs md:text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              <span className="truncate">
                                {new Date(event.date).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                              <span>{event.participants.length} {t('participants')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-2 ml-2 flex-shrink-0">
                          {totalExpenses > 0 && (
                            <div className="text-right">
                              <div className="font-semibold text-purple-600 text-sm md:text-base">
                                {totalExpenses.toFixed(2)} ₺
                              </div>
                              <div className="text-xs text-gray-600">
                                {event.expenses.length} {t('expenses')}
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {eventToDelete && (
            <div className="fixed inset-0 z-50 overflow-y-auto p-4">
              <div className="flex items-center justify-center min-h-screen">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="relative w-full max-w-md p-4 md:p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    {t('confirmDeletion')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('deleteConfirmationMessage')}
                    <span className="block mt-2 text-lg font-mono font-bold text-red-600">
                      {confirmationCode}
                    </span>
                  </p>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
                      placeholder={t('enterConfirmationCode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm md:text-base"
                    />
                    {deleteError && (
                      <p className="mt-2 text-sm text-red-600">{deleteError}</p>
                    )}
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => setEventToDelete(null)}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteEvent}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-4 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedEvent(null)}
            className="flex items-center text-purple-600 hover:text-purple-800 text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1" />
            {t('goBack')}
          </button>
          <h1 className="text-lg md:text-2xl font-semibold text-gray-800 text-center flex-1 mx-4 truncate">
            {selectedEvent.title}
          </h1>
          <div className="text-xs md:text-sm text-gray-500 flex-shrink-0">
            {new Date(selectedEvent.date).toLocaleDateString('tr-TR')}
          </div>
        </div>

        {/* Hesaplama doğruluğu uyarısı */}
        {summary?.validation && (!summary.validation.balanceCheck || !summary.validation.paidCheck || !summary.validation.shouldPayCheck) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Hesaplama Uyarısı
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Hesaplamalarda küçük farklılıklar tespit edildi. Toplam bakiye: {summary.validation.totalBalance} ₺</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-medium text-gray-800 mb-4">{t('participants')}</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                onKeyDown={(e) => handleAddParticipant(e)}
                className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                placeholder={t('participantName')}
              />
              <button
                onClick={() => handleAddParticipant()}
                disabled={!participantName.trim()}
                className="px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex-shrink-0"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedEvent.participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${participantColors[index % participantColors.length]}`}
                >
                  <Users className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="truncate max-w-24 md:max-w-none">{participant.name}</span>
                  <button
                    onClick={() => removeParticipant(participant.id)}
                    className="hover:opacity-70 flex-shrink-0"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedEvent.participants.length > 0 && (
          <>
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                {editingExpense ? 'Masrafı Düzenle' : t('addNewExpense')}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('description')}
                  </label>
                  <input
                    type="text"
                    value={newExpense.title || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                    onKeyDown={(e) => editingExpense ? undefined : handleAddExpense(e)}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    placeholder={t('expensePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('amount')}
                  </label>
                  <input
                    type="number"
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                    onKeyDown={(e) => editingExpense ? undefined : handleAddExpense(e)}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('paidBy')}
                  </label>
                  <select
                    value={newExpense.paidBy || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  >
                    <option value="">{t('selectWhoPaid')}</option>
                    {selectedEvent.participants.map(participant => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('splitBetween')}
                  </label>
                  <div className="mb-2">
                    <button
                      onClick={selectAllParticipants}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      {t('selectAll')}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedEvent.participants.map(participant => (
                      <label
                        key={participant.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-purple-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(newExpense.splitBetween || []).includes(participant.id)}
                          onChange={() => toggleParticipantInSplit(participant.id)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm md:text-base truncate">{participant.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingExpense ? (
                    <>
                      <button
                        onClick={handleUpdateExpense}
                        disabled={!newExpense.title || !newExpense.amount || !newExpense.paidBy || !(newExpense.splitBetween || []).length}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm md:text-base"
                      >
                        Güncelle
                      </button>
                      <button
                        onClick={cancelEditExpense}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm md:text-base"
                      >
                        İptal
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddExpense()}
                      disabled={!newExpense.title || !newExpense.amount || !newExpense.paidBy || !(newExpense.splitBetween || []).length}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 text-sm md:text-base"
                    >
                      {t('addExpense')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {summary && (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Kişi Başı Ortalama</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {summary.averagePerPerson.toFixed(2)} ₺
                        </div>
                      </div>
                    </div>
                  </div>

                  {summary.topSpender && (
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">En Çok Harcayan</div>
                          <div className="text-sm font-semibold text-green-600 truncate">
                            {summary.topSpender.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {summary.topSpender.paid.toFixed(2)} ₺
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {summary.mostOwed && (
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                          <TrendingUp className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">En Çok Borçlu</div>
                          <div className="text-sm font-semibold text-red-600 truncate">
                            {summary.mostOwed.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {Math.abs(summary.mostOwed.balance).toFixed(2)} ₺
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <h2 className="text-lg font-medium text-gray-800">{t('expenseSummary')}</h2>
                    {selectedEvent.expenses.length > 0 && (
                      <button
                        onClick={() => {
                          const wb = XLSX.utils.book_new();
                          
                          const expensesData = selectedEvent.expenses.map(expense => ({
                            Date: new Date(expense.date).toLocaleDateString('tr-TR'),
                            Description: expense.title,
                            Amount: expense.amount,
                            'Paid By': selectedEvent.participants.find(p => p.id === expense.paidBy)?.name,
                            'Split Between': expense.splitBetween
                              .map(id => selectedEvent.participants.find(p => p.id === id)?.name)
                              .filter(Boolean)
                              .join(', ')
                          }));
                          const expensesWS = XLSX.utils.json_to_sheet(expensesData);
                          XLSX.utils.book_append_sheet(wb, expensesWS, t('expenses'));
                          
                          const summaryData = [
                            { [t('totalExpense')]: summary.total },
                            { 'Kişi Başı Ortalama': summary.averagePerPerson },
                            {},
                            ...summary.personal.map(p => ({
                              'Person': p.name,
                              [t('paid')]: p.paid,
                              [t('shouldPay')]: p.shouldPay,
                              'Balance': p.balance
                            }))
                          ];
                          const summaryWS = XLSX.utils.json_to_sheet(summaryData);
                          XLSX.utils.book_append_sheet(wb, summaryWS, t('expenseSummary'));
                          
                          XLSX.writeFile(wb, `${selectedEvent.title}_expenses.xlsx`);
                        }}
                        className="flex items-center text-purple-600 hover:text-purple-800 text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        {t('exportToExcel')}
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 md:p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600">{t('totalExpense')}</div>
                      <div className="text-lg md:text-xl font-semibold text-purple-600">
                        {summary.total.toFixed(2)} ₺
                      </div>
                    </div>

                    <div className="space-y-3">
                      {summary.personal.map((person, index) => (
                        <div key={person.id} className="p-3 md:p-4 bg-purple-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`font-medium px-2 py-1 rounded text-sm ${participantColors[index % participantColors.length]}`}>
                              {person.name}
                            </span>
                            <span className={`font-semibold text-sm md:text-base ${
                              person.balance >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {person.balance.toFixed(2)} ₺
                            </span>
                          </div>
                          <div className="text-xs md:text-sm space-y-1">
                            <div className="flex justify-between text-gray-600">
                              <span>{t('paid')}:</span>
                              <span>{person.paid.toFixed(2)} ₺</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>{t('shouldPay')}:</span>
                              <span>{person.shouldPay.toFixed(2)} ₺</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedEvent.expenses.length > 0 && (
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-medium text-gray-800 mb-4">{t('expenses')}</h2>
                
                <div className="space-y-3">
                  {selectedEvent.expenses.map(expense => (
                    <div key={expense.id} className="flex items-start justify-between p-3 md:p-4 bg-purple-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{expense.title}</span>
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 space-y-1">
                          <div className="truncate">
                            {t('paidBy')}: {selectedEvent.participants.find(p => p.id === expense.paidBy)?.name}
                          </div>
                          <div className="text-xs">
                            {new Date(expense.date).toLocaleString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-xs">
                            {t('splitBetween')}: {expense.splitBetween
                              .map(id => selectedEvent.participants.find(p => p.id === id)?.name)
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="font-semibold text-purple-600 text-sm md:text-base">
                          {expense.amount.toFixed(2)} ₺
                        </span>
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeExpense(expense.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
