import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

@Injectable({
  providedIn: 'root'
})

export class LoadingService {
  firestore: firebase.firestore.Firestore;
  tileset: Cesium.Cesium3DTileset;
  steiger3D: Cesium.Cesium3DTileset;
  assetIds: number[] = [1873836, 1867455, 1867487, 1873646, 1873650]
  showSteigerEnt: boolean = false;
  alkmaarAssets: number[] = [2272565, 2272895, 2272894, 2273158]
  nijmegenAssets: number[] = [2272565 , 2273012, 2274594, 2274595, 2274598]
  loadedAssets:any = []

  constructor() {
    this.firestore = firebase.firestore();
  }

  //Laadt het model in cesium + config
  public async loadModel(viewer: Cesium.Viewer, assetId: number): Promise<void> {
    //Laden van tileset + het meegeven van de verschillende options
    const resource = await Cesium.IonResource.fromAssetId(assetId);
    this.tileset = await Cesium.Cesium3DTileset.fromUrl(resource);
    this.tileset.maximumScreenSpaceError = 1;
    this.tileset.maximumMemoryUsage = 2048;
    this.tileset.dynamicScreenSpaceError = true;
    this.tileset.skipLevelOfDetail = true;
    this.tileset.immediatelyLoadDesiredLevelOfDetail = true;
    this.tileset.baseScreenSpaceError = 2048;
    this.tileset.skipScreenSpaceErrorFactor = 32;
    this.tileset.dynamicScreenSpaceErrorHeightFalloff = 1;
    this.tileset.showCreditsOnScreen = true;
    this.tileset.showOutline = true;
    //Tileset
    const newBuildingTileset = viewer.scene.primitives.add(this.tileset);
    //Camera navigeert naar asset after initialisatie
    viewer.flyTo(newBuildingTileset);
    //Geeft verschillende steigers weer bij verschillende Assets
    if (assetId == 2273011) {
      try {
        //Initialiseer steiger obv assetID
        const steiger = await Cesium.IonResource.fromAssetId(2279405);
        this.steiger3D = await Cesium.Cesium3DTileset.fromUrl(steiger);
        viewer.scene.primitives.add(this.steiger3D);
        this.steiger3D.show = false;
        await viewer.zoomTo(this.steiger3D);
        //Geef opties mee aan de steiger (extras)
        const extras = this.steiger3D.asset.extras;
        if (
          Cesium.defined(extras) &&
          Cesium.defined(extras.ion) &&
          Cesium.defined(extras.ion.defaultStyle)
        ) {
          this.steiger3D.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
        }
        //Error afhandeling
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        //Initialiseer steiger obv assetID
        const steiger = await Cesium.IonResource.fromAssetId(2232913);
        this.steiger3D = await Cesium.Cesium3DTileset.fromUrl(steiger);
        viewer.scene.primitives.add(this.steiger3D);
        this.steiger3D.show = false;
        await viewer.zoomTo(this.steiger3D);
        //Geef opties mee aan de steiger (extras)
        const extras = this.steiger3D.asset.extras;
        if (
          Cesium.defined(extras) &&
          Cesium.defined(extras.ion) &&
          Cesium.defined(extras.ion.defaultStyle)
        ) {
          this.steiger3D.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
        }
        //Error afhandeling
      } catch (error) {
        console.log(error);
      }
    }
  }

  //Laad de 3D van Google maps dmv API
  public async load3Dworld(viewer:Cesium.Viewer): Promise<void> {
    //API key, zet even in de environment (gitignore)
    Cesium.GoogleMaps.defaultApiKey = ''
    //Voeg 3D wereld toe
    try {
      const tileset = await Cesium.createGooglePhotorealistic3DTileset();
      viewer.scene.primitives.add(tileset);
    } catch (error) {
      console.log(`Failed to load tileset: ${error}`);
    }
    //Vlieg camera naar Groningen
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(6.567546964348124, 53.21888668145912, 500),
    });
  }

  //Load Alle modellen capelle
  public async loadModelsCapelle(viewer:Cesium.Viewer): Promise<void> {
    //Loop door de assets die ingeladen moeten worden
    for (const asset of this.assetIds) {
      //Geef een offset mee aan de verschillende blokken + options
      var offset = new Cesium.Cartesian3(0, 0, 5);
      const resource = await Cesium.IonResource.fromAssetId(asset);
      this.tileset = await Cesium.Cesium3DTileset.fromUrl(resource);
      this.tileset.maximumScreenSpaceError = 1;
      this.tileset.maximumMemoryUsage = 2048;
      this.tileset.dynamicScreenSpaceError = true;
      this.tileset.skipLevelOfDetail = true;
      this.tileset.immediatelyLoadDesiredLevelOfDetail = true;
      this.tileset.baseScreenSpaceError = 2048;
      this.tileset.skipScreenSpaceErrorFactor = 32;
      this.tileset.dynamicScreenSpaceErrorHeightFalloff = 1;
      this.tileset.showCreditsOnScreen = true;
      this.tileset.showOutline = true;
      this.tileset.modelMatrix = Cesium.Matrix4.fromTranslation(offset)
      const newBuildingTileset = viewer.scene.primitives.add(this.tileset);
      // Navigeer camera naar asset(s)
      viewer.flyTo(newBuildingTileset);
    }
    this.deletePrimitive(viewer)

  }
  
  //Load Alle modellen Alkmaar
  public async loadModelsAlkmaar(viewer:Cesium.Viewer): Promise<void>  {
    for(const asset of this.alkmaarAssets) {
      //Geef een offset mee aan de verschillende blokken + options
      // var offset = new Cesium.Cartesian3(0, 0, 5);
      const resource = await Cesium.IonResource.fromAssetId(asset);
      this.tileset = await Cesium.Cesium3DTileset.fromUrl(resource);
      this.tileset.maximumScreenSpaceError = 1;
      this.tileset.maximumMemoryUsage = 2048;
      this.tileset.dynamicScreenSpaceError = true;
      this.tileset.skipLevelOfDetail = true;
      this.tileset.immediatelyLoadDesiredLevelOfDetail = true;
      this.tileset.baseScreenSpaceError = 2048;
      this.tileset.skipScreenSpaceErrorFactor = 32;
      this.tileset.dynamicScreenSpaceErrorHeightFalloff = 1;
      this.tileset.showCreditsOnScreen = true;
      this.tileset.showOutline = true;
      // this.tileset.modelMatrix = Cesium.Matrix4.fromTranslation(offset)
      const newBuildingTileset = viewer.scene.primitives.add(this.tileset);
      // Navigeer camera naar asset(s)
      viewer.flyTo(newBuildingTileset);
    }
    this.deletePrimitive(viewer)

  }

  //Load Alle modellen Nijmegen
  public async loadModelsNijmegen(viewer:Cesium.Viewer): Promise<void>  {
    
    for(const asset of this.nijmegenAssets) {
      //Geef een offset mee aan de verschillende blokken + options
      // var offset = new Cesium.Cartesian3(0, 0, 5);
      const resource = await Cesium.IonResource.fromAssetId(asset);
      this.tileset = await Cesium.Cesium3DTileset.fromUrl(resource);
      this.tileset.maximumScreenSpaceError = 1;
      this.tileset.maximumMemoryUsage = 2048;
      this.tileset.dynamicScreenSpaceError = true;
      this.tileset.skipLevelOfDetail = true;
      this.tileset.immediatelyLoadDesiredLevelOfDetail = true;
      this.tileset.baseScreenSpaceError = 2048;
      this.tileset.skipScreenSpaceErrorFactor = 32;
      this.tileset.dynamicScreenSpaceErrorHeightFalloff = 1;
      this.tileset.showCreditsOnScreen = true;
      this.tileset.showOutline = true;
      // this.tileset.modelMatrix = Cesium.Matrix4.fromTranslation(offset)
      const newBuildingTileset = viewer.scene.primitives.add(this.tileset);
      // Navigeer camera naar asset(s)
      viewer.flyTo(newBuildingTileset);
    }
    this.deletePrimitive(viewer)
  }


  //Haalt alle geladen assets op, speelt mee voor de performance slider in de visualisatie
  public getLoadedAssets(viewer): any {
    const primitivesArray = viewer.scene.primitives._primitives
    primitivesArray.forEach((element, index) => {
      if(index !==0) {
        this.loadedAssets.push(element)
      }
    });
    return this.loadedAssets;
  }
  
  //Verijderd alle ingeladen 3d modellen
  public deletePrimitive(viewer): void {
    viewer.scene.primitives.remove(viewer.scene.primitives._primitives[0])
  }
}
