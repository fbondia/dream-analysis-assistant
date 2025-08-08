import React, { useState } from 'react';
import { Box, AppBar, Toolbar, Typography, Container, TextField, Button, CircularProgress, Typography as MuiTypography } from "@mui/material";
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate('/'); // Redireciona para a página principal após registro
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Register
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, py: 2, display: "flex", flexDirection: "column" }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Create an Account
          </Typography>
          <form onSubmit={handleRegister}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
            />
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
            {error && (
              <MuiTypography color="error" variant="body2" align="center" marginTop={2}>
                {error}
              </MuiTypography>
            )}
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <MuiTypography component="a" href="/login" underline="hover" color="primary">
                Login here
              </MuiTypography>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterPage;
