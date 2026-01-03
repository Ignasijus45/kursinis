import express from 'express';
import { registerUserHandler, loginUserHandler } from './users.js';

const router = express.Router();

// Registracija (/api/auth/register)
router.post('/register', registerUserHandler);

// Prisijungimas (/api/auth/login)
router.post('/login', loginUserHandler);

export default router;
