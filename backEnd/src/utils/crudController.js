// Contrôleur CRUD générique et réutilisable
const CrudService = require('./crudService');

class CrudController {
  constructor(collection, entityName, requiredFields = [], optionalFields = []) {
    this.crudService = new CrudService(collection, entityName, requiredFields, optionalFields);
    this.entityName = entityName;
  }

  // CREATE - Créer une nouvelle entité
  async create(req, res) {
    try {
      const result = await this.crudService.create(req.body);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
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
        message: `Erreur lors de la création de ${this.entityName}`
      });
    }
  }

  // READ - Lire toutes les entités avec pagination et filtres
  async findAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search = null,
        ...filters
      } = req.query;

      // Construction des options
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { [sort]: order === 'desc' ? -1 : 1 },
        filter: filters,
        search: search || null,
        searchFields: this.getSearchFields()
      };

      const result = await this.crudService.findAll(options);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          pagination: result.pagination,
          message: `${this.entityName}s récupérés avec succès`
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
        message: `Erreur lors de la récupération de ${this.entityName}s`
      });
    }
  }

  // READ - Lire une entité par ID
  async findById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.crudService.findById(id);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message
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
        message: `Erreur lors de la récupération de ${this.entityName}`
      });
    }
  }

  // UPDATE - Mettre à jour une entité
  async update(req, res) {
    try {
      const { id } = req.params;
      
      );
      const result = await this.crudService.update(id, req.body);
      
      );
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: result.message
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
        message: `Erreur lors de la mise à jour de ${this.entityName}`
      });
    }
  }

  // DELETE - Supprimer une entité
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await this.crudService.delete(id);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
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
        message: `Erreur lors de la suppression de ${this.entityName}`
      });
    }
  }

  // BULK CREATE - Créer plusieurs entités en lot
  async bulkCreate(req, res) {
    try {
      const { entities } = req.body;
      
      if (!Array.isArray(entities) || entities.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Données invalides",
          message: "Le champ 'entities' doit être un tableau non vide"
        });
      }

      const result = await this.crudService.bulkCreate(entities);
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: result.message
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
        message: `Erreur lors de la création en lot de ${this.entityName}s`
      });
    }
  }

  // STATS - Obtenir des statistiques
  async getStats(req, res) {
    try {
      const result = await this.crudService.getStats();
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: `Statistiques de ${this.entityName} récupérées`
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
        message: `Erreur lors de la récupération des statistiques de ${this.entityName}`
      });
    }
  }

  // Méthode pour définir les champs de recherche (à surcharger si nécessaire)
  getSearchFields() {
    return ['name', 'email', 'phone']; // Champs par défaut pour la recherche
  }

  // Méthode pour personnaliser la validation (à surcharger si nécessaire)
  customValidation(data) {
    return { isValid: true, errors: [] };
  }
}

module.exports = CrudController; 