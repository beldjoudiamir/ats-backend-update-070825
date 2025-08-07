// Contrôleur spécialisé pour les commissionnaires
const CrudController = require('../utils/crudController');

class CommissionnaireController extends CrudController {
  constructor(collection) {
    // Champs requis pour un commissionnaire
    const requiredFields = [
      'nom',
      'prenom',
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
      'specialites',
      'langues',
      'certifications'
    ];

    super(collection, 'Commissionnaire', requiredFields, optionalFields);
  }

  // Surcharge de la méthode getSearchFields pour les commissionnaires
  getSearchFields() {
    return ['nom', 'prenom', 'email', 'telephone', 'ville', 'pays', 'siret'];
  }

  // Validation personnalisée pour les commissionnaires
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

  // Méthode spécialisée pour rechercher par spécialité
  async findBySpecialite(req, res) {
    try {
      const { specialite } = req.params;
      
      const result = await this.crudService.findAll({
        filter: { specialites: { $in: [specialite] } }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Commissionnaires trouvés pour la spécialité: ${specialite}`
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
        message: "Erreur lors de la recherche par spécialité"
      });
    }
  }

  // Méthode spécialisée pour rechercher par pays
  async findByPays(req, res) {
    try {
      const { pays } = req.params;
      
      const result = await this.crudService.findAll({
        filter: { pays: { $regex: pays, $options: 'i' } }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Commissionnaires trouvés pour le pays: ${pays}`
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
        message: "Erreur lors de la recherche par pays"
      });
    }
  }

  // Méthode pour obtenir les statistiques par pays
  async getStatsByPays(req, res) {
    try {
      const stats = await this.collection.aggregate([
        {
          $group: {
            _id: '$pays',
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
        message: "Statistiques par pays récupérées"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des statistiques par pays"
      });
    }
  }

  // Méthode pour obtenir les spécialités disponibles
  async getSpecialites(req, res) {
    try {
      const specialites = await this.collection.distinct('specialites');
      
      res.json({
        success: true,
        data: specialites.filter(s => s), // Filtrer les valeurs null/undefined
        message: "Spécialités récupérées"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des spécialités"
      });
    }
  }
}

module.exports = CommissionnaireController; 