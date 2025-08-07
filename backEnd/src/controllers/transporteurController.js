// Contrôleur spécialisé pour les transporteurs
const CrudController = require('../utils/crudController');

class TransporteurController extends CrudController {
  constructor(collection) {
    // Champs requis pour un transporteur (plus permissif en développement)
    const requiredFields = [
      'nom_de_entreprise'
      // 'representant' et 'registrationNumber' rendus optionnels pour le développement
    ];

    // Champs optionnels
    const optionalFields = [
      'representant',
      'registrationNumber',
      'street',
      'city',
      'zipCode',
      'country',
      'email',
      'phone',
      'taxID',
      'typesTransport',
      'zonesGeographiques',
      'capaciteTransport',
      'certifications',
      'contactPrincipal',
      'horairesDisponibilite'
    ];

    super(collection, 'Transporteur', requiredFields, optionalFields);
    
    }

  // Surcharge de la méthode getSearchFields pour les transporteurs
  getSearchFields() {
    return ['nom_de_entreprise', 'representant', 'email', 'phone', 'city', 'country', 'registrationNumber', 'typesTransport'];
  }

  // Validation personnalisée pour les transporteurs
  customValidation(data) {
    );
    
    const errors = [];

    // Validation du numéro d'enregistrement (SIRET)
    if (data.registrationNumber && !this.isValidSiret(data.registrationNumber)) {
      errors.push("Format SIRET invalide");
    } else if (data.registrationNumber) {
      }

    // Validation du numéro de TVA (format européen)
    if (data.taxID && !this.isValidTva(data.taxID)) {
      errors.push("Format numéro de TVA invalide");
    } else if (data.taxID) {
      }

    // Validation du code postal
    if (data.zipCode && !this.isValidCodePostal(data.zipCode)) {
      errors.push("Format code postal invalide");
    } else if (data.zipCode) {
      }

    // Validation de la capacité de transport
    if (data.capaciteTransport && !this.isValidCapacite(data.capaciteTransport)) {
      errors.push("Capacité de transport invalide");
    } else if (data.capaciteTransport) {
      }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validation SIRET
  isValidSiret(siret) {
    // Validation plus permissive pour le développement
    if (!siret) {
      return true; // Permettre les valeurs vides
    }
    const siretRegex = /^[0-9]{14}$/;
    const isValid = siretRegex.test(siret);
    return isValid;
  }

  // Validation TVA
  isValidTva(tva) {
    if (!tva) {
      return true;
    }
    const tvaRegex = /^[A-Z]{2}[0-9A-Z]+$/;
    const isValid = tvaRegex.test(tva);
    return isValid;
  }

  // Validation code postal
  isValidCodePostal(codePostal) {
    if (!codePostal) {
      return true;
    }
    const cpRegex = /^[0-9]{5}$/;
    const isValid = cpRegex.test(codePostal);
    return isValid;
  }

  // Validation capacité de transport
  isValidCapacite(capacite) {
    return typeof capacite === 'number' && capacite > 0;
  }

  // Méthode spécialisée pour rechercher par type de transport
  async findByTypeTransport(req, res) {
    try {
      const { typeTransport } = req.params;
      
      const result = await this.crudService.findAll({
        filter: { typesTransport: { $in: [typeTransport] } }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Transporteurs trouvés pour le type: ${typeTransport}`
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
        message: "Erreur lors de la recherche par type de transport"
      });
    }
  }

  // Méthode spécialisée pour rechercher par zone géographique
  async findByZoneGeographique(req, res) {
    try {
      const { zone } = req.params;
      
      const result = await this.crudService.findAll({
        filter: { zonesGeographiques: { $in: [zone] } }
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Transporteurs trouvés pour la zone: ${zone}`
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
        message: "Erreur lors de la recherche par zone géographique"
      });
    }
  }

  // Méthode pour rechercher par capacité de transport
  async findByCapacite(req, res) {
    try {
      const { capaciteMin, capaciteMax } = req.query;
      
      let filter = {};
      if (capaciteMin && capaciteMax) {
        filter.capaciteTransport = { 
          $gte: parseInt(capaciteMin), 
          $lte: parseInt(capaciteMax) 
        };
      } else if (capaciteMin) {
        filter.capaciteTransport = { $gte: parseInt(capaciteMin) };
      } else if (capaciteMax) {
        filter.capaciteTransport = { $lte: parseInt(capaciteMax) };
      }

      const result = await this.crudService.findAll({ filter });

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: "Transporteurs trouvés par capacité"
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
        message: "Erreur lors de la recherche par capacité"
      });
    }
  }

  // Méthode pour obtenir les statistiques par type de transport
  async getStatsByTypeTransport(req, res) {
    try {
      const stats = await this.collection.aggregate([
        {
          $unwind: '$typesTransport'
        },
        {
          $group: {
            _id: '$typesTransport',
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
        message: "Statistiques par type de transport récupérées"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des statistiques par type de transport"
      });
    }
  }

  // Méthode pour obtenir les types de transport disponibles
  async getTypesTransport(req, res) {
    try {
      const typesTransport = await this.collection.distinct('typesTransport');
      
      res.json({
        success: true,
        data: typesTransport.filter(t => t), // Filtrer les valeurs null/undefined
        message: "Types de transport récupérés"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des types de transport"
      });
    }
  }

  // Méthode pour obtenir les zones géographiques disponibles
  async getZonesGeographiques(req, res) {
    try {
      const zones = await this.collection.distinct('zonesGeographiques');
      
      res.json({
        success: true,
        data: zones.filter(z => z), // Filtrer les valeurs null/undefined
        message: "Zones géographiques récupérées"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Erreur interne du serveur",
        message: "Erreur lors de la récupération des zones géographiques"
      });
    }
  }
}

module.exports = TransporteurController; 