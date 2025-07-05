import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;


async function fetchEmergenciesAPICall () {
  const endpoint = API_URL + '/api/alerts'
  try{
    const response = await fetch(endpoint, {
      method: 'GET', // or 'PUT'
      headers: {
        'Accept': 'application/json',
      }
    });
    if (!response.ok) {
      console.log(
        "Looks like there was a problem. Status Code: " + response.status
      );
      return [];
    }
    const data = await response.json();
    return data;
  } catch(err) {
    console.log("Error in Dashboard while fetching emergencies", err);
    return [];
  };
}

// Thunks
// export const fetchEmergencies = createAsyncThunk(
//   'emergencies/fetchEmergencies',
//   async (_, { rejectWithValue }) => {
//     try {
//       // const response = await axios.get(`${API_URL}/emergencies`);
//       // return response.data;
//       const data = fetchEmergenciesAPICall();
//       return data;
//     } catch (error) {
//       return rejectWithValue(error.response.data);
//     }
//   }
// );


// export const fetchEmergencies = createAsyncThunk(
//   'emergencies/fetchEmergencies',
//   async (_ , thunkAPI) => {
//     try {
//       // const response = await axios.get(`${API_URL}/emergencies`);
//       // return response.data;
//       const data = fetchEmergenciesAPICall();
//       return data;
//     } catch (error) {
//       return thunkAPI.rejectWithValue(error.response.data);
//     }
//   }
// );

export const fetchEmergencies = createAsyncThunk(
  'emergencies/fetchEmergencies',
  async () => {
    try {
      const data = await fetchEmergenciesAPICall();
      return data;
    } catch (error) {
      console.error('fetchEmergencies error:', error);
      return [];
    }
  }
);

const createEmergencyAPICall = async(newIncident) => {
  const endpoint = API_URL + '/api/alerts'
  const response = await fetch(endpoint, {
    method: 'POST', // or 'PUT'
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(newIncident),
  });

  return response;

}

export const createEmergency = createAsyncThunk(
  'emergencies/createEmergency',
  async (emergencyData, { rejectWithValue }) => {
    try {
      const response = await createEmergencyAPICall(emergencyData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


const updateEmergencyAPICall = async (emergencyID, emergencyData) =>{

  const endpoint = API_URL + '/api/alerts/' + emergencyID;
  console.log("API ENDPOINT = ", endpoint);
  console.log("Data = ", emergencyData);

  const response = await fetch(endpoint, {
    method: 'PATCH', // or 'PUT'
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(emergencyData),
  })

  return response;
}



export const updateEmergency = createAsyncThunk(
  'emergencies/updateEmergency',
  async ({ id, updatedEmergency }, { rejectWithValue }) => {
    try {
      // const response = await axios.put(`${API_URL}/emergencies/${id}`, emergencyData);
      // return response.data;
      console.log("id", id)
      console.log("Data = ", updatedEmergency);
      const response = await  updateEmergencyAPICall(id, updatedEmergency);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


const deleteEmergencyAPICall = async (emergencyID) => {

  const endpoint = API_URL + '/api/alerts/' + emergencyID;
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      "Content-type": "application/json"
    },
  })
  return response;

}


export const deleteEmergency = createAsyncThunk(
  'emergencies/deleteEmergency',
  async (id, { rejectWithValue }) => {
    try {
      // await axios.delete(`${API_URL}/emergencies/${id}`);
      // return id;
      const response = await deleteEmergencyAPICall(id);
      return response;

    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const resolveEmergency = createAsyncThunk(
  'emergencies/resolveEmergency',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/emergencies/${id}/resolve`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



const assignResourcesToEmergencyAPICall = async (emergencyID, resources) => {

  console.log("resources: ", resources);
      console.log("emergencyID ", emergencyID);

  const endpoint = API_URL + '/api/alerts/' + emergencyID + '/assign' 
  const response = await fetch(endpoint, {
    method: 'POST', // or 'PUT'
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      resourcesIDs: [...resources]
    })
  })
  if (!response.ok) {
    console.log(
      "Looks like there was a problem assigning the resources to the emergency. Status Code: " + response.status
    );
    return;
  }

  return response;
}

export const assignResourcesToEmergency = createAsyncThunk(
  'emergencies/assignResourcesToEmergency',
  async ({ emergencyID, selectedResources }, { rejectWithValue }) => {
    try {
      // const response = await axios.post(`${API_URL}/emergencies/${emergencyId}/assign-resources`, { resourceIds });
      // return response.data;
      console.log("selectedResources: ", selectedResources);
      console.log("emergencyID ", emergencyID);
      const response = await assignResourcesToEmergencyAPICall(emergencyID, selectedResources);
      const json = await response.json();
      return json;

    } catch (error) {
      return rejectWithValue(error.response.data);

    }
  }
);

// Slice inicial
const initialState = {
  emergencies: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  activeEmergency: null
};

// Slice
const emergenciesSlice = createSlice({
  name: 'emergencies',
  initialState,
  reducers: {
    setActiveEmergency: (state, action) => {
      state.activeEmergency = action.payload;
    },
    clearActiveEmergency: (state) => {
      state.activeEmergency = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Obtener emergencias
      .addCase(fetchEmergencies.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmergencies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.emergencies = action.payload;
      })
      .addCase(fetchEmergencies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Crear emergencia
      .addCase(createEmergency.fulfilled, (state, action) => {
        state.emergencies.push(action.payload);
      })
      // Actualizar emergencia
      .addCase(updateEmergency.fulfilled, (state, action) => {
        //const index = state.emergencies.findIndex(e => e.id === action.payload.id);
        // if (index !== -1) {
        //   state.emergencies[index] = action.payload;
        // }
        // if (state.activeEmergency?.id === action.payload.id) {
        //   state.activeEmergency = action.payload;
        // }
      })
      // Eliminar emergencia
      .addCase(deleteEmergency.fulfilled, (state, action) => {
        state.emergencies = state.emergencies.filter(e => e.id !== action.payload);
        if (state.activeEmergency?.id === action.payload) {
          state.activeEmergency = null;
        }
      })
      // Resolver emergencia
      .addCase(resolveEmergency.fulfilled, (state, action) => {
        const index = state.emergencies.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.emergencies[index] = action.payload;
        }
        if (state.activeEmergency?.id === action.payload.id) {
          state.activeEmergency = action.payload;
        }
      })
      // Asignar recursos a emergencia
      .addCase(assignResourcesToEmergency.fulfilled, (state, action) => {
        const index = state.emergencies.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.emergencies[index] = action.payload;
        }
        if (state.activeEmergency?.id === action.payload.id) {
          state.activeEmergency = action.payload;
        }

      });
  }
});

export const { setActiveEmergency, clearActiveEmergency } = emergenciesSlice.actions;

export default emergenciesSlice.reducer; 