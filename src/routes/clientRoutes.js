const express = require("express");
const router = express.Router();
const ClientController = require("../controllers/clientController");

module.exports = (clientsCollection) => {
  // Créer une instance du contrôleur
  const clientController = new ClientController(clientsCollection);
  
  // Routes CRUD de base
  router.get("/", (req, res) => clientController.findAll(req, res));
  router.post("/add", (req, res) => clientController.create(req, res));
  router.put("/update/:id", (req, res) => clientController.update(req, res));
  router.delete("/delete/:id", (req, res) => clientController.delete(req, res));
  
  // Routes spécialisées pour les clients
  router.get("/secteur/:secteur", (req, res) => clientController.findBySecteurActivite(req, res));
  router.get("/taille/:taille", (req, res) => clientController.findByTailleEntreprise(req, res));
  router.get("/statut/:statut", (req, res) => clientController.findByStatut(req, res));
  router.get("/vip", (req, res) => clientController.getClientsVIP(req, res));
  router.get("/stats/secteur", (req, res) => clientController.getStatsBySecteur(req, res));
  router.get("/stats/taille", (req, res) => clientController.getStatsByTaille(req, res));
  router.get("/secteurs", (req, res) => clientController.getSecteursActivite(req, res));
  router.patch("/:id/statut", (req, res) => clientController.updateStatut(req, res));
  
  return router;
}; 