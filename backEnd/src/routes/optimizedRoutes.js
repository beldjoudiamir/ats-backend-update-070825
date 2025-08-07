// Routes optimisées utilisant le système CRUD générique
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { verifyToken } = require("../utils/middleware.js");
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');

// Import des contrôleurs spécialisés
const CommissionnaireController = require('../controllers/commissionnaireController');
const TransporteurController = require('../controllers/transporteurController');
const ClientController = require('../controllers/clientController');

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '../../../frontEnd/public/uploads/'));
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ storage: storage });

module.exports = (collection, collection2, collection3, collection4, collection5, collection6, collection7, collection8, collection9, collection10, users, userSettings) => {
  
  // Initialisation des contrôleurs spécialisés
  const commissionnaireController = new CommissionnaireController(collection9); // listeCommissionnaire
  const transporteurController = new TransporteurController(collection2); // clients (transporteurs)
  const clientController = new ClientController(collection3); // listeClients

  // ===== ROUTES DE SANTÉ ET SURVEILLANCE =====
  
  // Route de santé générale
  router.get("/health", async (req, res) => {
    try {
      await collection.findOne({});
      
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: "1.0.0",
        services: {
          database: "connected",
          server: "running"
        }
      });
    } catch (err) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: err.message,
        services: {
          database: "disconnected",
          server: "running"
        }
      });
    }
  });

  // Route de santé de la base de données
  router.get("/database-health", async (req, res) => {
    try {
      const startTime = Date.now();
      
      const collections = [collection, collection2, collection3, collection4, collection5, collection6, collection7, collection8, collection9, collection10];
      const collectionNames = ['company', 'clients', 'listeClients', 'estimate', 'invoice', 'listeCommissionnaire', 'transportOrder', 'receivedMessage', 'conditionsTransport', 'notes'];
      
      const dbTests = [];
      
      for (let i = 0; i < collections.length; i++) {
        try {
          const testStart = Date.now();
          await collections[i].findOne({});
          const testTime = Date.now() - testStart;
          
          dbTests.push({
            collection: collectionNames[i],
            status: 'connected',
            responseTime: testTime,
            error: null
          });
        } catch (error) {
          dbTests.push({
            collection: collectionNames[i],
            status: 'error',
            responseTime: null,
            error: error.message
          });
        }
      }
      
      const totalTime = Date.now() - startTime;
      const successfulTests = dbTests.filter(test => test.status === 'connected').length;
      
      res.json({
        status: successfulTests === dbTests.length ? "healthy" : "partial",
        timestamp: new Date().toISOString(),
        totalCollections: dbTests.length,
        connectedCollections: successfulTests,
        failedCollections: dbTests.length - successfulTests,
        summary: {
          allConnected: successfulTests === dbTests.length,
          successRate: Math.round((successfulTests / dbTests.length) * 100)
        },
        collections: dbTests,
        responseTime: totalTime
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // ===== ROUTES CRUD COMMISSIONNAIRES =====
  
  // Routes de base CRUD
  router.post("/listeCommissionnaire", commissionnaireController.create.bind(commissionnaireController));
  router.get("/listeCommissionnaire", commissionnaireController.findAll.bind(commissionnaireController));
  router.get("/listeCommissionnaire/:id", commissionnaireController.findById.bind(commissionnaireController));
  router.put("/listeCommissionnaire/:id", commissionnaireController.update.bind(commissionnaireController));
  router.delete("/listeCommissionnaire/:id", commissionnaireController.delete.bind(commissionnaireController));
  
  // Routes spécialisées commissionnaires
  router.get("/listeCommissionnaire/specialite/:specialite", commissionnaireController.findBySpecialite.bind(commissionnaireController));
  router.get("/listeCommissionnaire/pays/:pays", commissionnaireController.findByPays.bind(commissionnaireController));
  router.get("/listeCommissionnaire/stats/pays", commissionnaireController.getStatsByPays.bind(commissionnaireController));
  router.get("/listeCommissionnaire/specialites", commissionnaireController.getSpecialites.bind(commissionnaireController));
  router.post("/listeCommissionnaire/bulk", commissionnaireController.bulkCreate.bind(commissionnaireController));
  router.get("/listeCommissionnaire/stats", commissionnaireController.getStats.bind(commissionnaireController));
  router.get("/listeCommissionnaire/health", async (req, res) => {
    try {
      const stats = await commissionnaireController.crudService.getStats();
      
      res.json({
        status: "healthy",
        entity: "Commissionnaire",
        timestamp: new Date().toISOString(),
        stats: stats.success ? stats.data : null,
        message: "Commissionnaire service is running"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        entity: "Commissionnaire",
        timestamp: new Date().toISOString(),
        error: error.message,
        message: "Commissionnaire service is not responding"
      });
    }
  });

  // ===== ROUTES CRUD TRANSPORTEURS =====
  
  // Routes de base CRUD
  router.post("/clients", transporteurController.create.bind(transporteurController));
  router.get("/clients", transporteurController.findAll.bind(transporteurController));
  router.get("/clients/:id", transporteurController.findById.bind(transporteurController));
  router.put("/clients/:id", transporteurController.update.bind(transporteurController));
  router.delete("/clients/:id", transporteurController.delete.bind(transporteurController));
  
  // Routes spécialisées transporteurs
  router.get("/clients/type/:typeTransport", transporteurController.findByTypeTransport.bind(transporteurController));
  router.get("/clients/zone/:zone", transporteurController.findByZoneGeographique.bind(transporteurController));
  router.get("/clients/capacite", transporteurController.findByCapacite.bind(transporteurController));
  router.get("/clients/stats/type", transporteurController.getStatsByTypeTransport.bind(transporteurController));
  router.get("/clients/types", transporteurController.getTypesTransport.bind(transporteurController));
  router.get("/clients/zones", transporteurController.getZonesGeographiques.bind(transporteurController));
  router.post("/clients/bulk", transporteurController.bulkCreate.bind(transporteurController));
  router.get("/clients/stats", transporteurController.getStats.bind(transporteurController));
  router.get("/clients/health", async (req, res) => {
    try {
      const stats = await transporteurController.crudService.getStats();
      
      res.json({
        status: "healthy",
        entity: "Transporteur",
        timestamp: new Date().toISOString(),
        stats: stats.success ? stats.data : null,
        message: "Transporteur service is running"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        entity: "Transporteur",
        timestamp: new Date().toISOString(),
        error: error.message,
        message: "Transporteur service is not responding"
      });
    }
  });

  // ===== ROUTES CRUD CLIENTS =====
  
  // Routes de base CRUD
  router.post("/listeClients", clientController.create.bind(clientController));
  router.get("/listeClients", clientController.findAll.bind(clientController));
  router.get("/listeClients/:id", clientController.findById.bind(clientController));
  router.put("/listeClients/:id", clientController.update.bind(clientController));
  router.delete("/listeClients/:id", clientController.delete.bind(clientController));
  
  // Routes spécialisées clients
  router.get("/listeClients/secteur/:secteur", clientController.findBySecteurActivite.bind(clientController));
  router.get("/listeClients/taille/:taille", clientController.findByTailleEntreprise.bind(clientController));
  router.get("/listeClients/statut/:statut", clientController.findByStatut.bind(clientController));
  router.get("/listeClients/vip", clientController.getClientsVIP.bind(clientController));
  router.get("/listeClients/stats/secteur", clientController.getStatsBySecteur.bind(clientController));
  router.get("/listeClients/stats/taille", clientController.getStatsByTaille.bind(clientController));
  router.get("/listeClients/secteurs", clientController.getSecteursActivite.bind(clientController));
  router.put("/listeClients/:id/statut", clientController.updateStatut.bind(clientController));
  router.post("/listeClients/bulk", clientController.bulkCreate.bind(clientController));
  router.get("/listeClients/stats", clientController.getStats.bind(clientController));
  router.get("/listeClients/health", async (req, res) => {
    try {
      const stats = await clientController.crudService.getStats();
      
      res.json({
        status: "healthy",
        entity: "Client",
        timestamp: new Date().toISOString(),
        stats: stats.success ? stats.data : null,
        message: "Client service is running"
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        entity: "Client",
        timestamp: new Date().toISOString(),
        error: error.message,
        message: "Client service is not responding"
      });
    }
  });

  // ===== ROUTES UTILITAIRES =====
  
  // Route pour obtenir les informations de l'entreprise
  router.get("/myCompanyInfo", async (req, res) => {
    try {
      const companyInfo = await collection.findOne({});
      if (companyInfo) {
        res.json(companyInfo);
      } else {
        res.status(404).json({ error: "Informations entreprise non trouvées" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour obtenir le numéro de téléphone de l'entreprise
  router.get("/companyPhone", async (req, res) => {
    try {
      const infos = await collection.find({}).toArray();
      if (infos.length > 0 && infos[0].phone) {
        res.json({ phone: infos[0].phone });
      } else {
        res.status(404).json({ error: 'Numéro de téléphone non trouvé' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

  // Route pour les paramètres utilisateur
  router.get("/userSettings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await userSettings.findOne({ userId });
      
      if (settings) {
        res.json(settings);
      } else {
        res.status(404).json({ error: "Paramètres utilisateur non trouvés" });
      }
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route pour mettre à jour les paramètres utilisateur
  router.put("/userSettings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      
      const result = await userSettings.updateOne(
        { userId },
        { $set: updateData },
        { upsert: true }
      );
      
      res.json({ 
        success: true, 
        message: "Paramètres utilisateur mis à jour",
        updated: result.modifiedCount > 0,
        created: result.upsertedCount > 0
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // ===== ROUTES D'UPLOAD =====
  
  // Route pour l'upload de fichiers
  router.post("/upload", upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier fourni" });
      }
      
      res.json({
        success: true,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'upload" });
    }
  });

  // ===== ROUTES D'AUTHENTIFICATION =====
  
  // Route de connexion
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis" });
      }
      
      const user = await users.findOne({ email });
      
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }
      
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route d'inscription
  router.post("/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }
      
      const existingUser = await users.findOne({ email });
      
      if (existingUser) {
        return res.status(400).json({ error: "Email déjà utilisé" });
      }
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      const newUser = {
        email,
        password: hashedPassword,
        name,
        createdAt: new Date()
      };
      
      const result = await users.insertOne(newUser);
      
      const token = jwt.sign(
        { userId: result.insertedId, email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      
      res.status(201).json({
        success: true,
        token,
        user: {
          id: result.insertedId,
          email,
          name
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // Route protégée pour vérifier le token
  router.get("/verify", verifyToken, (req, res) => {
    res.json({
      success: true,
      message: "Token valide",
      user: req.user
    });
  });

  // ===== ROUTES DE DOCUMENTATION =====
  
  // Route pour obtenir la documentation des API
  router.get("/docs", (req, res) => {
    res.json({
      title: "API Documentation",
      version: "1.0.0",
      description: "Documentation des endpoints disponibles",
      endpoints: {
        health: {
          GET: "/health",
          description: "Vérification de santé générale"
        },
        databaseHealth: {
          GET: "/database-health",
          description: "Vérification de santé de la base de données"
        },
        commissionnaires: {
          base: "/listeCommissionnaire",
          endpoints: [
            "POST / - Créer un commissionnaire",
            "GET / - Lister tous les commissionnaires",
            "GET /:id - Obtenir un commissionnaire",
            "PUT /:id - Mettre à jour un commissionnaire",
            "DELETE /:id - Supprimer un commissionnaire",
            "GET /specialite/:specialite - Rechercher par spécialité",
            "GET /pays/:pays - Rechercher par pays",
            "GET /stats/pays - Statistiques par pays",
            "GET /specialites - Liste des spécialités",
            "POST /bulk - Créer plusieurs commissionnaires",
            "GET /stats - Statistiques générales",
            "GET /health - Santé du service"
          ]
        },
        transporteurs: {
          base: "/clients",
          endpoints: [
            "POST / - Créer un transporteur",
            "GET / - Lister tous les transporteurs",
            "GET /:id - Obtenir un transporteur",
            "PUT /:id - Mettre à jour un transporteur",
            "DELETE /:id - Supprimer un transporteur",
            "GET /type/:typeTransport - Rechercher par type de transport",
            "GET /zone/:zone - Rechercher par zone géographique",
            "GET /capacite - Rechercher par capacité",
            "GET /stats/type - Statistiques par type de transport",
            "GET /types - Types de transport disponibles",
            "GET /zones - Zones géographiques disponibles",
            "POST /bulk - Créer plusieurs transporteurs",
            "GET /stats - Statistiques générales",
            "GET /health - Santé du service"
          ]
        },
        clients: {
          base: "/listeClients",
          endpoints: [
            "POST / - Créer un client",
            "GET / - Lister tous les clients",
            "GET /:id - Obtenir un client",
            "PUT /:id - Mettre à jour un client",
            "DELETE /:id - Supprimer un client",
            "GET /secteur/:secteur - Rechercher par secteur d'activité",
            "GET /taille/:taille - Rechercher par taille d'entreprise",
            "GET /statut/:statut - Rechercher par statut",
            "GET /vip - Clients VIP",
            "GET /stats/secteur - Statistiques par secteur",
            "GET /stats/taille - Statistiques par taille",
            "GET /secteurs - Secteurs d'activité disponibles",
            "PUT /:id/statut - Mettre à jour le statut",
            "POST /bulk - Créer plusieurs clients",
            "GET /stats - Statistiques générales",
            "GET /health - Santé du service"
          ]
        }
      }
    });
  });

  return router;
}; 