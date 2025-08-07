// Contrôleur pour la gestion des clients (différent des transporteurs)
exports.getAllClients = async (clientsCollection, req, res) => {
  try {
    const clients = await clientsCollection.find().toArray();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des clients" });
  }
};

exports.addClient = async (clientsCollection, req, res) => {
  const { nom_de_entreprise, representant, registrationNumber } = req.body;
  if (!nom_de_entreprise || !representant || !registrationNumber) {
    return res.status(400).json({ error: "Champs nom_de_entreprise, representant et registrationNumber requis" });
  }
  try {
    await clientsCollection.insertOne(req.body);
    res.status(201).json({ message: "Client ajouté avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'ajout du client" });
  }
};

exports.updateClient = async (clientsCollection, req, res) => {
  const { id } = req.params;
  let updatedData = { ...req.body };
  // Ne jamais modifier _id
  if (updatedData._id) delete updatedData._id;

  // Champs obligatoires pour les clients
  if (!updatedData.nom_de_entreprise || !updatedData.representant || !updatedData.registrationNumber) {
    return res.status(400).json({ error: "Champs nom_de_entreprise, representant et registrationNumber obligatoires" });
  }

  if (!updatedData || Object.keys(updatedData).length === 0) {
    return res.status(400).json({ error: "Aucune donnée à mettre à jour" });
  }

  try {
    const { ObjectId } = require("mongodb");
    );
    const result = await clientsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json({ message: "Client mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour du client", details: err.message, stack: err.stack });
  }
};

exports.deleteClient = async (clientsCollection, req, res) => {
  const { id } = req.params;
  const { ObjectId } = require("mongodb");
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Format d'identifiant invalide" });
  }
  try {
    const result = await clientsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    res.json({ message: "Client supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression du client" });
  }
}; 