const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

// Gestionnaire pour GET
exports.handleGet = async (collection, req, res) => {
  try {
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (err) {
    res.status(500).send("Error fetching data from the database.");
  }
};

// Gestionnaire pour POST
exports.handlePost = async (collection, req, res, requiredFields) => {
  try {
    const data = req.body;
    // Log spécifique pour les messages de facture
    if (data.message !== undefined) {
      }
    
    // Log spécifique pour les ordres de transport
    if (data.ordreTransport) {
      }

    // Vérification des champs requis
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return res.status(400).send(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Hachage du mot de passe si présent
    if (data.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(data.password, saltRounds);
    }

    const result = await collection.insertOne(data);
    // Récupérer l'objet complet créé
    const createdOrder = await collection.findOne({ _id: result.insertedId });
    res.status(201).json(createdOrder);
  } catch (err) {
    res.status(500).send("Error inserting data into the database.");
  }
};

// Gestionnaire pour PUT
exports.handlePut = async (collection, req, res, requiredFields) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;

    const missingFields = requiredFields.filter((field) => !updatedData[field]);
    if (missingFields.length > 0) {
      return res.status(400).send(`Missing required fields: ${missingFields.join(", ")}`);
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).send("Invalid ID format.");
    }

    if (!updatedData || Object.keys(updatedData).length === 0) {
      return res.status(400).send("No data provided to update.");
    }

    // Supprimer le champ _id des données de mise à jour car il est immuable
    const { _id, ...dataToUpdate } = updatedData;

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: dataToUpdate }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send("No document found with the given ID.");
    }

    res.json({ message: "Data updated successfully." });
  } catch (err) {
    res.status(500).send("Error updating data in the database.");
  }
};

// Gestionnaire pour DELETE
exports.handleDelete = async (collection, req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send("Invalid ID format.");
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).send("No document found with the given ID.");
    }

    res.json({ message: "Data deleted successfully." });
  } catch (err) {
    res.status(500).send("Error deleting data from the database.");
  }
};
