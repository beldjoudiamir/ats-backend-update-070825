// Routeur CRUD générique et réutilisable
const express = require('express');
const CrudController = require('./crudController');

class CrudRouter {
  constructor(collection, entityName, requiredFields = [], optionalFields = []) {
    this.router = express.Router();
    this.controller = new CrudController(collection, entityName, requiredFields, optionalFields);
    this.entityName = entityName;
    
    this.setupRoutes();
  }

  // Configuration automatique des routes CRUD
  setupRoutes() {
    const basePath = `/${this.entityName.toLowerCase()}`;
    
    // Routes CRUD de base
    this.router.post(`${basePath}`, this.controller.create.bind(this.controller));
    this.router.get(`${basePath}`, this.controller.findAll.bind(this.controller));
    this.router.get(`${basePath}/:id`, this.controller.findById.bind(this.controller));
    this.router.put(`${basePath}/:id`, this.controller.update.bind(this.controller));
    this.router.delete(`${basePath}/:id`, this.controller.delete.bind(this.controller));
    
    // Routes supplémentaires
    this.router.post(`${basePath}/bulk`, this.controller.bulkCreate.bind(this.controller));
    this.router.get(`${basePath}/stats`, this.controller.getStats.bind(this.controller));
    
    // Route de santé spécifique à l'entité
    this.router.get(`${basePath}/health`, this.healthCheck.bind(this));
  }

  // Vérification de santé spécifique à l'entité
  async healthCheck(req, res) {
    try {
      const stats = await this.controller.crudService.getStats();
      
      res.json({
        status: "healthy",
        entity: this.entityName,
        timestamp: new Date().toISOString(),
        stats: stats.success ? stats.data : null,
        message: `${this.entityName} service is running`
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        entity: this.entityName,
        timestamp: new Date().toISOString(),
        error: error.message,
        message: `${this.entityName} service is not responding`
      });
    }
  }

  // Méthode pour ajouter des routes personnalisées
  addCustomRoute(method, path, handler) {
    this.router[method](path, handler);
  }

  // Méthode pour ajouter des middleware spécifiques
  addMiddleware(middleware) {
    this.router.use(middleware);
  }

  // Méthode pour obtenir le routeur Express
  getRouter() {
    return this.router;
  }

  // Méthode pour obtenir les informations du routeur
  getInfo() {
    return {
      entityName: this.entityName,
      basePath: `/${this.entityName.toLowerCase()}`,
      routes: [
        `POST ${this.basePath}`,
        `GET ${this.basePath}`,
        `GET ${this.basePath}/:id`,
        `PUT ${this.basePath}/:id`,
        `DELETE ${this.basePath}/:id`,
        `POST ${this.basePath}/bulk`,
        `GET ${this.basePath}/stats`,
        `GET ${this.basePath}/health`
      ]
    };
  }
}

module.exports = CrudRouter; 