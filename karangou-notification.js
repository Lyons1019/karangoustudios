// Fichier: server/services/notification/index.js

const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

/**
 * Service de gestion des notifications en temps réel pour Karangou Studios
 */
class NotificationService {
  constructor() {
    this.clients = new Map(); // Map pour stocker les connexions WebSocket par userId
    this.wss = null; // WebSocket server
  }

  /**
   * Initialise le serveur WebSocket pour les notifications
   * @param {Object} server - Serveur HTTP/Express
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      let userId = null;
      
      // Authentifier la connexion
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          // Authentification avec JWT
          if (data.type === 'auth' && data.token) {
            try {
              const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
              userId = decoded.id;
              
              // Stocker la connexion dans la map
              if (!this.clients.has(userId)) {
                this.clients.set(userId, []);
              }
              
              this.clients.get(userId).push(ws);
              
              // Envoyer les notifications non lues à l'utilisateur
              this.sendUnreadNotifications(userId);
              
              // Accusé de réception d'authentification
              ws.send(JSON.stringify({
                type: 'auth_success',
                message: 'Connecté au service de notifications'
              }));
            } catch (error) {
              ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Token invalide'
              }));
            }
          }
        } catch (error) {
          console.error('Erreur de traitement du message WebSocket:', error);
        }
      });
      
      // Gérer la déconnexion
      ws.on('close', () => {
        if (userId && this.clients.has(userId)) {
          const userConnections = this.clients.get(userId);
          const index = userConnections.indexOf(ws);
          
          if (index !== -1) {
            userConnections.splice(index, 1);
          }
          
          // Supprimer l'entrée si aucune connexion restante
          if (userConnections.length === 0) {
            this.clients.delete(userId);
          }
        }
      });
    });
    
    console.log('Service de notifications WebSocket initialisé');
  }

  /**
   * Envoie les notifications non lues à un utilisateur
   * @param {number} userId - ID de l'utilisateur
   */
  async sendUnreadNotifications(userId) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          isRead: false
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (notifications.length > 0 && this.clients.has(userId)) {
        const connections = this.clients.get(userId);
        
        const message = JSON.stringify({
          type: 'unread_notifications',
          data: notifications
        });
        
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications non lues:', error);
    }
  }

  /**
   * Crée une nouvelle notification
   * @param {number} userId - ID de l'utilisateur
   * @param {string} type - Type de notification ('contribution', 'project_update', 'comment', 'system', etc.)
   * @param {string} content - Contenu de la notification
   * @param {number} relatedId - ID de l'objet lié (projet, film, etc.)
   * @returns {Promise<Object>} - La notification créée
   */
  async createNotification(userId, type, content, relatedId = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          content,
          relatedId,
          isRead: false,
          createdAt: new Date()
        }
      });
      
      // Envoyer immédiatement la notification si l'utilisateur est connecté
      if (this.clients.has(userId)) {
        const connections = this.clients.get(userId);
        
        const message = JSON.stringify({
          type: 'new_notification',
          data: notification
        });
        
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          }
        });
      }
      
      return notification;
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw new Error(`Échec de la création de la notification: ${error.message}`);
    }
  }

  /**
   * Marque une notification comme lue
   * @param {number} notificationId - ID de la notification
   * @param {number} userId - ID de l'utilisateur (pour vérification)
   * @returns {Promise<Object>} - La notification mise à jour
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId
        }
      });
      
      if (!notification) {
        throw new Error('Notification non trouvée ou accès non autorisé');
      }
      
      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      
      return updatedNotification;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      throw new Error(`Échec du marquage de la notification: ${error.message}`);
    }
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} - Nombre de notifications mises à jour
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
      
      return result.count;
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
      throw new Error(`Échec du marquage des notifications: ${error.message}`);
    }
  }

  /**
   * Récupère toutes les notifications d'un utilisateur (avec pagination)
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} - Liste paginée des notifications
   */
  async getNotifications(userId, { page = 1, limit = 20, onlyUnread = false }) {
    try {
      const skip = (page - 1) * limit;
      
      const where = {
        userId
      };
      
      if (onlyUnread) {
        where.isRead = false;
      }
      
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: parseInt(limit)
        }),
        prisma.notification.count({ where })
      ]);
      
      return {
        data: notifications,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw new Error(`Échec de la récupération des notifications: ${error.message}`);
    }
  }

  /**
   * Envoie une notification de système à tous les utilisateurs
   * @param {string} content - Contenu de la notification
   * @param {Array<number>} userIds - Liste des IDs d'utilisateurs (null pour tous)
   * @returns {Promise<number>} - Nombre de notifications créées
   */
  async broadcastSystemNotification(content, userIds = null) {
    try {
      let where = {};
      
      if (userIds && userIds.length > 0) {
        where.id = {
          in: userIds
        };
      }
      
      // Récupérer les utilisateurs cibles
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true
        }
      });
      
      // Créer une notification pour chaque utilisateur
      const notificationPromises = users.map(user => 
        this.createNotification(user.id, 'system', content)
      );
      
      const results = await Promise.all(notificationPromises);
      
      return results.length;
    } catch (error) {
      console.error('Erreur lors de la diffusion de la notification:', error);
      throw new Error(`Échec de la diffusion de la notification: ${error.message}`);
    }
  }

  /**
   * Envoie une notification à tous les abonnés d'un projet
   * @param {number} projectId - ID du projet
   * @param {string} content - Contenu de la notification
   * @returns {Promise<number>} - Nombre de notifications créées
   */
  async notifyProjectSubscribers(projectId, content) {
    try {
      // Récupérer tous les contributeurs du projet
      const contributions = await prisma.contribution.findMany({
        where: {
          projectId
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });
      
      const subscriberIds = contributions.map(c => c.userId);
      
      // Ajouter le créateur du projet
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
      });
      
      if (project && !subscriberIds.includes(project.userId)) {
        subscriberIds.push(project.userId);
      }
      
      // Créer une notification pour chaque abonné
      const notificationPromises = subscriberIds.map(userId => 
        this.createNotification(userId, 'project_update', content, projectId)
      );
      
      const results = await Promise.all(notificationPromises);
      
      return results.length;
    } catch (error) {
      console.error('Erreur lors de la notification des abonnés:', error);
      throw new Error(`Échec de la notification des abonnés: ${error.message}`);
    }
  }
}

// Exporter une instance unique du service
module.exports = new NotificationService();
