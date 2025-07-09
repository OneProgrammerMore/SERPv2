import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const fetchResourcesAPICall = async ()  => {
  const endpoint = API_URL + '/api/resources'
  
  try {
      
    const response = await fetch(endpoint, {
      method: 'GET', // or 'PUT'
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      console.log(
        "Looks like there was a problem. Status Code: " + response.status
      );
      return;
    }
    const data = await response.json();
    return data;
    
  } catch(err) {
    console.log("Error in Dashboard while fetching emergencies", err);
  }
}



// Thunks
export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchResourcesAPICall();
      return data;
  
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



const fetchResourcesWithAssignmentsAPICall = ()  => {
  const endpoint = API_URL + '/api/resources'

  const response = fetch(endpoint, {
    method: 'GET', // or 'PUT'
    headers: {
      'Accept': 'application/json',
    }
  });

  return response;
}

const fetchAssignmentsAPICall = async (resources) => {
  let endpoint = ''
  for (const resource of resources){
    endpoint = API_URL + '/api/resources/' + resource.id + '/assignments'

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    if (!response.ok) {
      console.log(
        "Looks like there was a problem. Status Code: " + response.status
      );
      return;
    }
    const json = await response.json();

    resource.assignments = json;
  }
  return resources;
}



// Thunks
export const fetchResourcesWithAssignments = createAsyncThunk(
  'resources/fetchResourcesWithAssigments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchResourcesWithAssignmentsAPICall();

      if(!response.ok){
        console.log(
          "Looks like there was a problem. Status Code: ",  response
        );
        return;
      }
      const json = await response.json()

      const resourcesWithAssignment = await fetchAssignmentsAPICall(json)
      
      return resourcesWithAssignment;
  
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);





const createResourceAPICall = async(newResource) =>{
  const endpoint = API_URL + '/api/resources'

  const response = await fetch(endpoint, {
    method: 'POST', // or 'PUT'
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(newResource),
  })

  return response;
}


export const createResource = createAsyncThunk(
  'resources/create',
  async ({newResource},{rejectWithValue}) => {
    try{
      const response = await createResourceAPICall(newResource);
      return response;
    }catch (error){
      return rejectWithValue(error.response.data);
    }
  }
);

const editResourceAPICall = async(editedResource, resourceID) =>{
  const endpoint = API_URL + '/api/resources/'+resourceID

  const response = await fetch(endpoint, {
    method: 'PATCH', // or 'PUT'
    headers: {
      "Content-type": "application/json"
    },
    body: JSON.stringify(editedResource),
  })

  return response;
}


export const editResource = createAsyncThunk(
  'resources/edit',
  async ({editedResource, resourceID},{rejectWithValue}) => {
    try{
      const response = await editResourceAPICall(editedResource, resourceID);
      return response;
    }catch (error){
      return rejectWithValue(error.response.data);
    }
  }
);



export const assignResource = createAsyncThunk(
  'resources/assignResource',
  async ({ resourceId, emergencyId }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/resources/${resourceId}/assign`, { emergencyId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


const fetchDeleteResourceAPICall = async (resourceID) => {
  let endpoint = ''
  endpoint = API_URL + '/api/resources/' + resourceID

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });
  return response;
}

export const deleteResource = createAsyncThunk(
  'delete/unassignResource',
  async (resourceID, { rejectWithValue }) => {
    try {
      const response = await fetchDeleteResourceAPICall(resourceID);
      return response;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


export const unassignResource = createAsyncThunk(
  'resources/unassignResource',
  async (resourceId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/resources/${resourceId}/unassign`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);


// Slice inicial
const initialState = {
  resources: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  activeResource: null
};

// Slice
const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    setActiveResource: (state, action) => {
      state.activeResource = action.payload;
    },
    clearActiveResource: (state) => {
      state.activeResource = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Obtener recursos
      .addCase(fetchResources.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.resources = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Obtener recursos with assigments
      .addCase(fetchResourcesWithAssignments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchResourcesWithAssignments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.resourcesWithAssigments = action.payload;
      })
      .addCase(fetchResourcesWithAssignments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Asignar recurso
      .addCase(assignResource.fulfilled, (state, action) => {
        const index = state.resources.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
        if (state.activeResource?.id === action.payload.id) {
          state.activeResource = action.payload;
        }
      })
      // Desasignar recurso
      .addCase(unassignResource.fulfilled, (state, action) => {
        const index = state.resources.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.resources[index] = action.payload;
        }
        if (state.activeResource?.id === action.payload.id) {
          state.activeResource = action.payload;
        }
      });
  }
});

export const { setActiveResource, clearActiveResource } = resourcesSlice.actions;

export default resourcesSlice.reducer; 