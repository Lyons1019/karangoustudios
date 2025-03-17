// Fichier: server/services/chat/index.js

const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

/**
 * Service de gestion du chat en ligne pour Karangou Studios
 * Permet aux utilisateurs d'échanger en direct avec l'équipe des films
 */
class ChatService {
  constructor() {
    this.connections = new Map(); // Map pour stocker les connexions WebSocket par filmId et userId
    this.wss = null; // WebSocket server
    this.blockedPatterns = [
      // Modèles de numéros de téléphone
      /(?:\+?\d{2,3}[\s-]?)?\d{7,10}/g,
      // Modèles d'emails
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      // Liens WhatsApp
      /(?:https?:\/\/)?(?:www\.)?wa(?:\.me|pp\.com)\/(?:send\/?\?phone=|\+)?[\d\s]+/gi,
      // Liens Facebook/Messenger
      /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.(?:com|me)\/[\w.]+/gi,
      // Liens vers des réseaux sociaux
      /(?:https?:\/\/)?(?:www\.)?(?:instagram|twitter|tiktok|snapchat)\.com\/[\w.]+/gi
    ];
  }

  /**
   * Initialise le serveur WebSocket pour le chat
   * @param {Object} server - Serveur HTTP/Express
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/chat'
    });
    
    this.wss.on('connection', (ws, req) => {
      let userId = null;
      let filmId = null;
      let userRole = null;
      let userName = null;
      
      console.log('Nouvelle connexion au chat établie');
      
      // Authentifier la connexion
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          // Authentification avec JWT
          if (data.type === 'auth' && data.token) {
            try {
              const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'chat-secret');
              userId = decoded.id;
              userRole = decoded.type;
              
              // Vérifier que l'utilisateur existe
              const user = await prisma.user.findUnique({
                where: { id: userId }
              });
              
              if (!user) {
                ws.send(JSON.stringify({
                  type: 'auth_error',
                  message: 'Utilisateur non trouvé'
                }));
                return;
              }
              
              userName = user.name;
              
              // Associer à un film si spécifié
              if (data.filmId) {
                filmId = parseInt(data.filmId);
                
                // Vérifier que le film existe
                const film = await prisma.film.findUnique({
                  where: { id: filmId }
                });
                
                if (!film) {
                  ws.send(JSON.stringify({
                    type: 'auth_error',
                    message: 'Film non trouvé'
                  }));
                  return;
                }
                
                // Stocker la connexion dans la map
                if (!this.connections.has(filmId)) {
                  this.connections.set(filmId, new Map());
                }
                
                this.connections.get(filmId).set(userId, {
                  ws,
                  userName,
                  userRole,
                  connectionTime: new Date()
                });
                
                // Notifier les autres utilisateurs de la nouvelle connexion
                this.broadcastUserList(filmId);
                
                // Accusé de réception d'authentification
                ws.send(JSON.stringify({
                  type: 'auth_success',
                  message: 'Connecté au chat du film',
                  userId,
                  userName,
                  userRole,
                  filmId
                }));
                
                // Envoyer les derniers messages
                this.sendRecentMessages(ws, filmId);
              } else {
                ws.send(JSON.stringify({
                  type: 'auth_error',
                  message: 'ID du film requis'
                }));
              }
            } catch (error) {
              console.error('Erreur d\'authentification chat:', error);
              ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Token invalide'
              }));
            }
          }
          // Envoi d'un message
          else if (data.type === 'chat_message' && userId && filmId) {
            // Filtrer le contenu du message
            const filteredContent = this.filterMessage(data.content);
            
            // Si le contenu filtré est différent, c'est qu'il y avait du contenu interdit
            if (filteredContent !== data.content) {
              ws.send(JSON.stringify({
                type: 'message_rejected',
                message: 'Votre message contient des informations personnelles ou des liens externes non autorisés',
                originalContent: data.content
              }));
              return;
            }
            
            // Enregistrer le message en base de données
            const chatMessage = await prisma.chatMessage.create({
              data: {
                filmId,
                userId,
                content: filteredContent,
                createdAt: new Date()
              }
            });
            
            // Préparer le message pour broadcast
            const messageToSend = {
              type: 'chat_message',
              messageId: chatMessage.id,
              userId,
              userName,
              userRole,
              content: filteredContent,
              timestamp: chatMessage.createdAt
            };
            
            // Diffuser le message à tous les utilisateurs connectés au chat du film
            this.broadcastToFilm(filmId, messageToSend);
          }
        } catch (error) {
          console.error('Erreur de traitement du message chat:', error);
        }
      });
      
      // Gérer la déconnexion
      ws.on('close', () => {
        if (userId && filmId && this.connections.has(filmId)) {
          const filmConnections = this.connections.get(filmId);
          
          if (filmConnections.has(userId)) {
            filmConnections.delete(userId);
            
            // Notifier les autres utilisateurs de la déconnexion
            this.broadcastUserList(filmId);
          }
          
          // Supprimer la map du film si elle est vide
          if (filmConnections.size === 0) {
            this.connections.delete(filmId);
          }
        }
      });
    });
    
    console.log('Service de chat initialisé');
  }

  /**
   * Filtre un message pour supprimer les informations personnelles
   * @param {string} message - Message à filtrer
   * @returns {string} - Message filtré
   */
  filterMessage(message) {
    let filteredMessage = message;
    
    // Appliquer tous les filtres de pattern
    this.blockedPatterns.forEach(pattern => {
      filteredMessage = filteredMessage.replace(pattern, '***');
    });
    
    return filteredMessage;
  }

  /**
   * Diffuse un message à tous les utilisateurs connectés à un film
   * @param {number} filmId - ID du film
   * @param {Object} message - Message à diffuser
   */
  broadcastToFilm(filmId, message) {
    if (!this.connections.has(filmId)) {
      return;
    }
    
    const filmConnections = this.connections.get(filmId);
    const messageString = JSON.stringify(message);
    
    for (const connection of filmConnections.values()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(messageString);
      }
    }
  }

  /**
   * Diffuse la liste des utilisateurs connectés à un film
   * @param {number} filmId - ID du film
   */
  broadcastUserList(filmId) {
    if (!this.connections.has(filmId)) {
      return;
    }
    
    const filmConnections = this.connections.get(filmId);
    const users = [];
    
    for (const [userId, connection] of filmConnections.entries()) {
      users.push({
        userId,
        userName: connection.userName,
        userRole: connection.userRole,
        connectionTime: connection.connectionTime
      });
    }
    
    const message = {
      type: 'user_list',
      filmId,
      users
    };
    
    this.broadcastToFilm(filmId, message);
  }

  /**
   * Envoie les messages récents d'un film à un utilisateur
   * @param {WebSocket} ws - WebSocket de l'utilisateur
   * @param {number} filmId - ID du film
   */
  async sendRecentMessages(ws, filmId) {
    try {
      const recentMessages = await prisma.chatMessage.findMany({
        where: {
          filmId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50, // Limiter aux 50 derniers messages
        include: {
          user: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      });
      
      // Inverser pour avoir les messages dans l'ordre chronologique
      recentMessages.reverse();
      
      const formattedMessages = recentMessages.map(message => ({
        type: 'chat_message',
        messageId: message.id,
        userId: message.userId,
        userName: message.user.name,
        userRole: message.user.type,
        content: message.content,
        timestamp: message.createdAt
      }));
      
      ws.send(JSON.stringify({
        type: 'chat_history',
        messages: formattedMessages
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des messages récents:', error);
    }
  }

  /**
   * Récupère l'historique de chat d'un film avec pagination
   * @param {number} filmId - ID du film
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} - Historique de chat paginé
   */
  async getChatHistory(filmId, { page = 1, limit = 50 }) {
    try {
      const skip = (page - 1) * limit;
      
      const [messages, total] = await Promise.all([
        prisma.chatMessage.findMany({
          where: {
            filmId
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: parseInt(limit),
          include: {
            user: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }),
        prisma.chatMessage.count({
          where: { filmId }
        })
      ]);
      
      const formattedMessages = messages.map(message => ({
        messageId: message.id,
        userId: message.userId,
        userName: message.user.name,
        userRole: message.user.type,
        content: message.content,
        timestamp: message.createdAt
      }));
      
      return {
        data: formattedMessages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique de chat:', error);
      throw new Error(`Échec de la récupération de l'historique: ${error.message}`);
    }
  }

  /**
   * Envoie une notification système dans le chat d'un film
   * @param {number} filmId - ID du film
   * @param {string} content - Contenu de la notification
   */
  async sendSystemMessage(filmId, content) {
    try {
      // Enregistrer le message système
      const systemMessage = await prisma.chatMessage.create({
        data: {
          filmId,
          content,
          isSystem: true,
          createdAt: new Date()
        }
      });
      
      // Diffuser le message
      this.broadcastToFilm(filmId, {
        type: 'system_message',
        messageId: systemMessage.id,
        content,
        timestamp: systemMessage.createdAt
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message système:', error);
    }
  }

  /**
   * Récupère la liste des membres de l'équipe d'un film disponibles pour le chat
   * @param {number} filmId - ID du film
   * @returns {Promise<Array>} - Liste des membres de l'équipe
   */
  async getFilmTeamMembers(filmId) {
    try {
      // Récupérer le film et son créateur
      const film = await prisma.film.findUnique({
        where: { id: filmId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              type: true,
              profilePictureUrl: true
            }
          }
        }
      });
      
      if (!film) {
        throw new Error('Film non trouvé');
      }
      
      // Récupérer les membres d'équipe associés au film
      const teamMembers = await prisma.filmTeamMember.findMany({
        where: { filmId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              type: true,
              profilePictureUrl: true
            }
          }
        }
      });
      
      // Fusionner le créateur et les membres d'équipe
      const allMembers = [
        {
          id: film.creator.id,
          name: film.creator.name,
          role: film.creator.type,
          profilePicture: film.creator.profilePictureUrl,
          isOnline: this.isUserOnline(filmId, film.creator.id)
        },
        ...teamMembers.map(member => ({
          id: member.user.id,
          name: member.user.name,
          role: member.role,
          profilePicture: member.user.profilePictureUrl,
          isOnline: this.isUserOnline(filmId, member.user.id)
        }))
      ];
      
      return allMembers;
    } catch (error) {
      console.error('Erreur lors de la récupération des membres de l\'équipe:', error);
      throw new Error(`Échec de la récupération des membres: ${error.message}`);
    }
  }

  /**
   * Vérifie si un utilisateur est en ligne dans le chat d'un film
   * @param {number} filmId - ID du film
   * @param {number} userId - ID de l'utilisateur
   * @returns {boolean} - true si en ligne, false sinon
   */
  isUserOnline(filmId, userId) {
    if (!this.connections.has(filmId)) {
      return false;
    }
    
    const filmConnections = this.connections.get(filmId);
    return filmConnections.has(userId);
  }
}

// Exporter une instance unique du service
module.exports = new ChatService();
