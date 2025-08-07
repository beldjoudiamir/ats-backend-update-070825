require('dotenv').config();
const express = require("express");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectToDatabase = require("./config/bd.js");
const applyMiddlewares = require("./utils/middleware.js");
const createRoutes = require("./routes/apiRoutes.js");
const clientRoutes = require("./routes/clientRoutes.js");
const clientListRoutes = require("./routes/clientListRoutes.js");
const transporteurRoutes = require("./routes/transporteurRoutes.js");

const PORT = process.env.PORT || 5000;

const app = express();

// Configuration de la compression pour réduire la taille des réponses
app.use(compression({
  level: 6, // Niveau de compression optimal
  threshold: 1024, // Compresser seulement si > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Configuration de la sécurité avec Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://ats030825.onrender.com", "http://localhost:3000", "http://localhost:5173", "http://localhost:5187", "http://localhost:5188"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting pour prévenir les attaques (désactivé en développement)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Très généreux en développement
  message: {
    error: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware CORS global pour les images
app.use((req, res, next) => {
  // Appliquer CORS pour les requêtes d'images
  if (req.path.startsWith('/uploads/') || req.path.includes('.png') || req.path.includes('.jpg') || req.path.includes('.jpeg') || req.path.includes('.gif')) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  next();
});

// Configuration CORS spécifique pour les fichiers uploads
app.use('/uploads', (req, res, next) => {
  // Headers CORS pour permettre l'accès aux images depuis le frontend
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
  
  // Gérer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Sert le dossier uploads du frontend en statique avec cache et CORS
app.use('/uploads', express.static(path.resolve(__dirname, '../../frontEnd/public/uploads'), {
  maxAge: '1h', // Cache 1 heure
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  }
}));

// Appliquer les middlewares CORS et autres en premier
applyMiddlewares(app);

// Appliquer le rate limiting après CORS
app.use('/api/', limiter);

// Middleware de logging optimisé
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    });
  next();
});

// Variables globales pour les collections
let collections = null;

async function startServer() {
  try {
    collections = await connectToDatabase();

    const routes = createRoutes(
      collections.collection, collections.collection2, collections.collection3, collections.collection4,
      collections.collection5, collections.collection6, collections.collection7, collections.collection8, collections.collection9, collections.collection10,
      collections.users, collections.userSettings
    );

    app.use("/api", routes);
    app.use("/api/clients", clientRoutes(collections.collection10)); // Clients
    app.use("/api/transporteurs", transporteurRoutes(collections.collection2)); // Transporteurs
    app.use("/api/listeClients", clientListRoutes(collections.collection10)); // Clients

    // Route spécifique pour servir les images avec CORS
    app.get('/uploads/:filename', (req, res) => {
      const filename = req.params.filename;
      const filePath = path.join(__dirname, '../uploads', filename);
      
      // Headers CORS spécifiques pour les images
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
      res.header('Cache-Control', 'public, max-age=3600');
      
      // Vérifier si le fichier existe
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
      } else {
        res.status(404).json({ error: 'Image not found' });
      }
    });

    // Route de santé pour le monitoring
    app.get("/health", (req, res) => {
      const stats = require('./config/bd.js').getConnectionStats();
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: stats,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      });
    });

    app.get("/", (req, res) => {
      res.json({
        message: "ATS project backend server is up and running!",
        port: PORT,
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      });
    });

    // Gestionnaire 404 optimisé
    app.use((req, res) => {
      res.status(404).json({
        error: "Route not found",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });

    // Gestionnaire d'erreur global optimisé
    app.use((err, req, res, next) => {
      // Ne pas exposer les détails d'erreur en production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(err.status || 500).json({
        error: isDevelopment ? err.message : "Something went wrong.",
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString()
      });
    });

    // Lancer le serveur HTTP
    const server = app.listen(PORT, () => {
      });

    // Configuration du timeout du serveur
    server.timeout = 30000; // 30 secondes
    server.keepAliveTimeout = 65000; // 65 secondes
    server.headersTimeout = 66000; // 66 secondes

    // Gestionnaire d'erreur pour le serveur
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          process.exit(1);
          break;
        case 'EADDRINUSE':
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Gestionnaire pour l'arrêt propre du serveur
    process.on('SIGTERM', () => {
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (err) {
    // Démarrer le serveur même sans MongoDB pour afficher l'erreur
    app.get("/", (req, res) => {
      res.status(500).json({
        error: "Database connection failed",
        message: err.message,
        help: "Make sure MongoDB is running on localhost:27017 or set MONGODB_URI environment variable",
        timestamp: new Date().toISOString()
      });
    });

    app.listen(PORT, () => {
      `);
    });
  }
}

startServer();
