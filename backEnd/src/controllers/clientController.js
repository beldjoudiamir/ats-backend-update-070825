// Contrôleur spécialisé pour les clients
const CrudController = require('../utils/crudController');

class ClientController extends CrudController {
  constructor(collection) {
    // Champs requis pour un client
    const requiredFields = [
      'nom',
      'email',
      'telephone',
      'adresse',
      'ville',
      'codePostal',
      'pays'
    ];

    // Champs optionnels
    const optionalFields = [
      'siret',
      'tva',
      'siteWeb',
      'notes',
      'secteurActivite',
      'tailleEntreprise',
      'contactPrincipal',
      'historiqueCommandes',
      'preferences',
      'statutClient'
    ];

    super(collection, 'Client', requiredFields, optionalFields);
  }

  // Surcharge de la méthode getSearchFields pour les clients
  getSearchFields() {
    return ['nom', 'email', 'telephone', 'ville', 'pays', 'siret', 'secteurActivite'];
  }

  // Validation personnalisée pour les clients
  customValidation(data) {
    const errors = [];

    // Validation du SIRET (format français)
    if (data.siret && !this.isValidSiret(data.siret)) {
      errors.push("Format SIRET invalide");
    }

    // Validation du numéro de TVA (format européen)
    if (data.tva && !this.isValidTva(data.tva)) {
      errors.push("Format numéro de TVA invalide");
    }

    // Validation du code postal
    if (data.codePostal && !this.isValidCodePostal(data.codePostal)) {
      errors.push("Format code postal invalide");
    }

    // Validation de la taille d'entreprise
    if (data.tailleEntreprise && !this.isValidTailleEntreprise(data.tailleEntreprise)) {
      errors.push("Taille d'entreprise invalide");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validation SIRET
  isValidSiret(siret) {
    const siretRegex = /^[0-9]{14}$/;
    return siretRegex.test(siret);
  }

  // Validation TVA
  isValidTva(tva) {
    const tvaRegex = /^[A-Z]{2}[0-9A-Z]+$/;
    return tvaRegex.test(tva);
  }

  // Validation code postal
  isValidCodePostal(codePostal) {
    const cpRegex = /^[0-9]{5}$/;
    return cpRegex.test(codePostal);
  }

  // Validation taille d'entreprise
  isValidTailleEntreprise(taille) {
    const taillesValides = ['TPE', 'PME', 'ETI', 'GE'];
    return taillesValides.includes(taille);
  }

  // Méthode spécialisée pour rechercher par secteur d'activité
  async findBySecteurActivite(req, res) {
    try {
      const { secteur } = req.params;
      
      const result = await this.crudService.findAll({
        filter: { secteurActivite: { $regex: secteur, $options: 'i' } }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Clients trouvés pour le secteur: ${secteur}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la recherche par secteur d'activité"
      });
    }
  }

  // Méthode spécialisée pour rechercher par taille d'entreprise
  async findByTailleEntreprise(req, res) {
    try {
      const { taille } = req.params;
      
      const result = await this.crudService.findAll({
        filter: { tailleEntreprise: taille }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Clients trouvés pour la taille: ${taille}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la recherche par taille d'entreprise"
      });
    }
  }

  // Méthode pour rechercher par statut client
  async findByStatut(req, res) {
    try {
      const { statut } = req.params;
      
      const result = await this.crudService.findAll({
        filter: { statutClient: statut }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Clients trouvés pour le statut: ${statut}`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la recherche par statut"
      });
    }
  }

  // Méthode pour obtenir les clients VIP (avec historique de commandes élevé)
  async getClientsVIP(req, res) {
    try {
      const { seuil = 10 } = req.query;
      
      const result = await this.crudService.findAll({
        filter: { 
          'historiqueCommandes.nombre': { $gte: parseInt(seuil) }
        },
        sort: { 'historiqueCommandes.nombre': -1 }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Clients VIP trouvés (seuil: ${seuil} commandes)`
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la recherche des clients VIP"
      });
    }
  }

  // Méthode pour obtenir les statistiques par secteur d'activité
  async getStatsBySecteur(req, res) {
    try {
      const stats = await this.collection.aggregate([
        {
          $group: {
            _id: '$secteurActivite',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]).toArray();

      res.json({
        success: true,
        data: stats,
        message: "Statistiques par secteur d'activité récupérées"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des statistiques par secteur"
      });
    }
  }

  // Méthode pour obtenir les statistiques par taille d'entreprise
  async getStatsByTaille(req, res) {
    try {
      const stats = await this.collection.aggregate([
        {
          $group: {
            _id: '$tailleEntreprise',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]).toArray();

      res.json({
        success: true,
        data: stats,
        message: "Statistiques par taille d'entreprise récupérées"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des statistiques par taille"
      });
    }
  }

  // Méthode pour obtenir les secteurs d'activité disponibles
  async getSecteursActivite(req, res) {
    try {
      const secteurs = await this.collection.distinct('secteurActivite');
      
      res.json({
        success: true,
        data: secteurs.filter(s => s), // Filtrer les valeurs null/undefined
        message: "Secteurs d'activité récupérés"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des secteurs d'activité"
      });
    }
  }

  // Méthode pour mettre à jour le statut d'un client
  async updateStatut(req, res) {
    try {
      const { id } = req.params;
      const { statutClient } = req.body;

      if (!statutClient) {
        return res.status(400).json({
          success: false,
          error: "Statut manquant",
          message: "Le statut client est requis"
        });
      }

      const result = await this.crudService.update(id, { statutClient });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Statut du client mis à jour: ${statutClient}`
        });
    } else {
        const statusCode = result.error === "Entité non trouvée" ? 404 : 400;
        res.status(statusCode).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la mise à jour du statut"
      });
    }
  }
}

module.exports = ClientController; 