import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { fetchEmergencies } from "../../redux/slices/emergenciesSlice";

const Seguiment = () => {
  const dispatch = useDispatch();
  const emergencies = useSelector((state) => state.emergencies.emergencies);
  const [openUpdateModal, setOpenUpdateModal] = React.useState(false);
  const [selectedEmergency, setSelectedEmergency] = React.useState(null);
  const [newUpdate, setNewUpdate] = React.useState("");

  useEffect(() => {
    dispatch(fetchEmergencies());
    const idEmergencies = setInterval(
      () => dispatch(fetchEmergencies()),
      100000,
    );
    return () => clearInterval(idEmergencies);
  }, []);

  const handleOpenUpdateModal = (emergency) => {
    setSelectedEmergency(emergency);
    setOpenUpdateModal(true);
  };

  const handleCloseUpdateModal = () => {
    setSelectedEmergency(null);
    setNewUpdate("");
    setOpenUpdateModal(false);
  };

  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;

    const updatedEmergencies = emergencies.map((emergency) => {
      if (emergency.id === selectedEmergency.id) {
        const updates = emergency.updates || [];
        const newUpdates = [
          {
            id: Date.now(),
            time: new Date().toISOString(),
            message: newUpdate.trim(),
          },
          ...updates,
        ].slice(0, 3); // Mantener solo las 3 últimas actualizaciones

        return {
          ...emergency,
          updates: newUpdates,
          lastUpdate: new Date().toISOString(),
        };
      }
      return emergency;
    });

    //setEmergencies(updatedEmergencies);
    dispatch(fetchEmergencies);
    localStorage.setItem("incidents", JSON.stringify(updatedEmergencies));
    handleCloseUpdateModal();
  };

  // Función para ordenar las emergencias
  const activeEmergencies = emergencies.filter((e) => e.status === "Active");
  const resolvedEmergencies = emergencies.filter((e) => e.status !== "Active");

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Emergencies Tracking
        </Typography>
        <IconButton>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Emergencias Activas */}
      {activeEmergencies.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" color="text.secondary">
            Active Emergencies
          </Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {activeEmergencies.map((emergency) => (
          <Grid item xs={12} key={emergency.id}>
            <Card>
              <CardHeader
                title={emergency.title}
                subheader={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LocationIcon fontSize="small" />
                    <Typography variant="body2">
                      {`Lat: ${emergency.location_emergency_data.latitude} Long: ${emergency.location_emergency_data.longitude}` ||
                        "Unknown"}
                    </Typography>
                  </Box>
                }
                action={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={emergency.status === "Active" ? "Active" : "Error"}
                      color={
                        emergency.status === "active" ? "success" : "error"
                      }
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleOpenUpdateModal(emergency)}
                      color="primary"
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTimeIcon color="action" />
                      <Typography variant="body2">
                        Last Update:{" "}
                        {new Date(emergency.time_updated).toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GroupIcon color="action" />
                      <Typography variant="body2">
                        Priority:{" "}
                        {emergency.priority === "Critical"
                          ? "Critical"
                          : emergency.priority === "High"
                            ? "High"
                            : emergency.priority === "Medium"
                              ? "Medium"
                              : emergency.priority === "Low"
                                ? "Low"
                                : "Unknown"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <GroupIcon color="action" />
                      <Typography variant="body2">
                        Type:{" "}
                        {emergency.emergency_type === "Fire"
                          ? "Fire"
                          : emergency.emergency_type === "Medical"
                            ? "Medical"
                            : emergency.emergency_type === "Accident"
                              ? "Accident"
                              : emergency.emergency_type === "Natural Disaster"
                                ? "Desastre Natural"
                                : "Other"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* ToDo - This part implementation should be done in the server in the future*/}
                <Typography variant="subtitle2" gutterBottom>
                  Last Updates{" "}
                  {emergency.updates
                    ? `(${emergency.updates.length}/3)`
                    : "(0/3)"}
                </Typography>
                <List>
                  {(emergency.updates || [])
                    .slice(0, 3)
                    .map((update, index) => (
                      <React.Fragment key={update.id}>
                        <ListItem>
                          <ListItemIcon>
                            <AccessTimeIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={update.message}
                            secondary={new Date(update.time).toLocaleString()}
                          />
                        </ListItem>
                        {index <
                          Math.min((emergency.updates || []).length - 1, 2) && (
                          <Divider />
                        )}
                      </React.Fragment>
                    ))}
                  {(!emergency.updates || emergency.updates.length === 0) && (
                    <ListItem>
                      <ListItemText
                        primary="There are not updates"
                        secondary="(Add the first update clicking the button +) [ToDo For the future] "
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Separador y título para emergencias resueltas */}
      {resolvedEmergencies.length > 0 && (
        <>
          <Box sx={{ mt: 6, mb: 3 }}>
            <Typography variant="h5" color="text.secondary">
              Solved Emergencies
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {resolvedEmergencies.map((emergency) => (
              <Grid item xs={12} md={6} key={emergency.id}>
                <Card sx={{ opacity: 0.8, transform: "scale(0.95)" }}>
                  <CardHeader
                    title={
                      <Typography variant="h6">{emergency.title}</Typography>
                    }
                    subheader={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocationIcon fontSize="small" />
                        <Typography variant="body2">
                          {`Lat: ${emergency.location_emergency_data.latitude} Long: ${emergency.location_emergency_data.longitude}` ||
                            "Unknown"}
                        </Typography>
                      </Box>
                    }
                    action={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Chip label="Solved" color="success" size="small" />
                      </Box>
                    }
                  />
                  <CardContent>
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={12}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <AccessTimeIcon color="action" fontSize="small" />
                          <Typography variant="body2">
                            Last Update:{" "}
                            {new Date(emergency.time_updated).toLocaleString()}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Dialog
        open={openUpdateModal}
        onClose={handleCloseUpdateModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Afegir Actualització</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nova actualització"
            fullWidth
            multiline
            rows={4}
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateModal}>Cancel·lar</Button>
          <Button onClick={handleAddUpdate} variant="contained" color="primary">
            Afegir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Seguiment;
