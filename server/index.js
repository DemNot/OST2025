import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE_NAME
  }
};

let pool = null;

async function connectDB() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
    }
    
    pool = await new sql.ConnectionPool(config).connect();
    console.log('✅ Connected to SQL Server successfully');
    console.log('Database:', config.database);
    
    pool.on('error', async err => {
      console.error('❌ Database pool error:', err);
      await connectDB();
    });
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    console.log('Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
}

connectDB();

app.get('/', (req, res) => {
  res.json({ 
    message: 'OST2025 API is working',
    timestamp: new Date().toISOString(),
    database: pool ? 'Connected' : 'Disconnected'
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established');
    }
    
    const { fullName, email, password, role, institution, groupNumber } = req.body;
    
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Все поля обязательны для заполнения' 
      });
    }

    console.log('📝 Registration attempt:', { fullName, email, role, institution, groupNumber });

    const checkUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ 
        message: 'Пользователь с таким email уже существует' 
      });
    }

    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    const result = await pool.request()
      .input('id', sql.NVarChar, newUserId)
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .input('institution', sql.NVarChar, institution || '')
      .input('groupNumber', sql.NVarChar, groupNumber || '')
      .query(`
        INSERT INTO Users (id, fullName, email, password, role, institution, groupNumber)
        OUTPUT INSERTED.*
        VALUES (@id, @fullName, @email, @password, @role, @institution, @groupNumber)
      `);
    
    const newUser = result.recordset[0];
    console.log('✅ User created:', { id: newUser.id, fullName: newUser.fullName, role: newUser.role });
    
    delete newUser.password;
    
    res.status(201).json(newUser);
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ 
      message: 'Ошибка сервера при регистрации: ' + err.message 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established');
    }
    
    const { email, password, role } = req.body;
    console.log('🔐 Login attempt:', { email, role });
    
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .query(`
        SELECT id, fullName, email, role, institution, groupNumber, photoUrl 
        FROM Users 
        WHERE email = @email AND password = @password AND role = @role
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('✅ Login successful:', { id: user.id, fullName: user.fullName, role: user.role });
      res.json(user);
    } else {
      console.log('❌ Login failed: Invalid credentials');
      res.status(401).json({ message: 'Неверные учетные данные' });
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints available at http://localhost:${PORT}/api`);
});