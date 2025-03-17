// Fichier: backend/services/payment/mobileMoney.js
const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient }

// Exporter le service
module.exports = MobileMoneyService; = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Service d'intégration Mobile Money pour Karangou Studios
 * FONCTIONNALITÉ CORE: Ce service est essentiel pour la plateforme VOD-CROWDFUNDING
 * Supporte les fournisseurs internationaux et africains de paiement mobile
 */
class MobileMoneyService {
  constructor() {
    this.providers = {
      // Opérateurs africains existants
      mtn: {
        name: 'MTN Mobile Money',
        baseUrl: process.env.MTN_API_BASE_URL,
        apiKey: process.env.MTN_API_KEY,
        apiSecret: process.env.MTN_API_SECRET,
        callbackUrl: `${process.env.API_BASE_URL}/payments/mobile-money/callback/mtn`,
        countries: ['Togo', 'Ghana', 'Nigeria', 'Côte d\'Ivoire', 'Cameroun', 'Rwanda', 'Afrique du Sud']
      }

  /**
   * Vérifie le statut d'une transaction MTN
   */
  async checkMtnTransactionStatus(transactionId) {
    try {
      const { baseUrl, apiKey, apiSecret } = this.providers.mtn;
      
      // Obtenir un token d'accès
      const tokenResponse = await axios.post(
        `${baseUrl}/collection/token`,
        { grant_type: 'client_credentials' },
        {
          auth: {
            username: apiKey,
            password: apiSecret
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // Vérifier le statut
      const statusResponse = await axios.get(
        `${baseUrl}/collection/v1/requesttopay/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Target-Environment': 'production'
          }
        }
      );
      
      return {
        status: statusResponse.data.status === 'SUCCESSFUL' ? 'completed' : 
                (statusResponse.data.status === 'FAILED' ? 'failed' : 'pending')
      };
      
    } catch (error) {
      console.error('Erreur MTN Status API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la vérification avec MTN: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une transaction Moov/Flooz
   */
  async checkMoovFloozTransactionStatus(provider, transactionId) {
    try {
      const { baseUrl, apiKey, apiSecret } = this.providers[provider];
      
      // Vérifier le statut (adapter selon l'API réelle)
      const statusResponse = await axios.get(
        `${baseUrl}/api/v1/transactions/${transactionId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        status: statusResponse.data.status === 'SUCCESS' ? 'completed' : 
                (statusResponse.data.status === 'FAILED' ? 'failed' : 'pending')
      };
      
    } catch (error) {
      console.error(`Erreur ${provider} Status API:`, error.response?.data || error.message);
      throw new Error(`Erreur lors de la vérification avec ${provider}: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une transaction Orange Money
   */
  async checkOrangeTransactionStatus(transactionId) {
    try {
      const { baseUrl, apiKey, apiSecret } = this.providers.orange;
      
      // Obtenir un token d'accès
      const tokenResponse = await axios.post(
        `${baseUrl}/oauth/token`,
        { grant_type: 'client_credentials' },
        {
          auth: {
            username: apiKey,
            password: apiSecret
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // Vérifier le statut
      const statusResponse = await axios.get(
        `${baseUrl}/payment/v1/payments/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        status: statusResponse.data.status === 'SUCCESSFUL' ? 'completed' : 'failed'
      };
      
    } catch (error) {
      console.error('Erreur Orange Money Status API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la vérification avec Orange Money: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une transaction Wave
   */
  async checkWaveTransactionStatus(transactionId) {
    try {
      const { baseUrl, apiKey } = this.providers.wave;
      
      // Vérifier le statut
      const statusResponse = await axios.get(
        `${baseUrl}/checkout/sessions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        status: statusResponse.data.status === 'SUCCESSFUL' ? 'completed' : 
                (statusResponse.data.status === 'FAILED' ? 'failed' : 'pending')
      };
      
    } catch (error) {
      console.error('Erreur Wave Status API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la vérification avec Wave: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une transaction PayPal
   */
  async checkPayPalTransactionStatus(transactionId) {
    try {
      const { baseUrl, clientId, clientSecret } = this.internationalMethods.paypal;
      
      // Obtenir un token d'accès
      const tokenResponse = await axios.post(
        `${baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          auth: {
            username: clientId,
            password: clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // Récupérer la transaction pour obtenir l'ordre PayPal
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { transactionId }
      });
      
      if (!transaction || !transaction.providerReference) {
        throw new Error(`Transaction PayPal incomplète ou manquante: ${transactionId}`);
      }
      
      // Vérifier le statut de l'ordre
      const orderResponse = await axios.get(
        `${baseUrl}/v2/checkout/orders/${transaction.providerReference}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        status: orderResponse.data.status === 'COMPLETED' ? 'completed' : 'pending'
      };
      
    } catch (error) {
      console.error('Erreur PayPal Status API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la vérification avec PayPal: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une transaction Stripe
   */
  async checkStripeTransactionStatus(transactionId) {
    try {
      const { apiKey } = this.internationalMethods.stripe;
      
      // Récupérer la transaction pour obtenir la session Stripe
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { transactionId }
      });
      
      if (!transaction || !transaction.providerReference) {
        throw new Error(`Transaction Stripe incomplète ou manquante: ${transactionId}`);
      }
      
      // Configuration de Stripe
      const stripe = require('stripe')(apiKey);
      
      // Vérifier le statut de la session
      const session = await stripe.checkout.sessions.retrieve(transaction.providerReference);
      
      return {
        status: session.payment_status === 'paid' ? 'completed' : 'pending'
      };
      
    } catch (error) {
      console.error('Erreur Stripe Status API:', error);
      throw new Error(`Erreur lors de la vérification avec Stripe: ${error.message}`);
    }
  }

  /**
   * Annule une transaction en attente
   * @param {string} transactionId - ID de la transaction à annuler
   * @returns {Promise<Object>} - Résultat de l'annulation
   */
  async cancelTransaction(transactionId) {
    try {
      // Récupérer la transaction
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { transactionId }
      });
      
      if (!transaction) {
        throw new Error(`Transaction non trouvée: ${transactionId}`);
      }
      
      // Vérifier si la transaction peut être annulée
      if (transaction.status === 'completed') {
        throw new Error('Impossible d\'annuler une transaction déjà complétée');
      }
      
      if (transaction.status === 'cancelled') {
        return {
          success: true,
          message: 'Transaction déjà annulée',
          transactionId
        };
      }
      
      // Tenter d'annuler la transaction auprès du fournisseur
      let providerCancelled = false;
      
      try {
        switch (transaction.provider) {
          case 'mtn':
          case 'moov':
          case 'flooz':
          case 'orange':
          case 'wave':
            // Pour les fournisseurs de mobile money, l'annulation côté fournisseur
            // peut ne pas être disponible, nous mettons donc à jour notre statut local
            providerCancelled = true;
            break;
            
          case 'paypal':
            providerCancelled = await this.cancelPayPalTransaction(transaction);
            break;
            
          case 'stripe':
            providerCancelled = await this.cancelStripeTransaction(transaction);
            break;
            
          default:
            providerCancelled = true; // Par défaut, supposons que nous pouvons annuler localement
        }
      } catch (error) {
        console.warn(`Erreur lors de l'annulation auprès du fournisseur ${transaction.provider}:`, error.message);
        // Continuer avec l'annulation locale même si l'annulation fournisseur échoue
      }
      
      // Mettre à jour la transaction dans la base de données
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'cancelled',
          updatedAt: new Date(),
          errorMessage: 'Transaction annulée par l\'utilisateur ou l\'administrateur'
        }
      });
      
      // Créer une notification pour l'utilisateur
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          type: 'transaction_cancelled',
          content: `Votre transaction de ${transaction.amount} ${transaction.currency} a été annulée.`,
          read: false,
          createdAt: new Date()
        }
      });
      
      return {
        success: true,
        message: 'Transaction annulée avec succès',
        transactionId,
        providerCancelled
      };
      
    } catch (error) {
      console.error(`Erreur lors de l'annulation de la transaction:`, error);
      throw new Error(`Échec de l'annulation: ${error.message}`);
    }
  }

  /**
   * Annule une transaction PayPal
   * @param {Object} transaction - Données de la transaction
   * @returns {Promise<boolean>} - true si annulé avec succès
   */
  async cancelPayPalTransaction(transaction) {
    const { baseUrl, clientId, clientSecret } = this.internationalMethods.paypal;
    
    // Obtenir un token d'accès
    const tokenResponse = await axios.post(
      `${baseUrl}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: clientId,
          password: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Annuler l'ordre (si non exécuté)
    if (transaction.providerReference) {
      await axios.post(
        `${baseUrl}/v2/checkout/orders/${transaction.providerReference}/cancel`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    return true;
  }

  /**
   * Annule une transaction Stripe
   * @param {Object} transaction - Données de la transaction
   * @returns {Promise<boolean>} - true si annulé avec succès
   */
  async cancelStripeTransaction(transaction) {
    const { apiKey } = this.internationalMethods.stripe;
    
    // Configuration de Stripe
    const stripe = require('stripe')(apiKey);
    
    // Annuler la session si possible
    if (transaction.providerReference) {
      await stripe.checkout.sessions.expire(transaction.providerReference);
    }
    
    return true;
  }

  /**
   * Génère un rapport des transactions pour une période donnée
   * @param {Date} startDate - Date de début
   * @param {Date} endDate - Date de fin
   * @param {string} status - Statut des transactions (optionnel)
   * @returns {Promise<Object>} - Rapport des transactions
   */
  async generateTransactionReport(startDate, endDate, status = null) {
    try {
      // Construire la requête
      const query = {
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      };
      
      // Ajouter le filtre de statut si spécifié
      if (status) {
        query.where.status = status;
      }
      
      // Récupérer les transactions
      const transactions = await prisma.paymentTransaction.findMany(query);
      
      // Calculer les statistiques
      const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const successfulTransactions = transactions.filter(t => t.status === 'completed');
      const successRate = transactions.length > 0 
        ? (successfulTransactions.length / transactions.length) * 100 
        : 0;
      
      // Grouper par fournisseur
      const byProvider = {};
      transactions.forEach(t => {
        const provider = t.provider || 'unknown';
        if (!byProvider[provider]) {
          byProvider[provider] = {
            count: 0,
            amount: 0,
            successful: 0
          };
        }
        byProvider[provider].count++;
        byProvider[provider].amount += parseFloat(t.amount);
        if (t.status === 'completed') {
          byProvider[provider].successful++;
        }
      });
      
      // Grouper par projet
      const byProject = {};
      for (const t of transactions) {
        if (!byProject[t.projectId]) {
          // Obtenir le nom du projet
          const project = await prisma.project.findUnique({
            where: { id: t.projectId },
            select: { title: true }
          });
          
          byProject[t.projectId] = {
            projectId: t.projectId,
            projectTitle: project ? project.title : `Projet #${t.projectId}`,
            count: 0,
            amount: 0,
            successful: 0
          };
        }
        byProject[t.projectId].count++;
        byProject[t.projectId].amount += parseFloat(t.amount);
        if (t.status === 'completed') {
          byProject[t.projectId].successful++;
        }
      }
      
      return {
        period: {
          from: startDate,
          to: endDate
        },
        summary: {
          totalTransactions: transactions.length,
          totalAmount,
          successfulTransactions: successfulTransactions.length,
          successRate: successRate.toFixed(2)
        },
        byProvider,
        byProject: Object.values(byProject)
      };
      
    } catch (error) {
      console.error(`Erreur lors de la génération du rapport:`, error);
      throw new Error(`Échec de la génération du rapport: ${error.message}`);
    }
  }

  /**
   * Lance une tentative de réconciliation pour les transactions en attente
   * @param {number} olderThanHours - Réconcilier les transactions plus anciennes que ce nombre d'heures
   * @returns {Promise<Object>} - Résultats de la réconciliation
   */
  async reconcilePendingTransactions(olderThanHours = 24) {
    try {
      const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
      
      // Récupérer les transactions en attente plus anciennes que la date limite
      const pendingTransactions = await prisma.paymentTransaction.findMany({
        where: {
          status: 'pending',
          createdAt: {
            lt: cutoffDate
          }
        }
      });
      
      console.log(`Réconciliation de ${pendingTransactions.length} transactions en attente...`);
      
      const results = {
        processed: 0,
        completed: 0,
        failed: 0,
        remained_pending: 0,
        errors: 0
      };
      
      // Traiter chaque transaction
      for (const transaction of pendingTransactions) {
        try {
          results.processed++;
          
          // Vérifier le statut auprès du fournisseur
          const status = await this.checkTransactionStatus(transaction.transactionId);
          
          // Mettre à jour le compteur approprié
          if (status.transaction.status === 'completed') {
            results.completed++;
          } else if (status.transaction.status === 'failed') {
            results.failed++;
          } else if (status.transaction.status === 'pending') {
            results.remained_pending++;
          }
          
        } catch (error) {
          console.error(`Erreur lors de la réconciliation de la transaction ${transaction.transactionId}:`, error);
          results.errors++;
        }
      }
      
      return {
        success: true,
        timestamp: new Date(),
        olderThanHours,
        results
      };
      
    } catch (error) {
      console.error(`Erreur lors de la réconciliation des transactions:`, error);
      throw new Error(`Échec de la réconciliation: ${error.message}`);
    }
  }
},
      moov: {
        name: 'Moov Money',
        baseUrl: process.env.MOOV_API_BASE_URL,
        apiKey: process.env.MOOV_API_KEY,
        apiSecret: process.env.MOOV_API_SECRET,
        callbackUrl: `${process.env.API_BASE_URL}/payments/mobile-money/callback/moov`,
        countries: ['Togo', 'Bénin', 'Côte d\'Ivoire', 'Niger', 'Burkina Faso']
      },
      flooz: {
        name: 'Flooz',
        baseUrl: process.env.FLOOZ_API_BASE_URL,
        apiKey: process.env.FLOOZ_API_KEY,
        apiSecret: process.env.FLOOZ_API_SECRET,
        callbackUrl: `${process.env.API_BASE_URL}/payments/mobile-money/callback/flooz`,
        countries: ['Togo', 'Bénin', 'Côte d\'Ivoire', 'Niger', 'Burkina Faso']
      },
      
      // Ajout de nouveaux opérateurs
      orange: {
        name: 'Orange Money',
        baseUrl: process.env.ORANGE_API_BASE_URL,
        apiKey: process.env.ORANGE_API_KEY,
        apiSecret: process.env.ORANGE_API_SECRET,
        callbackUrl: `${process.env.API_BASE_URL}/payments/mobile-money/callback/orange`,
        countries: ['Sénégal', 'Mali', 'Madagascar', 'Cameroun', 'Côte d\'Ivoire', 'Guinée', 'RDC']
      },
      wave: {
        name: 'Wave',
        baseUrl: process.env.WAVE_API_BASE_URL,
        apiKey: process.env.WAVE_API_KEY,
        apiSecret: process.env.WAVE_API_SECRET,
        callbackUrl: `${process.env.API_BASE_URL}/payments/mobile-money/callback/wave`,
        countries: ['Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso']
      }
    };
    
    // Méthodes de paiement internationales
    this.internationalMethods = {
      paypal: {
        name: 'PayPal',
        baseUrl: process.env.PAYPAL_API_BASE_URL,
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        callbackUrl: `${process.env.API_BASE_URL}/payments/paypal/callback`
      },
      stripe: {
        name: 'Stripe',
        apiKey: process.env.STRIPE_API_KEY,
        callbackUrl: `${process.env.API_BASE_URL}/payments/stripe/callback`,
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'JPY']
      }
    };
  }

  /**
   * Génère un identifiant de transaction unique
   */
  generateTransactionId() {
    return `MM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Formate le numéro de téléphone au format international
   * @param {string} phoneNumber - Numéro de téléphone à formater
   * @param {string} countryCode - Code pays à utiliser par défaut (ex: '228' pour Togo)
   * @returns {string} Numéro de téléphone formaté
   */
  formatPhoneNumber(phoneNumber, countryCode = '228') {
    // Nettoyer le numéro (enlever espaces, tirets, etc.)
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Vérifier si le numéro commence déjà par un code pays
    if (!cleaned.match(/^(00|\+)?[1-9]\d{1,3}/)) {
      if (cleaned.length <= 10) {
        // Ajouter le code pays si absent
        cleaned = `${countryCode}${cleaned}`;
      }
    } else {
      // Enlever le préfixe + ou 00
      cleaned = cleaned.replace(/^\+|^00/, '');
    }
    
    return cleaned;
  }

  /**
   * Valide si le numéro de téléphone appartient au réseau spécifié
   * @param {string} phoneNumber - Numéro de téléphone à valider
   * @param {string} provider - Fournisseur de Mobile Money
   * @returns {boolean} - true si valide, false sinon
   */
  validateProviderPhoneNumber(phoneNumber, provider) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    // Validation selon le pays et le fournisseur
    switch (provider) {
      case 'mtn':
        // Togo: 90, 91, 92, 93
        if (formattedNumber.startsWith('228')) {
          return /^228(90|91|92|93)\d{6}$/.test(formattedNumber);
        }
        // Ghana: 024, 054, 055, 059
        else if (formattedNumber.startsWith('233')) {
          return /^233(24|54|55|59)\d{7}$/.test(formattedNumber);
        }
        // Logique pour d'autres pays MTN...
        return true; // Validation simplifiée pour les autres pays
        
      case 'moov':
      case 'flooz':
        // Togo: 96, 97, 98, 99
        if (formattedNumber.startsWith('228')) {
          return /^228(96|97|98|99)\d{6}$/.test(formattedNumber);
        }
        // Logique pour autres pays Moov/Flooz...
        return true;
        
      case 'orange':
        // Sénégal: 77, 78
        if (formattedNumber.startsWith('221')) {
          return /^221(77|78)\d{7}$/.test(formattedNumber);
        }
        // Mali: 07, 09
        else if (formattedNumber.startsWith('223')) {
          return /^223(07|09)\d{7}$/.test(formattedNumber);
        }
        // Logique pour autres pays Orange...
        return true;
        
      case 'wave':
        // Wave fonctionne généralement sur les mêmes numéros qu'Orange
        if (formattedNumber.startsWith('221')) { // Sénégal
          return /^221(77|78)\d{7}$/.test(formattedNumber);
        }
        // Autres pays Wave...
        return true;
        
      default:
        return false;
    }
  }

  /**
   * Identifie automatiquement le fournisseur approprié basé sur le numéro de téléphone
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {string|null} - Identifiant du fournisseur ou null si non identifié
   */
  identifyProvider(phoneNumber) {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    
    // Vérifier pour chaque fournisseur
    for (const [providerId, provider] of Object.entries(this.providers)) {
      if (this.validateProviderPhoneNumber(formattedNumber, providerId)) {
        return providerId;
      }
    }
    
    return null;
  }

  /**
   * Initie un paiement Mobile Money
   * @param {string} provider - Fournisseur de Mobile Money ('mtn', 'moov', 'flooz', etc.)
   * @param {string} phoneNumber - Numéro de téléphone du client
   * @param {number} amount - Montant à payer (en FCFA ou monnaie locale)
   * @param {number} projectId - ID du projet associé
   * @param {number} userId - ID de l'utilisateur
   * @param {string} description - Description du paiement
   * @param {string} currency - Code de la devise (XOF par défaut pour FCFA)
   * @returns {Promise<Object>} - Résultat de l'initiation du paiement
   */
  async initiatePayment(provider, phoneNumber, amount, projectId, userId, description, currency = 'XOF') {
    try {
      // Vérifier que le fournisseur est valide
      if (!this.providers[provider]) {
        throw new Error(`Fournisseur non pris en charge: ${provider}`);
      }
      
      // Formater et valider le numéro de téléphone
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.validateProviderPhoneNumber(formattedPhone, provider)) {
        throw new Error(`Le numéro ${phoneNumber} n'est pas valide pour ${this.providers[provider].name}`);
      }
      
      // Générer un ID de transaction unique
      const transactionId = this.generateTransactionId();
      
      // Enregistrer la transaction dans la base de données
      const transaction = await prisma.paymentTransaction.create({
        data: {
          transactionId,
          userId,
          projectId,
          amount,
          currency,
          method: 'mobile_money',
          provider,
          phoneNumber: formattedPhone,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Préparer les données pour l'API du fournisseur
      let apiResponse;
      
      switch (provider) {
        case 'mtn':
          apiResponse = await this.processMtnPayment(formattedPhone, amount, transactionId, description, currency);
          break;
        case 'moov':
          apiResponse = await this.processMoovPayment(formattedPhone, amount, transactionId, description, currency);
          break;
        case 'flooz':
          apiResponse = await this.processFloozPayment(formattedPhone, amount, transactionId, description, currency);
          break;
        case 'orange':
          apiResponse = await this.processOrangePayment(formattedPhone, amount, transactionId, description, currency);
          break;
        case 'wave':
          apiResponse = await this.processWavePayment(formattedPhone, amount, transactionId, description, currency);
          break;
        default:
          throw new Error(`Fournisseur non supporté: ${provider}`);
      }
      
      // Mettre à jour la transaction avec les informations de la réponse API
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          updatedAt: new Date(),
          providerReference: apiResponse.sessionId || apiResponse.referenceId || null
          // Stocker des informations supplémentaires de la réponse si nécessaire
        }
      });
      
      return {
        success: true,
        transactionId,
        provider: this.providers[provider].name,
        message: `Demande de paiement envoyée au numéro ${phoneNumber}. Veuillez confirmer la transaction sur votre téléphone.`,
        amount,
        currency,
        referenceData: apiResponse
      };
      
    } catch (error) {
      console.error(`Erreur lors de l'initiation du paiement ${provider}:`, error);
      
      // Enregistrer l'erreur si une transaction a été créée
      if (error.transactionId) {
        await prisma.paymentTransaction.update({
          where: { transactionId: error.transactionId },
          data: {
            status: 'failed',
            errorMessage: error.message,
            updatedAt: new Date()
          }
        });
      }
      
      throw new Error(`Échec de l'initiation du paiement: ${error.message}`);
    }
  }

  /**
   * Traite un paiement via MTN Mobile Money
   */
  async processMtnPayment(phoneNumber, amount, transactionId, description, currency = 'XOF') {
    try {
      const { baseUrl, apiKey, apiSecret, callbackUrl } = this.providers.mtn;
      
      // Obtenir un token d'accès (dans une implémentation réelle)
      const tokenResponse = await axios.post(
        `${baseUrl}/collection/token`,
        {
          grant_type: 'client_credentials'
        },
        {
          auth: {
            username: apiKey,
            password: apiSecret
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // Initier la demande de paiement
      const paymentResponse = await axios.post(
        `${baseUrl}/collection/v1/requesttopay`,
        {
          amount: amount.toString(),
          currency,
          externalId: transactionId,
          payer: {
            partyIdType: 'MSISDN',
            partyId: phoneNumber
          },
          payerMessage: description || 'Paiement Karangou Studios',
          payeeNote: `Contribution au projet #${transactionId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Reference-Id': transactionId,
            'X-Callback-Url': callbackUrl,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        referenceId: transactionId,
        status: paymentResponse.status === 202 ? 'pending' : 'failed'
      };
      
    } catch (error) {
      console.error('Erreur MTN Mobile Money API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la communication avec MTN Mobile Money: ${error.message}`);
    }
  }

  /**
   * Traite un paiement via Moov Money
   */
  async processMoovPayment(phoneNumber, amount, transactionId, description, currency = 'XOF') {
    try {
      const { baseUrl, apiKey, apiSecret, callbackUrl } = this.providers.moov;
      
      // Simuler une implémentation Moov Money (adapter selon l'API réelle)
      const paymentResponse = await axios.post(
        `${baseUrl}/api/v1/payments`,
        {
          phoneNumber,
          amount: amount.toString(),
          currency,
          reference: transactionId,
          description: description || 'Paiement Karangou Studios',
          callbackUrl: `${callbackUrl}?reference=${transactionId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        referenceId: transactionId,
        status: 'pending',
        providerReference: paymentResponse.data.providerReference
      };
      
    } catch (error) {
      console.error('Erreur Moov Money API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la communication avec Moov Money: ${error.message}`);
    }
  }

  /**
   * Traite un paiement via Flooz
   */
  async processFloozPayment(phoneNumber, amount, transactionId, description, currency = 'XOF') {
    try {
      const { baseUrl, apiKey, apiSecret, callbackUrl } = this.providers.flooz;
      
      // Simuler une implémentation Flooz (adapter selon l'API réelle)
      const paymentResponse = await axios.post(
        `${baseUrl}/api/merchant/payments`,
        {
          msisdn: phoneNumber,
          amount: amount.toString(),
          currency,
          orderId: transactionId,
          description: description || 'Paiement Karangou Studios',
          callbackUrl: `${callbackUrl}?orderId=${transactionId}`
        },
        {
          headers: {
            'X-API-Key': apiKey,
            'X-API-Secret': apiSecret,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        referenceId: transactionId,
        status: 'pending',
        sessionId: paymentResponse.data.sessionId
      };
      
    } catch (error) {
      console.error('Erreur Flooz API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la communication avec Flooz: ${error.message}`);
    }
  }

  /**
   * Traite un paiement via Orange Money
   */
  async processOrangePayment(phoneNumber, amount, transactionId, description, currency = 'XOF') {
    try {
      const { baseUrl, apiKey, apiSecret, callbackUrl } = this.providers.orange;
      
      // Obtenir un token d'accès (selon l'API Orange Money)
      const tokenResponse = await axios.post(
        `${baseUrl}/oauth/token`,
        {
          grant_type: 'client_credentials'
        },
        {
          auth: {
            username: apiKey,
            password: apiSecret
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // Initier la demande de paiement
      const paymentResponse = await axios.post(
        `${baseUrl}/payment/v1/payments`,
        {
          amount: amount.toString(),
          currency,
          reference: transactionId,
          payerMessage: description || 'Paiement Karangou Studios',
          payeeNote: `Contribution au projet ${transactionId}`,
          msisdn: phoneNumber
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        referenceId: transactionId,
        status: paymentResponse.status === 202 ? 'pending' : 'failed'
      };
      
    } catch (error) {
      console.error('Erreur Orange Money API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la communication avec Orange Money: ${error.message}`);
    }
  }

  /**
   * Traite un paiement via Wave
   */
  async processWavePayment(phoneNumber, amount, transactionId, description, currency = 'XOF') {
    try {
      const { baseUrl, apiKey, apiSecret, callbackUrl } = this.providers.wave;
      
      // Initier la demande de paiement (selon l'API Wave)
      const paymentResponse = await axios.post(
        `${baseUrl}/checkout/sessions`,
        {
          amount: amount,
          currency,
          externalReference: transactionId,
          mobileNumber: phoneNumber,
          description: description || 'Paiement Karangou Studios',
          callbackUrl: `${callbackUrl}?ref=${transactionId}`
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        referenceId: transactionId,
        status: 'pending',
        sessionId: paymentResponse.data.sessionId,
        paymentUrl: paymentResponse.data.paymentUrl
      };
      
    } catch (error) {
      console.error('Erreur Wave API:', error.response?.data || error.message);
      throw new Error(`Erreur lors de la communication avec Wave: ${error.message}`);
    }
  }

  /**
   * Traite un paiement via PayPal
   * @param {number} amount - Montant en monnaie locale (sera converti)
   * @param {string} currency - Devise d'origine (XOF par défaut)
   * @param {number} projectId - ID du projet
   * @param {number} userId - ID de l'utilisateur
   * @param {string} description - Description du paiement
   * @returns {Promise<Object>} - Informations de paiement PayPal
   */
  async processPayPalPayment(amount, currency = 'XOF', projectId, userId, description) {
    try {
      const { baseUrl, clientId, clientSecret, callbackUrl } = this.internationalMethods.paypal;
      
      // Obtenir un token d'accès
      const tokenResponse = await axios.post(
        `${baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          auth: {
            username: clientId,
            password: clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const accessToken = tokenResponse.data.access_token;
      
      // Générer un ID de transaction unique
      const transactionId = this.generateTransactionId();
      
      // Convertir le montant FCFA en USD ou EUR selon le taux de change actuel
      // Dans une application réelle, utilisez un service de taux de change
      const convertedAmount = (amount / 600).toFixed(2); // Taux approximatif FCFA -> USD
      const targetCurrency = 'USD';
      
      // Créer un ordre PayPal
      const orderResponse = await axios.post(
        `${baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: transactionId,
              description: description || 'Contribution Karangou Studios',
              amount: {
                currency_code: targetCurrency,
                value: convertedAmount
              }
            }
          ],
          application_context: {
            return_url: `${callbackUrl}?transaction_id=${transactionId}&status=success`,
            cancel_url: `${callbackUrl}?transaction_id=${transactionId}&status=cancel`
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Enregistrer la transaction dans la base de données
      await prisma.paymentTransaction.create({
        data: {
          transactionId,
          userId,
          projectId,
          amount: parseFloat(convertedAmount),
          currency: targetCurrency,
          method: 'paypal',
          status: 'pending',
          providerReference: orderResponse.data.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      return {
        success: true,
        transactionId,
        approvalUrl: orderResponse.data.links.find(link => link.rel === 'approve').href,
        status: 'pending'
      };
      
    } catch (error) {
      console.error('Erreur PayPal API:', error.response?.data || error.message);
      throw new Error(`Échec de l'initiation du paiement PayPal: ${error.message}`);
    }
  }

  /**
   * Traite un paiement via Stripe
   * @param {number} amount - Montant en monnaie locale (sera converti)
   * @param {string} currency - Devise d'origine (XOF par défaut)
   * @param {number} projectId - ID du projet
   * @param {number} userId - ID de l'utilisateur
   * @param {string} description - Description du paiement
   * @param {Object} cardDetails - Détails de la carte (ou token)
   * @returns {Promise<Object>} - Informations de paiement Stripe
   */
  async processStripePayment(amount, currency = 'XOF', projectId, userId, description, cardDetails) {
    try {
      const { apiKey, callbackUrl } = this.internationalMethods.stripe;
      
      // Convertir en devise supportée si nécessaire
      let paymentAmount = amount;
      let paymentCurrency = currency;
      
      if (!this.internationalMethods.stripe.supportedCurrencies.includes(currency)) {
        // Convertir le montant en EUR par exemple
        paymentAmount = (amount / 656).toFixed(2); // Taux approximatif FCFA -> EUR
        paymentCurrency = 'EUR';
      }
      
      // Générer un ID de transaction unique
      const transactionId = this.generateTransactionId();
      
      // Configuration de Stripe
      const stripe = require('stripe')(apiKey);
      
      // Créer une session de paiement
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: paymentCurrency,
              product_data: {
                name: 'Contribution Karangou Studios',
                description: description || `Contribution au projet #${projectId}`
              },
              unit_amount: Math.round(paymentAmount * 100) // En centimes
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${callbackUrl}?transaction_id=${transactionId}&status=success`,
        cancel_url: `${callbackUrl}?transaction_id=${transactionId}&status=cancel`
      });
      
      // Enregistrer la transaction dans la base de données
      await prisma.paymentTransaction.create({
        data: {
          transactionId,
          userId,
          projectId,
          amount: parseFloat(paymentAmount),
          currency: paymentCurrency,
          method: 'stripe',
          providerReference: session.id,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      return {
        success: true,
        transactionId,
        sessionId: session.id,
        checkoutUrl: session.url,
        status: 'pending'
      };
      
    } catch (error) {
      console.error('Erreur Stripe API:', error);
      throw new Error(`Échec de l'initiation du paiement Stripe: ${error.message}`);
    }
  }

  /**
   * Traite les callbacks des fournisseurs de paiement
   * @param {string} provider - Fournisseur de paiement
   * @param {Object} callbackData - Données de callback du fournisseur
   * @returns {Promise<Object>} - Résultat du traitement
   */
  async processCallback(provider, callbackData) {
    try {
      let transactionId, status;
      
      // Extraire les informations pertinentes selon le fournisseur
      switch (provider) {
        case 'mtn':
          transactionId = callbackData.externalId;
          status = callbackData.status === 'SUCCESSFUL' ? 'completed' : 
                  (callbackData.status === 'FAILED' ? 'failed' : 'pending');
          break;
          
        case 'moov':
          transactionId = callbackData.reference;
          status = callbackData.status === 'SUCCESS' ? 'completed' : 
                  (callbackData.status === 'FAILED' ? 'failed' : 'pending');
          break;
          
        case 'flooz':
          transactionId = callbackData.orderId;
          status = callbackData.status === '00' ? 'completed' : 'failed';
          break;
          
        case 'orange':
          transactionId = callbackData.reference;
          status = callbackData.status === 'SUCCESSFUL' ? 'completed' : 'failed';
          break;
          
        case 'wave':
          transactionId = callbackData.externalReference;
          status = callbackData.status === 'SUCCESSFUL' ? 'completed' : 'failed';
          break;
          
        case 'paypal':
          transactionId = callbackData.transaction_id || callbackData.orderID;
          status = callbackData.status === 'success' || callbackData.status === 'COMPLETED' 
                  ? 'completed' : 'failed';
          break;
          
        case 'stripe':
          transactionId = callbackData.transaction_id;
          status = callbackData.status === 'success' ? 'completed' : 'failed';
          break;
          
        default:
          throw new Error(`Fournisseur non supporté: ${provider}`);
      }
      
      // Vérifier si la transaction existe
      const existingTransaction = await prisma.paymentTransaction.findUnique({
        where: { transactionId }
      });

      if (!existingTransaction) {
        throw new Error(`Transaction non trouvée: ${transactionId}`);
      }
      
      // Vérifier si la transaction a déjà été traitée
      if (existingTransaction.status === 'completed') {
        return {
          success: true,
          message: 'Transaction déjà traitée',
          transactionId,
          status: existingTransaction.status
        };
      }
      
      // Mettre à jour la transaction dans la base de données
      const transaction = await prisma.paymentTransaction.update({
        where: { transactionId },
        data: {
          status,
          updatedAt: new Date(),
          errorMessage: status === 'failed' ? (callbackData.reason || 'Paiement échoué') : null,
          rawResponse: JSON.stringify(callbackData) // Stocker la réponse brute pour référence
        }
      });
      
      // Si le paiement est réussi, créer la contribution au projet
      if (status === 'completed') {
        // Vérifier si une contribution existe déjà pour cette transaction
        const existingContribution = await prisma.contribution.findFirst({
          where: { transactionId }
        });

        if (!existingContribution) {
          // Créer la contribution
          await prisma.contribution.create({
            data: {
              userId: transaction.userId,
              projectId: transaction.projectId,
              amount: transaction.amount,
              paymentMethod: transaction.method,
              transactionId,
              status: 'completed',
              createdAt: new Date()
            }
          });
          
          // Mettre à jour le montant collecté par le projet
          await prisma.project.update({
            where: { id: transaction.projectId },
            data: {
              currentAmount: {
                increment: transaction.amount
              },
              updatedAt: new Date()
            }
          });
          
          // Obtenir les détails du projet pour la notification
          const project = await prisma.project.findUnique({
            where: { id: transaction.projectId },
            select: { title: true, creatorId: true }
          });
          
          // Créer une notification pour l'utilisateur contributeur
          await prisma.notification.create({
            data: {
              userId: transaction.userId,
              type: 'contribution_success',
              content: `Votre contribution de ${transaction.amount} ${transaction.currency} au projet "${project.title}" a été reçue avec succès.`,
              read: false,
              createdAt: new Date()
            }
          });
          
          // Créer une notification pour le créateur du projet
          await prisma.notification.create({
            data: {
              userId: project.creatorId,
              type: 'new_contribution',
              content: `Une nouvelle contribution de ${transaction.amount} ${transaction.currency} a été reçue pour votre projet "${project.title}".`,
              read: false,
              createdAt: new Date()
            }
          });
        }
      } else if (status === 'failed') {
        // Créer une notification pour l'utilisateur en cas d'échec
        await prisma.notification.create({
          data: {
            userId: transaction.userId,
            type: 'contribution_failed',
            content: `Votre paiement de ${transaction.amount} ${transaction.currency} n'a pas pu être traité. Raison: ${transaction.errorMessage || 'Erreur inconnue'}`,
            read: false,
            createdAt: new Date()
          }
        });
      }
      
      return {
        success: true,
        transactionId,
        status,
        message: status === 'completed' 
          ? 'Paiement traité avec succès' 
          : 'Paiement non complété'
      };
      
    } catch (error) {
      console.error(`Erreur lors du traitement du callback ${provider}:`, error);
      throw new Error(`Échec du traitement du callback: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une transaction
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} - Informations sur le statut de la transaction
   */
  async checkTransactionStatus(transactionId) {
    try {
      // Récupérer la transaction
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { transactionId }
      });
      
      if (!transaction) {
        throw new Error(`Transaction non trouvée: ${transactionId}`);
      }
      
      // Si la transaction est en attente, vérifier auprès du fournisseur
      if (transaction.status === 'pending') {
        try {
          const provider = transaction.provider;
          
          // Vérifier le statut auprès du fournisseur approprié
          let providerStatus;
          
          switch (provider) {
            case 'mtn':
              providerStatus = await this.checkMtnTransactionStatus(transactionId);
              break;
            case 'moov':
            case 'flooz':
              providerStatus = await this.checkMoovFloozTransactionStatus(provider, transactionId);
              break;
            case 'orange':
              providerStatus = await this.checkOrangeTransactionStatus(transactionId);
              break;
            case 'wave':
              providerStatus = await this.checkWaveTransactionStatus(transactionId);
              break;
            case 'paypal':
              providerStatus = await this.checkPayPalTransactionStatus(transactionId);
              break;
            case 'stripe':
              providerStatus = await this.checkStripeTransactionStatus(transactionId);
              break;
            default:
              throw new Error(`Fournisseur non supporté pour la vérification: ${provider}`);
          }
          
          // Si le statut a changé, simuler un callback pour mettre à jour
          if (providerStatus.status !== 'pending' && providerStatus.status !== transaction.status) {
            await this.processCallback(provider, {
              ...providerStatus,
              externalId: transactionId,
              reference: transactionId,
              orderId: transactionId,
              transaction_id: transactionId
            });
            
            // Récupérer la transaction mise à jour
            return await prisma.paymentTransaction.findUnique({
              where: { transactionId }
            });
          }
        } catch (error) {
          console.warn(`Erreur lors de la vérification auprès du fournisseur ${transaction.provider}:`, error.message);
          // Continuer avec les informations locales si la vérification échoue
        }
      }
      
      // Obtenir les informations de contribution si disponibles
      const contribution = transaction.status === 'completed' 
        ? await prisma.contribution.findFirst({
            where: { transactionId }
          })
        : null;
      
      // Récupérer les informations du projet
      const project = await prisma.project.findUnique({
        where: { id: transaction.projectId },
        select: { title: true, currentAmount: true, targetAmount: true }
      });
      
      return {
        success: true,
        transaction: {
          id: transaction.id,
          transactionId: transaction.transactionId,
          status: transaction.status,
          amount: transaction.amount,
          currency: transaction.currency,
          method: transaction.method,
          provider: transaction.provider,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        },
        contribution: contribution ? {
          id: contribution.id,
          status: contribution.status,
          createdAt: contribution.createdAt
        } : null,
        project: project ? {
          title: project.title,
          currentAmount: project.currentAmount,
          targetAmount: project.targetAmount,
          progress: Math.round((project.currentAmount / project.targetAmount) * 100)
        } : null
      };
      
    } catch (error) {
      console.error(`Erreur lors de la vérification de la transaction:`, error);
      throw new Error(`Échec de la vérification: ${error.message}`);
    }
  }