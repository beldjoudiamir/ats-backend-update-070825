// Service CRUD générique et réutilisable
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

class CrudService {
  constructor(collection, entityName, requiredFields = [], optionalFields = []) {
    this.collection = collection;
    this.entityName = entityName;
    this.requiredFields = requiredFields;
    this.optionalFields = optionalFields;
  }

  // Validation des données
  validateData(data, isUpdate = false) {
    );
    const errors = [];
    
    // Vérification des champs requis (sauf pour les mises à jour)
    if (!isUpdate) {
      this.requiredFields.forEach(field => {
        if (!data[field]) {
          errors.push(`Le champ '${field}' est requis`);
        }
      });
    } else {
      }

    // Vérification des types de données
    if (data.email) {
      if (!this.isValidEmail(data.email)) {
        errors.push("Format d'email invalide");
      }
    }

    if (data.phone) {
      if (!this.isValidPhone(data.phone)) {
        errors.push("Format de téléphone invalide");
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validation d'email
  isValidEmail(email) {
    // Validation plus permissive pour le développement
    if (!email) return true; // Permettre les valeurs vides
    
    // Si l'email contient @, on le valide
    if (email.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      return isValid;
    } else {
      // Pour le développement, on accepte les valeurs sans @
      return true;
    }
  }

  // Validation de téléphone
  isValidPhone(phone) {
    // Validation plus permissive pour le développement
    if (!phone) return true; // Permettre les valeurs vides
    
    // Pour le développement, on accepte toutes les valeurs
    return true;
  }

  // CREATE - Créer une nouvelle entité
  async create(data) {
    try {
      // Validation des données
      const validation = this.validateData(data);
      if (!validation.isValid) {
        throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
      }

      // Préparation des données
      const entityData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Hachage du mot de passe si présent
      if (entityData.password) {
        const saltRounds = 10;
        entityData.password = await bcrypt.hash(entityData.password, saltRounds);
      }

      // Insertion dans la base de données
      const result = await this.collection.insertOne(entityData);
      
      // Récupération de l'entité créée
      const createdEntity = await this.collection.findOne({ _id: result.insertedId });
      
      return {
        success: true,
        data: createdEntity,
        message: `${this.entityName} créé avec succès`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Erreur lors de la création de ${this.entityName}`
      };
    }
  }

  // READ - Lire toutes les entités avec pagination et filtres
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { createdAt: -1 },
        filter = {},
        search = null,
        searchFields = []
      } = options;

      // Construction du filtre
      let query = { ...filter };

      // Recherche textuelle si spécifiée
      if (search && searchFields.length > 0) {
        const searchQuery = searchFields.map(field => ({
          [field]: { $regex: search, $options: 'i' }
        }));
        query.$or = searchQuery;
      }

      // Calcul de la pagination
      const skip = (page - 1) * limit;

      // Exécution de la requête
      const [data, total] = await Promise.all([
        this.collection.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.collection.countDocuments(query)
      ]);

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Erreur lors de la lecture de ${this.entityName}`
      };
    }
  }

  // READ - Lire une entité par ID
  async findById(id) {
    try {
      if (!ObjectId.isValid(id)) {
        return {
          success: false,
          error: "ID invalide",
          message: "Format d'ID invalide"
        };
      }

      const entity = await this.collection.findOne({ _id: new ObjectId(id) });
      
      if (!entity) {
        return {
          success: false,
          error: "Entité non trouvée",
          message: `${this.entityName} non trouvé`
        };
      }

      return {
        success: true,
        data: entity,
        message: `${this.entityName} trouvé`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Erreur lors de la lecture de ${this.entityName}`
      };
    }
  }

  // UPDATE - Mettre à jour une entité
  async update(id, data) {
    try {
      );
      
      if (!ObjectId.isValid(id)) {
        return {
          success: false,
          error: "ID invalide",
          message: "Format d'ID invalide"
        };
      }

      // Validation des données (plus souple pour les mises à jour)
      const validation = this.validateData(data, true);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
          message: "Données invalides"
        };
      }

      // Préparation des données de mise à jour
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      );

      // Suppression de l'ID des données de mise à jour
      delete updateData._id;

      // Hachage du mot de passe si présent
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      }`);
      );

      // Mise à jour dans la base de données
      const result = await this.collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: "Entité non trouvée",
          message: `${this.entityName} non trouvé`
        };
      }

      // Récupération de l'entité mise à jour
      const updatedEntity = await this.collection.findOne({ _id: new ObjectId(id) });
      );

      return {
        success: true,
        data: updatedEntity,
        message: `${this.entityName} mis à jour avec succès`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Erreur lors de la mise à jour de ${this.entityName}`
      };
    }
  }

  // DELETE - Supprimer une entité
  async delete(id) {
    try {
      if (!ObjectId.isValid(id)) {
        return {
          success: false,
          error: "ID invalide",
          message: "Format d'ID invalide"
        };
      }

      const result = await this.collection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return {
          success: false,
          error: "Entité non trouvée",
          message: `${this.entityName} non trouvé`
        };
      }

      return {
        success: true,
        message: `${this.entityName} supprimé avec succès`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Erreur lors de la suppression de ${this.entityName}`
      };
    }
  }

  // BULK OPERATIONS - Opérations en lot
  async bulkCreate(entities) {
    try {
      const preparedEntities = entities.map(entity => ({
        ...entity,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const result = await this.collection.insertMany(preparedEntities);
      
      return {
        success: true,
        data: result,
        message: `${result.insertedCount} ${this.entityName}(s) créé(s) avec succès`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Erreur lors de la création en lot de ${this.entityName}`
      };
    }
  }

  // STATISTIQUES - Obtenir des statistiques
  async getStats() {
    try {
      const [total, recent] = await Promise.all([
        this.collection.countDocuments(),
        this.collection.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        success: true,
        data: {
          total,
          recent24h: recent,
          entityName: this.entityName
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CrudService; 