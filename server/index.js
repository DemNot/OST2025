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
    encrypt: true,
    trustServerCertificate: true
  }
};

// Подключение к базе данных
let pool;

async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server');
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

connectDB();

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .query('SELECT * FROM Users WHERE email = @email AND role = @role');
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.json(user);
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, role, institution, groupNumber } = req.body;
    
    // Проверка существующего пользователя
    const checkUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');
    
    if (checkUser.recordset.length > 0) {
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
    
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Группы
app.get('/api/groups', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Groups');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { groupNumber, specialty, institution, teacherId, students } = req.body;
    
    const result = await pool.request()
      .input('groupNumber', sql.NVarChar, groupNumber)
      .input('specialty', sql.NVarChar, specialty)
      .input('institution', sql.NVarChar, institution)
      .input('teacherId', sql.NVarChar, teacherId)
      .query(`
        INSERT INTO Groups (groupNumber, specialty, institution, teacherId)
        OUTPUT INSERTED.*
        VALUES (@groupNumber, @specialty, @institution, @teacherId)
      `);
    
    const groupId = result.recordset[0].id;
    
    // Добавление студентов в группу
    for (const student of students) {
      await pool.request()
        .input('groupId', sql.NVarChar, groupId)
        .input('studentId', sql.NVarChar, student.id)
        .query('INSERT INTO GroupStudents (groupId, studentId) VALUES (@groupId, @studentId)');
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Тесты
app.get('/api/tests', async (req, res) => {
  try {
    const result = await pool.request().query('SELECT * FROM Tests');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/tests', async (req, res) => {
  try {
    const { title, subject, description, teacherId, groupIds, questions, timeLimit, startDate, endDate } = req.body;
    
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('subject', sql.NVarChar, subject)
      .input('description', sql.NVarChar, description)
      .input('teacherId', sql.NVarChar, teacherId)
      .input('timeLimit', sql.Int, timeLimit)
      .input('startDate', sql.DateTime, new Date(startDate))
      .input('endDate', sql.DateTime, new Date(endDate))
      .input('questions', sql.NVarChar, JSON.stringify(questions))
      .query(`
        INSERT INTO Tests (title, subject, description, teacherId, timeLimit, startDate, endDate, questions)
        OUTPUT INSERTED.*
        VALUES (@title, @subject, @description, @teacherId, @timeLimit, @startDate, @endDate, @questions)
      `);
    
    const testId = result.recordset[0].id;
    
    // Связывание теста с группами
    for (const groupId of groupIds) {
      await pool.request()
        .input('testId', sql.NVarChar, testId)
        .input('groupId', sql.NVarChar, groupId)
        .query('INSERT INTO TestGroups (testId, groupId) VALUES (@testId, @groupId)');
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Результаты тестов
app.post('/api/test-results', async (req, res) => {
  try {
    const { testId, studentId, answers, score, maxScore } = req.body;
    
    const result = await pool.request()
      .input('testId', sql.NVarChar, testId)
      .input('studentId', sql.NVarChar, studentId)
      .input('answers', sql.NVarChar, JSON.stringify(answers))
      .input('score', sql.Int, score)
      .input('maxScore', sql.Int, maxScore)
      .query(`
        INSERT INTO TestResults (testId, studentId, answers, score, maxScore)
        OUTPUT INSERTED.*
        VALUES (@testId, @studentId, @answers, @score, @maxScore)
      `);
    
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});