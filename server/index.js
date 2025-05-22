import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: 'dimas'
  }
};

let pool;

async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server successfully');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

connectDB();

// Базовый маршрут для проверки работы сервера
app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

// Получение всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Users');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Получение пользователя по ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM Users WHERE id = @id');
    
    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });

    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .query('SELECT * FROM Users WHERE email = @email AND password = @password AND role = @role');
    
    console.log('Query result:', result.recordset);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('User found:', user);
      res.json(user);
    } else {
      console.log('Invalid credentials');
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, role, institution, groupNumber } = req.body;
    console.log('Registration attempt:', { fullName, email, role, institution, groupNumber });

    // Проверка существующего пользователя
    const checkUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (checkUser.recordset.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Создание нового пользователя
    const result = await pool.request()
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .input('institution', sql.NVarChar, institution)
      .input('groupNumber', sql.NVarChar, groupNumber)
      .query(`
        INSERT INTO Users (fullName, email, password, role, institution, groupNumber)
        OUTPUT INSERTED.*
        VALUES (@fullName, @email, @password, @role, @institution, @groupNumber)
      `);
    
    console.log('User created:', result.recordset[0]);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Обновление профиля пользователя
app.put('/api/users/:id', async (req, res) => {
  try {
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
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});