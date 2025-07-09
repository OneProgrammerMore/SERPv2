# To Do SERP - 2025-07-08
- [ ] Check and refactor endpoints for swagger documentation auto creation

- [ ] Create Way Top Edit Resources In Frontend
- [ ] Create Way to Delete Resource in Frontend
- [ ] Resource Color Label For Main Panel Admin
- [ ] Resource Invalid Date In Resources Admin Main Panel 


- [ ] Test CRUDs As Example
- [ ] Check Backend Code with Toolset
- [ ] Check Frontend Code with Toolset




# ToDo Version 0.003
- [ ] Assigned Emergency To Resource - Main Panel Resource [NEW MODEL USER NEEDED]
- [ ] Add query parameters for filters and adapt frontend for better performance
- [ ] Add Resource Information in Backend Python Service In order to be able to use CAMARA API (Extend Model Resource or New Model For CamaraAPI Information)
- [ ] Bind Backend With CAMARA API with a new microservice in order to:
    - Locate Device
    - Set Quality On Demand for device
- [ ] Add CAMARA API functionabilities in Frontend
    - [ ] Show Status of QOD
    - [ ] Activate Deactivate QOD
    - [ ] Location of Resources By CAMARA API
    - [ ] Show Resource Reception
- [ ] Improve React AJAX App For Better Performance
    
    


# To Do SERP v2 - 2025-06-26

- [x] API Endpoint React App As Env Var
- [x] CORS backend URL as Env Var Docker
- [ ] Admninistrator
    - [x] Translation To English
    - [x] Main Panel / Tauler Principal
        - [x] Emergecies List Not showing Title
        - [ ] Emergecies List Showing More Than Active Fix
    - [x] Editor d'Incidents
        - [x] Order By Priority Not Working
    - [x] Seguiment
        - [x] What should be here? Delete whole tab? - Tracking DONE
    - [x] Gestio d'usuaris
        - [ ] To Do For Version 0.2
- [ ] Recursos / Resources
    - [ ] Main Panel / Panell Principal
        - [ ] Quality Signal Phone
        - [ ] Battery
        - [ ] Resource ID
        - [ ] Assigned Emergency
    - [x] El meu dispositiu / My Device (What should be here) - Taken OUT
- [ ] Operator
    - [ ] Tauler Principal / Main Panel
        - [x] Alertes Tab (Should be out because already Emergencies Tab?)
        - [x] New Emergency in Main Panel Out
        - [x] Search Feature Does not work
    - [x] Seguiment
        - [x] What should be here? Delete whole tab? - FIXED AND WORKING
    
    





# ToDo SERP v2 (AFTER HACKATON)
- [x] Define API Endpoints From GUI React
- [x] Clean GUI To Lean Product
- [x] Bind GUI React with API
- [ ] Test API Python
- [ ] Camara API Interface As MicroService
- [ ] Demo For Portfolio
- [ ] Check Code ALL


# ENDPOINTS GUI

## ADMIN (Receives Emergencies and Sets Resources and Monitors Emergencies to coordinate Resources)
- [x] Tauler Principal
    - [x] Fetch All Emergencies
    - [x] Fetch All Resources
    - [x] Fix Search Bar
- [x] New Emergency - Form
    - [x] Create Emergency API Endpoint
- [x] Update Emergency
    - [x] Fetch All Emergencies
- [x] Seguiment Emergencies FIX
- [x] Resources
    - [x] Fetch All Resources API Endpoint

## RESOURCES (Can Check Their Emergency and all resources to their emergency)
- [ ] Main Panel
    - [ ] Fetch Emergency Assigned To Resource
- [ ] New Emergency OUT!
- [ ] Emergency Editor OUT!
- [ ] Follow Emergencies OUT!
- [ ] Resources OUT!
- [ ] My Device OUT!
- [ ] Other Resources Assigned To SAME Emergency IN!

## OPERATOR 112 (ONLY Can Create or Modify Emergencies)
- [ ] Main Panel OUT!
- [ ] New Emergency Form
    - [ ] Create Emergency API Endpoint
- [ ] Edit Emergency
    - [ ] Update Emergenci API Endpoint
    - [ ] List All Emergencies API Endpoint
- [ ] Seguiment Emergencies OUT!
- [ ] Resources OUT


    

# DATA FOR RESOURCE

## EMERGENCIES:
- Title
- Description
- Type
- Location (Latitude/Longitude)
- Priority
- Last Update
- Status [ACTIVE, PENDING, SOLVED]

## Resources
- Name
- Type
- Location
- Status [AVAILABLE, BUSY, MAINTENANCE]

