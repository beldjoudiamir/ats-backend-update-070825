// Fichier config/bd.js
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DATABASE = "atsInfo";
const COLLECTION = {
  collection: "information",
  collection2: "companyClient", // Transporteurs
  collection3: "transportOrder",
  collection4: "conditionsTransport",
  collection5: "estimate",
  collection6: "invoice",
  collection7: "transportQuoteRequest",
  collection8: "receivedMessage",
  collection9: "listeCommissionnaire",
  collection10: "listeClients", // Nouvelle collection pour les clients
  users: "users",
  userSettings: "userSettings",
};

// Configuration optimisée du client MongoDB avec pooling
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Configuration du pool de connexions
  maxPoolSize: 10, // Nombre maximum de connexions dans le pool
  minPoolSize: 2,  // Nombre minimum de connexions dans le pool
  maxIdleTimeMS: 30000, // Temps maximum d'inactivité (30 secondes)
  connectTimeoutMS: 10000, // Timeout de connexion (10 secondes)
  socketTimeoutMS: 45000, // Timeout des opérations socket (45 secondes)
  // Options de retry
  retryWrites: true,
  retryReads: true,
  // Options de compression
  compressors: ['zlib'],
  zlibCompressionLevel: 6,
});

// Variable pour stocker les collections
let collections = null;
let isConnected = false;

// Fonction pour vérifier la connexion
const checkConnection = async () => {
  try {
    await client.db(DATABASE).admin().ping();
    return true;
  } catch (error) {
    return false;
  }
};

// Fonction pour reconnecter automatiquement
const reconnect = async () => {
  try {
    if (client.topology && client.topology.isConnected()) {
      return true;
    }
    
    await client.connect();
    isConnected = true;
    return true;
  } catch (error) {
    isConnected = false;
    return false;
  }
};

async function connectToDatabase() {
  try {
    // Vérifier si déjà connecté
    if (isConnected && collections) {
      const isAlive = await checkConnection();
      if (isAlive) {
        return collections;
      }
    }

    // Se connecter à MongoDB
    await client.connect();
    isConnected = true;
    const db = client.db(DATABASE);

    // Créer les collections avec des options optimisées
    collections = {
      collection: db.collection(COLLECTION.collection),
      collection2: db.collection(COLLECTION.collection2), // Transporteurs
      collection3: db.collection(COLLECTION.collection3),
      collection4: db.collection(COLLECTION.collection4),
      collection5: db.collection(COLLECTION.collection5),
      collection6: db.collection(COLLECTION.collection6),
      collection7: db.collection(COLLECTION.collection7),
      collection8: db.collection(COLLECTION.collection8),
      collection9: db.collection(COLLECTION.collection9),
      collection10: db.collection(COLLECTION.collection10), // Clients
      users: db.collection(COLLECTION.users),
      userSettings: db.collection(COLLECTION.userSettings),
    };

    // Créer des index pour améliorer les performances
    await createIndexes(db);

    // Gestionnaire d'événements pour la déconnexion
    client.on('close', () => {
      isConnected = false;
    });

    client.on('reconnect', () => {
      });

    return collections;
  } catch (err) {
    isConnected = false;
    
    // Retourner des collections factices pour permettre le développement
    const mockCollections = {
      collection: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection2: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection3: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection4: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection5: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection6: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection7: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection8: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection9: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      collection10: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      users: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      },
      userSettings: {
        find: () => ({ toArray: () => Promise.resolve([]) }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
        updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
        deleteOne: () => Promise.resolve({ deletedCount: 0 })
      }
    };
    
    collections = mockCollections;
    return collections;
  }
}

// Fonction pour créer les index de performance
async function createIndexes(db) {
  try {
    // Index pour les utilisateurs (email unique)
    await db.collection(COLLECTION.users).createIndex({ mail: 1 }, { unique: true });
    
    // Index pour les devis (date de création)
    await db.collection(COLLECTION.collection5).createIndex({ createdAt: -1 });
    
    // Index pour les factures (date de création)
    await db.collection(COLLECTION.collection6).createIndex({ createdAt: -1 });
    
    // Index pour les ordres de transport (date de création)
    await db.collection(COLLECTION.collection3).createIndex({ createdAt: -1 });
    
    // Index pour les messages (date de réception)
    await db.collection(COLLECTION.collection8).createIndex({ receivedAt: -1 });
    
    // Index pour les clients (nom)
    await db.collection(COLLECTION.collection10).createIndex({ name: 1 });
    
    // Index pour les transporteurs (nom)
    await db.collection(COLLECTION.collection2).createIndex({ name: 1 });
    
    // Index pour les commissionnaires (nom)
    await db.collection(COLLECTION.collection9).createIndex({ name: 1 });
    
    } catch (error) {
    }
}

// Fonction pour fermer proprement la connexion
async function closeConnection() {
  try {
    if (client && isConnected) {
      await client.close();
      isConnected = false;
      collections = null;
      }
  } catch (error) {
    }
}

// Gestionnaire pour les signaux de terminaison
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

// Fonction pour obtenir les statistiques de connexion
function getConnectionStats() {
  if (!client || !client.topology) {
    return { connected: false, poolSize: 0 };
  }
  
  return {
    connected: isConnected,
    poolSize: client.topology.s.options.maxPoolSize,
    activeConnections: client.topology.s.pool?.totalConnectionCount || 0,
    availableConnections: client.topology.s.pool?.availableConnectionCount || 0
  };
}

module.exports = connectToDatabase;
module.exports.closeConnection = closeConnection;
module.exports.reconnect = reconnect;
module.exports.getConnectionStats = getConnectionStats;
module.exports.checkConnection = checkConnection;
