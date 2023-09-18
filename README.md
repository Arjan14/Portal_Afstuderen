# PortalProject

## Setup

### Installeer Angular CLI
`npm install -g @angular/cli`

### Navigeer met CMD of je terminal naar de 'portal_project' folder en installeer de packages doormiddel van NPM
`npm install`

### Voeg twee environment bestanden toe aan de 'src/environments' folder ***
1. Noem de eerste bestand 'environment.prod.ts'
2. En voeg toe: 
```
export const environment = {
  firebase: { 'config settings (API key)' } // Config can be found here: https://firebase.google.com/
  production: true,
  CesiumAccessToken: 'your_access_token', // Tokens can be found here: https://cesium.com/ion/tokens
  googleMapsApiKey: 'your_access_token', // Tokens can be found here: https://developers.google.com/maps/documentation/javascript/get-api-key
  NsgiTransformApiKey: 'your_acces_token' // Tokens can be found here: https://www.nsgi.nl/coordinatentransformatie-api
};
```
3. Noem de tweede bestand 'environment.ts'
4. En voeg toe: 
```
export const environment = {
  firebase: { 'config settings (API key)' } // Config can be found here: https://firebase.google.com/
  production: false,
  CesiumAccessToken: 'your_access_token', // Tokens can be found here: https://cesium.com/ion/tokens
  googleMapsApiKey: 'your_access_token', // Tokens can be found here: https://developers.google.com/maps/documentation/javascript/get-api-key
  NsgiTransformApiKey: 'your_acces_token' // Tokens can be found here: https://www.nsgi.nl/coordinatentransformatie-api
};
```

### Start de Angular applicatie
`ng serve`
