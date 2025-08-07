// Fichier utils/middleware.js
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

function applyMiddlewares(app) {
  app.use((req, res, next) => {
    next();
  });

  // Configuration CORS complète et dynamique
  const corsOptions = {
    origin: function (origin, callback) {
      // Permettre les requêtes sans origin (comme les requêtes de serveur à serveur)
      if (!origin) return callback(null, true);
      
      // Liste des origines autorisées
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177',
        'http://localhost:5178',
        'http://localhost:5179',
        'http://localhost:5180',
        'http://localhost:5181',
        'http://localhost:5182',
        'http://localhost:5183',
        'http://localhost:5184',
        'http://localhost:5185',
        'http://localhost:5186',
        'http://localhost:5187',
        'http://localhost:5188',
        'http://localhost:5189',
        'http://localhost:5190',
        'http://localhost:5191',
        'http://localhost:5192',
        'http://localhost:5193',
        'http://localhost:5194',
        'http://localhost:5195',
        'http://localhost:5196',
        'http://localhost:5197',
        'http://localhost:5198',
        'http://localhost:5199',
        'http://localhost:5200',
        // Ajouter dynamiquement les ports Vite courants
        ...Array.from({length: 100}, (_, i) => `http://localhost:${5173 + i}`)
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false
  };

  app.use(cors(corsOptions));

  // Middleware CORS supplémentaire pour s'assurer que tous les headers sont présents
  app.use((req, res, next) => {
    // Headers CORS pour toutes les requêtes
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // Cache preflight pour 24h
    
    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
}

// Middleware de vérification du token JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant ou invalide" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_key");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }
}

module.exports = applyMiddlewares;
module.exports.verifyToken = verifyToken;
