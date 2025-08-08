import { useEffect, useState } from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { SmartToy, Delete, Logout } from "@mui/icons-material";

import { auth } from './firebase';
import { signOut } from 'firebase/auth';

function Header({ onClearChat }) {

    const [userEmail, setUserEmail] = useState(null);
    
      useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
          if (user) {
            setUserEmail(user.email);
          } else {
            setUserEmail(null);
          }
        });
    
        return () => unsubscribe();  // Cleanup on unmount
      }, []);
    
      function handleLogout() {
        signOut(auth)
          .then(() => {
            console.log("Logged out successfully");
          })
          .catch((error) => {
            console.error("Error logging out: ", error.message);
          });
      }
    

  return (
    <AppBar position="static">
      <Toolbar>
        <SmartToy sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Chat
        </Typography>
        {userEmail && (
          <Typography variant="body2" sx={{ mr: 2 }}>
            {userEmail}
          </Typography>
        )}
        <IconButton color="inherit" onClick={onClearChat} title="Limpar chat">
          <Delete />
        </IconButton>
        <IconButton color="inherit" onClick={handleLogout} title="Sair">
          <Logout />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
