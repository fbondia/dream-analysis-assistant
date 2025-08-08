import admin from '../firebase.js';

export async function authenticateFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente ou inválido' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } 
  catch (error) {
    console.error('Erro ao verificar token Firebase:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}
