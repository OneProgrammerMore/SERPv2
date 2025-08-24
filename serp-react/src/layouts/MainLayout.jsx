import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  Add as AddIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  LocalShipping as ResourcesIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

import addPrefix from "../functions/prefixURL";
import useResponsiveFlexDirection, {useResponsiveVisibility} from '../functions/responsiveFlexDirection';



const MainLayout = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const { user } = useAuth();
  const notifications = useSelector((state) => state.ui.notifications);

  const [anchorEl, setAnchorEl] = useState(null);

  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

  const [menuWidth, setMenuWidth] =  useState('240px')
  const [mainWidth, setMainWidth] =  useState(`calc(100% - 240px)`)
  const [menuLeft, setMenuLeft] =  useState('-100%')
  const [mainPosition, setMainPosition] =  useState('relative');
  const [menuPosition, setMenuPosition] =  useState('absolute');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const responsiveVisibility = useResponsiveVisibility();

  const toggleMenu = () => {
    if(menuLeft == '0%'){
      setMenuLeft('-100%');
    }else{
      setMenuLeft('0%');
    }
  }

  const closeMenu = () => {
    setMenuLeft('-100%');
  }

  const navigateCustom = (section) => {
    navigate(section);
    if(window.innerWidth >= 800 == false){
      closeMenu();
    }
  }

  const menuResponsive = () => {
    if(window.innerWidth >= 800){
      setMenuLeft('0%');
      setMenuWidth('240px');
      setMainWidth(`calc(100% - 240px)`);
      setMainPosition('relative');
      setMenuPosition('fixed');
    }else{
      setMenuLeft('-100%');
      setMenuWidth('100%');
      setMainWidth('100%');
      setMainPosition('absolute');
      setMenuPosition('fixed');
    }
  }

  window.addEventListener('resize', menuResponsive)

  useEffect( () => {
    menuResponsive();
  }, []);



  // Menú lateral según el rol del usuario
  const getSidebarItems = () => {
    // Elementos básicos que todos los roles pueden ver
    const basicItems = [
      {
        text: "Main Panel",
        icon: <DashboardIcon />,
        path: "/dashboard",
      },
      {
        text: "New Emergency",
        icon: <AddIcon />,
        path: "/emergency/new",
      },
      {
        text: "Emergency Editor",
        icon: <EditIcon />,
        path: "/emergency/editor",
      },
      {
        text: "Tracking",
        icon: <AssignmentIcon />,
        path: "/emergency/tracking",
      },
      {
        text: "Resources",
        icon: <ResourcesIcon />,
        path: "/devices/resources",
      },
    ];

    // Elementos adicionales según el rol
    const adminItems = [
      {
        text: "User adminitration",
        icon: <PeopleIcon />,
        path: "/users",
      },
    ];

    // Determinar qué elementos mostrar según el rol
    if (user?.role === "emergency_center") {
      return [...basicItems, ...adminItems];
    } else if (user?.role === "resource_personnel") {
      return [...basicItems];
    } else if (user?.role === "emergency_operator") {
      return basicItems;
    }

    // Por defecto, mostrar solo elementos básicos
    return basicItems;
  };

  return (
    
    <Box sx={{ display: "flex"}}>

      {/* Menu Button */}
      <div className="menu-button" onClick={toggleMenu}>
        <MenuIcon color="black" />
      </div>

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              src={addPrefix("/resources/SERP_ico.png")}
              alt="SERP Logo"
              style={{
                height: "32px",
                marginRight: "12px",
              }}
            />
            <Typography variant="h6" noWrap component="div" sx={{fontSize: '12px', display: 'flex', flexDirection: 'row'}}>
              SERP <div style={{display: responsiveVisibility}}> - Sistema d'Emergències i Resposta Prioritaria </div>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Botón de Notificaciones */}
            <Tooltip title="Notificacions">
              <IconButton color="inherit" onClick={handleNotificationsOpen}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Botón de cambio de tema */}
            <Tooltip title={mode === "dark" ? "Mode clar" : "Mode fosc"}>
              <IconButton color="inherit" onClick={toggleTheme}>
                {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>

            {/* Menú de usuario */}
            <Box sx={{ display: "flex", alignItems: "center", ml: 1 }}>
              <Tooltip title="Configuració del compte">
                <IconButton onClick={handleMenuOpen} color="inherit">
                  <Avatar
                    alt={user?.name || "Usuari"}
                    src={addPrefix("/static/images/avatar/1.jpg")}
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menú de notificaciones */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        sx={{ mt: "45px" }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>No hi ha notificacions</MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={handleNotificationsClose}
              sx={{
                backgroundColor: notification.read
                  ? "inherit"
                  : "rgba(25, 118, 210, 0.08)",
                maxWidth: 300,
              }}
            >
              <Typography variant="body2" noWrap>
                {notification.message}
              </Typography>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Sidebar */}
      <div className="menu-container" 
        style={{
          left: menuLeft,
          width: menuWidth,
          position: menuPosition,
        }}
      >
      <Drawer
        variant="permanent"
        
        sx={{
          width: menuWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: menuWidth,
            boxSizing: "border-box",
            position: "relative",
          },
        }}
      >
        <Toolbar /> {/* Espacio para el AppBar */}
        <Box sx={{ 
          overflow: "auto"
          }}>
          <List>
            {getSidebarItems().map((item) => (
              <ListItem
                button
                key={item.text}
                onClick={() => navigateCustom(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      </div>


      {/* Contenido principal */}
      <div className="main-container"
        style={{
          width: mainWidth,
          position: mainPosition,
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            marginLeft: "0px !important",
            transition: "none !important",
          }}
        >
          <Toolbar /> {/* Espacio para el AppBar */}
          <Outlet />
        </Box>
      
      </div>
      </Box>
  );
};

export default MainLayout;
