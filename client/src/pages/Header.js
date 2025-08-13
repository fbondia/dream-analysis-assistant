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

function Header({ onClearChat }) {

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
