const express = require("express");
const router = express.Router();
const clientListController = require("../controllers/clientListController");

module.exports = (clientsCollection) => {
  router.get("/", (req, res) => clientListController.getAllClients(clientsCollection, req, res));
  router.post("/add", (req, res) => clientListController.addClient(clientsCollection, req, res));
  router.put("/update/:id", (req, res) => clientListController.updateClient(clientsCollection, req, res));
  router.delete("/delete/:id", (req, res) => clientListController.deleteClient(clientsCollection, req, res));
  return router;
}; 