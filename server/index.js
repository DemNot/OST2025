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
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_INSTANCE_NAME,
    trustedConnection: true,
    integratedSecurity: true
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
    console.log('Connected to SQL Server successfully');
    
    pool.on('error', async err => {
      console.error('Database pool error:', err);
      await connectDB();
    });
  } catch (err) {
    console.error('Database connection failed:', err);
    setTimeout(connectDB, 5000);
  }
}

connectDB();

app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('/api/users', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established');
    }
    const result = await pool.request().query('SELECT * FROM Users');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established');
    }
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established');
    }
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });
    
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
      res.json(result.recordset[0]);
    } else {
      res.status(401).json({ message: 'Неверные учетные данные' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established');
    }
    const { fullName, email, password, role, institution, groupNumber } = req.body;
    console.log('Registration attempt:', { fullName, email, role });

    // Проверка существующего пользователя
    const checkUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Создание нового пользователя
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, sql.UniqueIdentifier.create())
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .input('institution', sql.NVarChar, institution)
      .input('groupNumber', sql.NVarChar, groupNumber)
      .query(`
        INSERT INTO Users (id, fullName, email, password, role, institution, groupNumber)
        OUTPUT INSERTED.*
        VALUES (@id, @fullName, @email, @password, @role, @institution, @groupNumber)
      `);
    
    console.log('User created:', result.recordset[0]);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    if (!pool) {
      throw new Error('Database connection not established');
    }
    const { fullName, email, institution, groupNumber, photoUrl } = req.body;
    
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email)
      .input('institution', sql.NVarChar, institution)
      .input('groupNumber', sql.NVarChar, groupNumber)
      .input('photoUrl', sql.NVarChar, photoUrl)
      .query(`
        UPDATE Users 
        SET fullName = @fullName,
            email = @email,
            institution = @institution,
            groupNumber = @groupNumber,
            photoUrl = @photoUrl
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});