import { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box
} from "@mui/material";
import { SmartToy, Delete, Logout } from "@mui/icons-material";

import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

function Header({ mode, persona, onChangeMode, onChangePersona, onClearChat }) {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  function handleLogout() {
    signOut(auth)
      .then(() => console.log("Logged out successfully"))
      .catch((error) => console.error("Error logging out: ", error.message));
  }

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
        <SmartToy sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Chat
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="mode-label">Modo</InputLabel>
            <Select
              labelId="mode-label"
              value={mode}
              label="Modo"
              onChange={(e) => onChangeMode(e.target.value)}
            >
              <MenuItem value="auto">Automático</MenuItem>
              <MenuItem value="specific">Específico</MenuItem>
              <MenuItem value="ensemble">Misturado</MenuItem>
            </Select>
          </FormControl>

          {mode==="specific" &&
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="persona-label">Tipo de Análise</InputLabel>
              <Select
                labelId="persona-label"
                value={persona}
                label="Tipo de Análise"
                onChange={(e) => onChangePersona(e.target.value)}>
                <MenuItem value="jung">Junguiana</MenuItem>
                <MenuItem value="narrative">Análise Narrativa</MenuItem>
                <MenuItem value="cognitive">Análise Cognitiva</MenuItem>
              </Select>
            </FormControl>
          }

          {userEmail && (
            <Typography variant="body2" sx={{ mr: 1 }}>
              {userEmail}
            </Typography>
          )}

          <IconButton color="inherit" onClick={onClearChat} title="Limpar chat">
            <Delete />
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout} title="Sair">
            <Logout />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
