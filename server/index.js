import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({
  origin: true,
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

app.get('/', (req, res) => {
  res.json({ message: 'API is working' });
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Users');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .query('SELECT * FROM Users WHERE email = @email AND password = @password AND role = @role');

    if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
    } else {
      res.status(401).json({ message: 'Неверные учетные данные' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, role, institution, groupNumber } = req.body;

    // Проверяем существование пользователя
    const checkUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Если регистрируется студент, проверяем существование группы
    if (role === 'student') {
      const checkGroup = await pool.request()
        .input('groupNumber', sql.NVarChar, groupNumber)
        .input('institution', sql.NVarChar, institution)
        .query('SELECT * FROM Groups WHERE groupNumber = @groupNumber AND institution = @institution');

      if (checkGroup.recordset.length === 0) {
        return res.status(400).json({ 
          message: 'Группа не найдена. Дождитесь, пока преподаватель создаст вашу группу.' 
        });
      }
    }
    
    // Создаем нового пользователя
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

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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