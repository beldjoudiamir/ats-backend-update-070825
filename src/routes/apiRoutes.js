// Fichier routes/apiRoutes.js - Routes API principales de l'application
const express = require("express");
const router = express.Router();
const { handleGet, handlePost, handlePut, handleDelete } = require("../utils/routeHandlers.js");
const multer = require('multer');
const path = require('path');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { verifyToken } = require("../utils/middleware.js");
const { getCompanyPhone } = require("../controllers/clientController");
const { ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Correction du chemin pour pointer vers le bon dossier uploads du frontend
    cb(null, path.resolve(__dirname, '../../../frontEnd/public/uploads/'));
  },
  filename: function (req, file, cb) {
    // Remplace les espaces par des underscores pour éviter les problèmes d'URL
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ storage: storage });

module.exports = (collection, collection2, collection3, collection4, collection5, collection6, collection7, collection8, collection9, collection10, users, userSettings) => {
  // Route de santé (health check) pour la surveillance API
  router.get("/health", async (req, res) => {
    try {
      // Test de connexion à la base de données
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

  // Route spécifique pour tester la base de données
  router.get("/database-health", async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Test de connexion à toutes les collections
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
        totalResponseTime: totalTime,
        collections: dbTests,
        summary: {
          allConnected: successfulTests === dbTests.length,
          successRate: Math.round((successfulTests / dbTests.length) * 100)
        }
      });
    } catch (err) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: err.message,
        collections: [],
        summary: {
          allConnected: false,
          successRate: 0
        }
      });
    }
  });

  // Route GET pour récupérer les données
  router.get("/myCompanyInfo", async (req, res) => {
    try {
      const result = await collection.find({}).toArray();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des infos société" });
    }
  });

  // Routes pour les paramètres utilisateur
  router.get("/userSettings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const settings = await userSettings.findOne({ userId });
      res.json(settings || { autoRefreshInterval: 60000 }); // Valeur par défaut
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des paramètres" });
    }
  });

  router.post("/userSettings/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { autoRefreshInterval } = req.body;
      
      // Upsert: créer ou mettre à jour les paramètres
      const result = await userSettings.updateOne(
        { userId },
        { 
          $set: { 
            userId, 
            autoRefreshInterval: autoRefreshInterval || 60000,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      res.json({ 
        success: true, 
        message: "Paramètres sauvegardés avec succès",
        autoRefreshInterval 
      });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la sauvegarde des paramètres" });
    }
  });

  // Routes pour le bloc-notes
  router.get("/notes/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notes = await collection10.findOne({ userId }) || { userId, notes: [] };
      res.json(notes);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des notes" });
    }
  });

  router.post("/notes/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { notes } = req.body;
      
      const result = await collection10.updateOne(
        { userId },
        { 
          $set: { 
            userId, 
            notes: notes || [],
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      
      res.json({ 
        success: true, 
        message: "Notes sauvegardées avec succès",
        notes 
      });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la sauvegarde des notes" });
    }
  });

  // Route POST pour ajouter des informations
  router.post("/myCompanyInfo/add", async (req, res) => {
    try {
      const existing = await collection.findOne({});
      if (existing) {
        return res.status(409).json({ error: "Une fiche entreprise existe déjà. Veuillez la modifier." });
      }
      return handlePost(collection, req, res, ["name", "description"]);
    } catch (err) {
      return res.status(500).json({ error: "Erreur lors de la vérification d'unicité." });
    }
  });

  // Route PUT pour modifier des informations
  router.put("/myCompanyInfo/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      
      // Validation de l'ID
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID invalide" });
      }
      
      // Vérification des champs requis
      const requiredFields = ["name", "description"];
      const missingFields = requiredFields.filter(field => !updatedData[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({ error: `Champs requis manquants: ${missingFields.join(", ")}` });
      }
      
      // Vérifier que l'entreprise existe
      const existingCompany = await collection.findOne({ _id: new ObjectId(id) });
      if (!existingCompany) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }
      
      // Mise à jour des données
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Aucun document trouvé avec cet ID" });
      }
      
      res.json({ 
        success: true, 
        message: "Informations modifiées avec succès",
        updatedData 
      });
      
    } catch (err) {
      res.status(500).json({ 
        error: "Erreur lors de la modification des informations", 
        details: err.message,
        stack: err.stack
      });
    }
  });

  // Route DELETE pour supprimer des informations
  router.delete("/myCompanyInfo/delete/:id", (req, res) => handleDelete(collection, req, res));

  // Route estimate pour récupérer les données //

  router.get("/estimate", (req, res) => handleGet(collection5, req, res));
  router.post("/estimate/add", async (req, res) => {
    try {

      // Le frontend envoie { client: {...} } ou { transporteur: {...} } ou { commissionnaire: {...} }
      // On doit extraire ces données correctement
      const {
        devisID,
        companyInfo,
        client,
        transporteur,
        commissionnaire,
        items,
        totalHT,
        tvaRate,
        tva,
        totalTTC,
        route,
        adresseDepart,
        adresseArrivee,
        pointsLivraison,
        status,
        message,
        ...otherFields
      } = req.body;

      // Construction de l'objet à insérer avec gestion correcte des partenaires
      const estimateData = {
        devisID: devisID || '',
        companyInfo: companyInfo || {},
        items: items || [],
        totalHT: totalHT || 0,
        tvaRate: tvaRate || 0,
        tva: tva || 0,
        totalTTC: totalTTC || 0,
        route: route || {},
        adresseDepart: adresseDepart || {},
        status: status || 'Brouillon',
        message: message || '',
        tvaManuallyModified: req.body.tvaManuallyModified || false, // Sauvegarder l'état de la TVA
        date: new Date().toISOString()
      };

      // Gestion des points de livraison (nouveau format) ou adresse d'arrivée (ancien format)
      if (pointsLivraison && pointsLivraison.length > 0) {
        estimateData.pointsLivraison = pointsLivraison;
      } else if (adresseArrivee) {
        // Migration depuis l'ancien format
        estimateData.adresseArrivee = adresseArrivee;
      }

      // Gestion des partenaires (client, transporteur, commissionnaire)
      if (client) {
        estimateData.client = client;
      }
      if (transporteur) {
        estimateData.transporteur = transporteur;
      }
      if (commissionnaire) {
        estimateData.commissionnaire = commissionnaire;
      }

      // Si aucun partenaire spécifique n'est défini, on cherche dans les autres champs
      if (!client && !transporteur && !commissionnaire) {
        // Le frontend peut avoir envoyé le partenaire dans un champ dynamique
        Object.keys(req.body).forEach(key => {
          if (key === 'client' || key === 'transporteur' || key === 'commissionnaire') {
            estimateData[key] = req.body[key];
          }
        });
      }

      const result = await collection5.insertOne(estimateData);

      // Envoyer un email de notification à l'administrateur
      try {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (emailUser && emailPass && emailUser !== 'your-email@gmail.com' && emailPass !== 'your-app-password') {
          const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass
            }
          });

          // Préparer les informations du client/transporteur/commissionnaire
          const partner = estimateData.client || estimateData.transporteur || estimateData.commissionnaire;
          const partnerType = estimateData.client ? 'Client' : estimateData.transporteur ? 'Transporteur' : 'Commissionnaire';
          const partnerName = partner?.name || partner?.nom_de_entreprise_du_comisionaire || '-';
          const partnerEmail = partner?.email || '-';
          const partnerPhone = partner?.phone || '-';

          // Préparer les détails du devis
          const itemsList = estimateData.items?.map(item => 
            `<tr><td>${item.description || '-'}</td><td>${item.quantity || 1}</td><td>${item.price || 0} €</td><td>${(item.quantity || 1) * (item.price || 0)} €</td></tr>`
          ).join('') || '<tr><td colspan="4">Aucun article</td></tr>';

          const mailOptions = {
            from: emailUser,
            to: emailUser, // L'administrateur reçoit la notification
            subject: `Nouveau devis créé - ${estimateData.devisID || 'Sans numéro'}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
                <h2 style="color: #333; text-align: center;">ATS Transport - Nouveau devis créé</h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Informations du devis</h3>
                  <p><strong>Numéro de devis :</strong> ${estimateData.devisID || '-'}</p>
                  <p><strong>Statut :</strong> <span style="color: ${estimateData.status === 'Accepté' ? 'green' : estimateData.status === 'Refusé' ? 'red' : 'orange'}">${estimateData.status || 'Brouillon'}</span></p>
                  <p><strong>Date de création :</strong> ${new Date(estimateData.date).toLocaleString('fr-FR')}</p>
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">${partnerType}</h3>
                  <p><strong>Nom :</strong> ${partnerName}</p>
                  <p><strong>Email :</strong> <a href="mailto:${partnerEmail}">${partnerEmail}</a></p>
                  <p><strong>Téléphone :</strong> <a href="tel:${partnerPhone}">${partnerPhone}</a></p>
                </div>

                ${estimateData.route ? `
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Itinéraire</h3>
                  <p><strong>Départ :</strong> ${estimateData.route.depart || '-'}</p>
                  <p><strong>Arrivée :</strong> ${estimateData.route.arrivee || '-'}</p>
                </div>
                ` : ''}

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Articles</h3>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                      <tr style="background-color: #e9ecef;">
                        <th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Description</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Quantité</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Prix unitaire</th>
                        <th style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsList}
                    </tbody>
                  </table>
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Totaux</h3>
                  <p><strong>Total HT :</strong> ${estimateData.totalHT || 0} €</p>
                  <p><strong>TVA (${estimateData.tvaRate || 0}%) :</strong> ${estimateData.tva || 0} €</p>
                  <p><strong>Total TTC :</strong> <strong style="color: #333; font-size: 18px;">${estimateData.totalTTC || 0} €</strong></p>
                </div>

                ${estimateData.message ? `
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Message</h3>
                  <p style="white-space: pre-wrap; line-height: 1.6;">${estimateData.message}</p>
                </div>
                ` : ''}

                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #999; font-size: 12px;">
                    Ce devis a été créé depuis votre interface d'administration.
                  </p>
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
        }
      } catch (emailError) {
        // On continue même si l'email échoue, le devis est quand même sauvegardé
      }

      res.status(201).json({ 
        success: true, 
        message: "Devis créé avec succès",
        id: result.insertedId 
      });

    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la création du devis" });
    }
  });
  router.put("/estimate/update/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Récupérer l'ancien devis pour comparer les changements
      const oldEstimate = await collection5.findOne({ _id: new ObjectId(id) });
      if (!oldEstimate) {
        return res.status(404).json({ error: "Devis non trouvé" });
      }

      // Mettre à jour le devis
      const result = await collection5.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      // Si le statut a changé, envoyer un email de notification
      if (updateData.status && updateData.status !== oldEstimate.status) {
        try {
          const emailUser = process.env.EMAIL_USER;
          const emailPass = process.env.EMAIL_PASS;

          if (emailUser && emailPass && emailUser !== 'your-email@gmail.com' && emailPass !== 'your-app-password') {
            const transporter = nodemailer.createTransporter({
              service: 'gmail',
              auth: {
                user: emailUser,
                pass: emailPass
              }
            });

            // Préparer les informations du client/transporteur/commissionnaire
            const partner = updateData.client || updateData.transporteur || updateData.commissionnaire || oldEstimate.client || oldEstimate.transporteur || oldEstimate.commissionnaire;
            const partnerType = (updateData.client || oldEstimate.client) ? 'Client' : (updateData.transporteur || oldEstimate.transporteur) ? 'Transporteur' : 'Commissionnaire';
            const partnerName = partner?.name || partner?.nom_de_entreprise_du_comisionaire || '-';
            const partnerEmail = partner?.email || '-';

            const statusColor = updateData.status === 'Accepté' ? 'green' : updateData.status === 'Refusé' ? 'red' : 'orange';

            const mailOptions = {
              from: emailUser,
              to: emailUser,
              subject: `Statut du devis mis à jour - ${updateData.devisID || oldEstimate.devisID || 'Sans numéro'}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333; text-align: center;">ATS Transport - Statut du devis mis à jour</h2>
                  
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Informations du devis</h3>
                    <p><strong>Numéro de devis :</strong> ${updateData.devisID || oldEstimate.devisID || '-'}</p>
                    <p><strong>Ancien statut :</strong> ${oldEstimate.status || 'Non défini'}</p>
                    <p><strong>Nouveau statut :</strong> <span style="color: ${statusColor}; font-weight: bold;">${updateData.status}</span></p>
                    <p><strong>Date de mise à jour :</strong> ${new Date().toLocaleString('fr-FR')}</p>
                  </div>

                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">${partnerType}</h3>
                    <p><strong>Nom :</strong> ${partnerName}</p>
                    <p><strong>Email :</strong> <a href="mailto:${partnerEmail}">${partnerEmail}</a></p>
                  </div>

                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Montants</h3>
                    <p><strong>Total HT :</strong> ${updateData.totalHT || oldEstimate.totalHT || 0} €</p>
                    <p><strong>Total TTC :</strong> <strong>${updateData.totalTTC || oldEstimate.totalTTC || 0} €</strong></p>
                  </div>

                  <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">
                      Le statut de ce devis a été mis à jour depuis votre interface d'administration.
                    </p>
                  </div>
                </div>
              `
            };

            await transporter.sendMail(mailOptions);
          }
        } catch (emailError) {
          // On continue même si l'email échoue, la mise à jour est quand même effectuée
        }
      }

      res.json({ 
        success: true, 
        message: "Devis mis à jour avec succès" 
      });

    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour du devis" });
    }
  });
  router.delete("/estimate/delete/:id", (req, res) => handleDelete(collection5, req, res));

  // Route invoice pour récupérer les données //

  router.get("/invoice", (req, res) => handleGet(collection6, req, res));
  
  router.post("/invoice/add", async (req, res) => {
    try {
      
      // Log spécifique pour la TVA
      if (req.body.tvaRate !== undefined) {
      }
      
      // Log pour les points de livraison
      if (req.body.pointsLivraison) {
      }
      
      // Log spécifique pour le message
      handlePost(collection6, req, res, []);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de l'ajout de la facture" });
    }
  });
  
  router.put("/invoice/update/:id", async (req, res) => {
    try {
      );
      
      // Log spécifique pour la TVA
      if (req.body.tvaRate !== undefined) {
      }
      
      // Log pour les points de livraison
      if (req.body.pointsLivraison) {
      }
      
      handlePut(collection6, req, res, []);
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de la facture" });
    }
  });
  
  router.delete("/invoice/delete/:id", (req, res) => handleDelete(collection6, req, res));

  // Route transport Order pour récupérer les données //

  router.get("/transportOrder", (req, res) => handleGet(collection3, req, res));
  
  router.post("/transportOrder/add", async (req, res) => {
    try {
      );
      
      const data = req.body;
      
      // Récupérer les informations complètes des entreprises si des IDs sont fournis
      if (data.transporteurID) {
        try {
          const transporteur = await collection2.findOne({ _id: new ObjectId(data.transporteurID) });
          if (transporteur) {
            data.transporteur = transporteur;
            }
        } catch (err) {
          }
      }
      
      if (data.commissionnaireID) {
        try {
          const commissionnaire = await collection5.findOne({ _id: new ObjectId(data.commissionnaireID) });
          if (commissionnaire) {
            data.commissionnaire = commissionnaire;
            }
        } catch (err) {
          }
      }
      
      // Récupérer les informations de la source (devis/facture) si fournie
      if (data.devisID) {
        try {
          const devis = await collection5.findOne({ _id: new ObjectId(data.devisID) });
          if (devis) {
            data.devis = devis;
            // Récupérer les informations du client depuis le devis
            if (devis.client) {
              data.client = devis.client;
              }
          }
        } catch (err) {
          }
      }
      
      if (data.factureID) {
        try {
          const facture = await collection6.findOne({ _id: new ObjectId(data.factureID) });
          if (facture) {
            data.facture = facture;
            // Récupérer les informations du client depuis la facture
            if (facture.client) {
              data.client = facture.client;
              }
          }
        } catch (err) {
          }
      }
      
      // Appeler le gestionnaire POST standard
      handlePost(collection3, req, res, ["ordreTransport", "adresseDepart"]);
      
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de l'ajout de l'ordre de transport" });
    }
  });
  
  router.put("/transportOrder/update/:id", async (req, res) => {
    try {
      );
      
      // Log spécifique pour le statut
      if (req.body.status) {
        } else {
        }
      
      const data = req.body;
      
      // Récupérer les informations complètes des entreprises si des IDs sont fournis
      if (data.transporteurID) {
        try {
          const transporteur = await collection2.findOne({ _id: new ObjectId(data.transporteurID) });
          if (transporteur) {
            data.transporteur = transporteur;
            }
        } catch (err) {
          }
      }
      
      if (data.commissionnaireID) {
        try {
          const commissionnaire = await collection5.findOne({ _id: new ObjectId(data.commissionnaireID) });
          if (commissionnaire) {
            data.commissionnaire = commissionnaire;
            }
        } catch (err) {
          }
      }
      
      // Récupérer les informations de la source (devis/facture) si fournie
      if (data.devisID) {
        try {
          const devis = await collection5.findOne({ _id: new ObjectId(data.devisID) });
          if (devis) {
            data.devis = devis;
            // Récupérer les informations du client depuis le devis
            if (devis.client) {
              data.client = devis.client;
              }
          }
        } catch (err) {
          }
      }
      
      if (data.factureID) {
        try {
          const facture = await collection6.findOne({ _id: new ObjectId(data.factureID) });
          if (facture) {
            data.facture = facture;
            // Récupérer les informations du client depuis la facture
            if (facture.client) {
              data.client = facture.client;
              }
          }
        } catch (err) {
          }
      }
      
      // Appeler le gestionnaire PUT standard sans champs requis pour permettre la mise à jour du statut
      handlePut(collection3, req, res, []);
      
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de l'ordre de transport" });
    }
  });
  
  router.delete("/transportOrder/delete/:id", (req, res) => handleDelete(collection3, req, res));

      // Route conditions de transport pour récupérer les données //

  router.get("/conditionsTransport", (req, res) => handleGet(collection4, req, res));
  router.post("/conditionsTransport/add", (req, res) => handlePost(collection4, req, res, []));
  router.put("/conditionsTransport/update/:id", (req, res) => handlePut(collection4, req, res, [])); 
  router.delete("/conditionsTransport/delete/:id", (req, res) => handleDelete(collection4, req, res));

  // Route received Message pour récupérer les données //

  router.get("/receivedMessage", (req, res) => handleGet(collection8, req, res));
  router.post("/receivedMessage/add", async (req, res) => {
    try {
      const { name, email, phone, message, date } = req.body;
      
      // Validation des champs requis
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Nom, email et message sont requis" });
      }

      // Sauvegarder le message en base
      const messageData = {
        name,
        email,
        phone: phone || '',
        message,
        date: date || new Date().toISOString()
      };

      const result = await collection8.insertOne(messageData);

      // Envoyer un email de notification à l'administrateur
      try {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS;

        if (emailUser && emailPass && emailUser !== 'your-email@gmail.com' && emailPass !== 'your-app-password') {
          const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass
            }
          });

          const mailOptions = {
            from: emailUser,
            to: emailUser, // L'administrateur reçoit la notification
            subject: `Nouveau message de contact - ${name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; text-align: center;">ATS Transport - Nouveau message de contact</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-top: 0;">Détails du message</h3>
                  <p><strong>Nom :</strong> ${name}</p>
                  <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
                  ${phone ? `<p><strong>Téléphone :</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
                  <p><strong>Date :</strong> ${new Date(date).toLocaleString('fr-FR')}</p>
                  <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 15px;">
                    <p><strong>Message :</strong></p>
                    <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
                  </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #999; font-size: 12px;">
                    Ce message a été envoyé depuis le formulaire de contact de votre site web.
                  </p>
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
        }
      } catch (emailError) {
        // On continue même si l'email échoue, le message est quand même sauvegardé
      }

      res.status(201).json({ 
        success: true, 
        message: "Message envoyé avec succès",
        id: result.insertedId 
      });

    } catch (error) {
      res.status(500).json({ error: "Erreur lors de l'envoi du message" });
    }
  });
  router.delete("/receivedMessage/delete/:id", (req, res) => handleDelete(collection8, req, res));

  // Route listeCommissionnaire pour récupérer les données //

  router.get("/listeCommissionnaire", (req, res) => handleGet(collection9, req, res));
  router.post("/listeCommissionnaire/add", (req, res) => handlePost(collection9, req, res, ["nom_de_entreprise_du_comisionaire"])); 
  router.put("/listeCommissionnaire/update/:id", (req, res) => handlePut(collection9, req, res, ["nom_de_entreprise_du_comisionaire"]));
  router.delete("/listeCommissionnaire/delete/:id", (req, res) => handleDelete(collection9, req, res));

  // Route listeClients pour récupérer les données //

  router.get("/listeClients", (req, res) => handleGet(collection10, req, res));
  router.post("/listeClients/add", (req, res) => handlePost(collection10, req, res, ["nom_de_entreprise", "representant", "registrationNumber"])); 
  router.put("/listeClients/update/:id", (req, res) => handlePut(collection10, req, res, ["nom_de_entreprise", "representant", "registrationNumber"]));
  router.delete("/listeClients/delete/:id", (req, res) => handleDelete(collection10, req, res));

  // Route de connexion utilisateur (login)
  router.post("/users/login", async (req, res) => {
    // Récupère l'email, le mot de passe et rememberMe du body
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }
    try {
      // Recherche l'utilisateur dans la collection users (collection10)
      const user = await users.findOne({ mail: email });
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé" });
      }
      if (!user.password) {
        return res.status(401).json({ error: "Mot de passe non défini pour cet utilisateur" });
      }
      // Vérifie le mot de passe hashé
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Mot de passe incorrect" });
      }
      
      // Définir la durée d'expiration du token selon "Se souvenir de moi"
      const expiresIn = rememberMe ? "30d" : "8h"; // 30 jours si coché, 8h sinon
      
      // Génère un JWT pour l'utilisateur connecté
      const token = jwt.sign(
        { userId: user._id, email: user.mail, role: user.role },
        process.env.JWT_SECRET || "dev_secret_key",
        { expiresIn: expiresIn }
      );
      res.json({ token, user: { id: user._id, name: user.name, email: user.mail, role: user.role } });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la connexion" });
    }
  });

  // Route d'ajout d'utilisateur depuis le dashboard (admin uniquement)
  router.post("/users/add", verifyToken, async (req, res) => {
    // Vérifie que l'utilisateur est admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé - Admin requis" });
    }
    const { name, mail, password, role = "user" } = req.body;
    if (!name || !mail || !password) {
      return res.status(400).json({ error: "Nom, email et mot de passe requis" });
    }
    try {
      // Vérifie l'unicité de l'email
      const existing = await users.findOne({ mail });
      if (existing) {
        return res.status(409).json({ error: "Un utilisateur avec cet email existe déjà." });
      }
      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        name,
        mail,
        password: hashedPassword,
        role
      };
      await users.insertOne(user);
      res.status(201).json({ message: "Utilisateur créé avec succès." });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de l'ajout de l'utilisateur" });
    }
  });

  // Liste des utilisateurs (accessible à tous les utilisateurs connectés)
  router.get("/users", verifyToken, async (req, res) => {
          try {
        // Retourne tous les utilisateurs (accessible à tous)
        const allUsers = await users.find({}).toArray();
        res.json(allUsers);
      } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
  });

  // Modification d'un utilisateur (admin uniquement)
  router.put("/users/update/:id", verifyToken, async (req, res) => {
    // Vérifie que l'utilisateur est admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }
    const { id } = req.params;
    const updatedData = { ...req.body };
    if (updatedData._id) delete updatedData._id;
    if (updatedData.password === "") delete updatedData.password;
    // Si le mot de passe est fourni, on le hash avant update
    if (updatedData.password) {
      const bcrypt = require("bcrypt");
      updatedData.password = await bcrypt.hash(updatedData.password, 10);
    }
    try {
      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      res.json({ message: "Utilisateur mis à jour" });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la modification de l'utilisateur" });
    }
  });

  // Suppression d'un utilisateur (admin uniquement)
  router.delete("/users/delete/:id", verifyToken, async (req, res) => {
    // Vérifie que l'utilisateur est admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }
    const { id } = req.params;
    try {
      const result = await users.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      res.json({ message: "Utilisateur supprimé" });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la suppression de l'utilisateur" });
    }
  });

  // Nouvelle route pour récupérer le numéro de téléphone de l'entreprise
  router.get("/myCompanyInfo/phone", (req, res) => getCompanyPhone(collection, req, res));

  // Route d'upload du logo avec logs détaillés
  router.post('/upload/logo', async (req, res) => {
    try {
      upload.single('logo')(req, res, function (err) {
        if (err) {
          return res.status(500).json({ error: "Erreur lors de l'upload du logo", details: err.message });
        }
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
      });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur upload', details: err.message });
    }
  });

  // Route GET pour récupérer le logo de l'entreprise
  router.get('/myCompanyInfo/logo/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      // Validation de l'ID
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID invalide" });
      }
      
      // Récupérer l'entreprise depuis la base de données
      const company = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!company) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }
      
      // Vérifier si le logo existe
      if (!company.logo || company.logo === "") {
        return res.status(404).json({ error: "Logo non trouvé" });
      }
      
      // Si le logo est une URL externe, la retourner directement
      if (company.logo.startsWith('http')) {
        return res.json({ logo: company.logo, type: 'external' });
      }
      
      // Si c'est un fichier local, construire le chemin complet
      const logoPath = path.resolve(__dirname, '../../../frontEnd/public/uploads/', path.basename(company.logo));
      
      // Vérifier si le fichier existe
      const fs = require('fs');
      if (fs.existsSync(logoPath)) {
        res.sendFile(logoPath);
      } else {
        res.status(404).json({ error: "Fichier logo non trouvé" });
      }
      
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la récupération du logo", details: err.message });
    }
  });

  // Route PATCH pour mettre à jour le logo de l'entreprise
  router.patch('/myCompanyInfo/logo/:id', async (req, res) => {
    const { id } = req.params;
    let { logo } = req.body;
    
    // Si logo est undefined ou null, on le force à "" (suppression)
    if (logo === undefined || logo === null) logo = "";
    
    try {
      // Validation de l'ID
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID invalide" });
      }
      
      // Vérifier d'abord si l'entreprise existe
      const existingCompany = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!existingCompany) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { logo } }
      );
      
      res.json({ success: true, logo });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour du logo", details: err.message });
    }
  });

  // Route d'upload du tampon
  router.post('/upload/stamp', upload.single('stamp'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
  });

  // Route PATCH pour mettre à jour le tampon de l'entreprise
  router.patch('/myCompanyInfo/stamp/:id', async (req, res) => {
    const { id } = req.params;
    let { stamp } = req.body;
    
    // Si stamp est undefined ou null, on le force à "" (suppression)
    if (stamp === undefined || stamp === null) stamp = "";
    
    try {
      // Validation de l'ID
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "ID invalide" });
      }
      
      // Vérifier d'abord si l'entreprise existe
      const existingCompany = await collection.findOne({ _id: new ObjectId(id) });
      
      if (!existingCompany) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { stamp } }
      );
      
      res.json({ success: true, stamp });
    } catch (err) {
      res.status(500).json({ error: "Erreur lors de la mise à jour du tampon", details: err.message });
    }
  });

  // ===== ROUTES DE TEST POUR LA SURVEILLANCE FRONTEND =====
  
  // Route pour simuler une erreur 404 (ressource non trouvée)
  router.get('/nonexistent', (req, res) => {
    res.status(404).json({
      error: "Ressource non trouvée",
      message: "Cette route n'existe pas",
      timestamp: new Date().toISOString(),
      path: req.path
    });
  });

  // Route pour simuler une erreur 500 (erreur serveur)
  router.get('/error-test', (req, res) => {
    res.status(500).json({
      error: "Erreur interne du serveur",
      message: "Une erreur s'est produite sur le serveur",
      timestamp: new Date().toISOString(),
      code: "INTERNAL_SERVER_ERROR"
    });
  });

  // Route pour simuler un timeout
  router.get('/timeout-test', (req, res) => {
    // Simuler un délai de 10 secondes pour tester les timeouts
    setTimeout(() => {
      res.json({
        message: "Réponse après timeout simulé",
        timestamp: new Date().toISOString()
      });
    }, 10000); // 10 secondes
  });

  // Route pour simuler une réponse JSON invalide
  router.get('/invalid-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    // Envoyer une réponse qui n'est pas du JSON valide
    res.send('Ceci n\'est pas du JSON valide { "incomplete": ');
  });

  // Route pour simuler une erreur de validation
  router.post('/validation-test', (req, res) => {
    const { email, phone, number } = req.body;
    
    const errors = [];
    
    // Validation email
    if (!email || !email.includes('@')) {
      errors.push('Email invalide');
    }
    
    // Validation téléphone
    if (!phone || phone.length < 10) {
      errors.push('Numéro de téléphone invalide');
    }
    
    // Validation nombre
    if (!number || isNaN(number)) {
      errors.push('Nombre invalide');
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Erreur de validation",
        errors: errors,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: "Données validées avec succès",
      timestamp: new Date().toISOString()
    });
  });

  // Route pour tester la réception de données complexes
  router.get('/complex-data-test', (req, res) => {
    res.json({
      success: true,
      data: {
        users: [
          { id: 1, name: "John Doe", email: "john@example.com", active: true },
          { id: 2, name: "Jane Smith", email: "jane@example.com", active: false },
          { id: 3, name: "Bob Johnson", email: "bob@example.com", active: true }
        ],
        metadata: {
          total: 3,
          page: 1,
          limit: 10,
          hasMore: false
        },
        timestamp: new Date().toISOString()
      }
    });
  });

  return router;
};
