const express = require("express");
const router = express.Router();
const TransporteurController = require("../controllers/transporteurController");

module.exports = (transporteursCollection) => {
  // Créer une instance du contrôleur
  const transporteurController = new TransporteurController(transporteursCollection);
  
  // Routes CRUD de base
  router.get("/", (req, res) => {
    transporteurController.findAll(req, res);
  });
  router.post("/add", (req, res) => {
    transporteurController.create(req, res);
  });
  router.put("/update/:id", (req, res) => {
    );
    transporteurController.update(req, res);
  });
  router.delete("/delete/:id", (req, res) => {
    transporteurController.delete(req, res);
  });
  
  // Routes spécialisées pour les transporteurs
  router.get("/type/:typeTransport", (req, res) => transporteurController.findByTypeTransport(req, res));
  router.get("/zone/:zone", (req, res) => transporteurController.findByZoneGeographique(req, res));
  router.get("/capacite", (req, res) => transporteurController.findByCapacite(req, res));
  router.get("/stats/type", (req, res) => transporteurController.getStatsByTypeTransport(req, res));
  router.get("/types", (req, res) => transporteurController.getTypesTransport(req, res));
  router.get("/zones", (req, res) => transporteurController.getZonesGeographiques(req, res));
  
  return router;
}; 