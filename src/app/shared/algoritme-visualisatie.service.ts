import { Injectable, NgModule } from '@angular/core';
import * as Cesium from 'cesium';
import { Cartesian3, Viewer } from 'cesium';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { NsgiService } from './nsgi.service';
import { ETRS89MultiPoint } from './nsgi.service';
import { getDownloadURL, getStorage, ref } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})

export class AlgoritmeVisualisatieService {
  viewer: Cesium.Viewer
  firestore: firebase.firestore.Firestore;
  auth: firebase.auth.Auth;


  private shiftBemmel: number[] = [190207.765632, 434256.436386, 0.100021345];
  private shiftNijmegen: number[] = [182020.337747, 426907.992411, 0.190021345];
  private nijmegenBshift: number[] = [182044.848428, 426894.340495, 0.190021345]
  private shift: number[] = []
  isHovered: boolean = false;
  windows: any[] = []

    nsgiService: NsgiService;


  constructor(private ngsiService: NsgiService) {
  }

  //Laad de windows gevonden uit de firebase storage in het 3D model
  public async loadWindows(asset: Number, viewer: Cesium.Viewer): Promise<void> {
    try {
      const db = firebase.firestore();
      const collectionRef = db.collection('Algovisualisatietest');
      const querySnapshot = await collectionRef.get();
      //Haal algoritmedata vanaf de db
      querySnapshot.forEach(doc => {
        if (Number(doc.data()['assetId']) == asset) {
          const newWindow = {
            _id: Number(doc.data()['_id']),
            type: String(doc.data()['type']),
            class: String(doc.data()['class']),
            width: Number(doc.data()['width']),
            height: Number(doc.data()['height']),
            surfaceM2: Number(doc.data()['surfaceM2']),
            bottomLeft: doc.data()['bottomLeft'],
            topLeft: doc.data()['topLeft'],
            topRight: doc.data()['topRight'],
            bottomRight: doc.data()['bottomRight'],
          };
          this.windows.push(newWindow);
        }
      });
      //Error afhandeling
    } catch (error) {
      console.error('Error fetching data:', error);
    }
      // Zet de coordinaten van de windows om naar ETRS89 en visualiseer deze
      this.ngsiService.rdMultiPointToETRS89(this.windowCoordinatesToArray(asset)).subscribe({
        next: (value: ETRS89MultiPoint) => {
          for (let i = 0; i < (value.data.coordinates.length / 4); i++) {
            this.windows[i].bottomLeft = [...value.data.coordinates[i * 4 + 0]];
            this.windows[i].topLeft = [...value.data.coordinates[i * 4 + 1]];
            this.windows[i].topRight = [...value.data.coordinates[i * 4 + 2]];
            this.windows[i].bottomRight = [...value.data.coordinates[i * 4 + 3]];
          }
          this.visualizeWindows(viewer);
        },
        error: (err: any) => {
          console.log(err);
        },
      });
  
    }
  
    // Zet alle coordinaten van de windows in een twee dimensionale array
    private windowCoordinatesToArray(asset: Number): number[][] {
      //Kijkt io basis van switch case welke algoritmeresultaten geladen moeten worden.
      switch (asset) {
        case 1604370:
            this.shift = this.shiftBemmel;
            break;
        case 2273012:
            this.shift = this.nijmegenBshift;
            break;
        default:
            this.shift = this.shiftNijmegen;
            break;
      }
      //Zet alle coordinaten van de windows in een array zodat deze later gevisualiseerd kunnen worden.
      const coordinates: number[][] = [];
      for (let i = 0; i < this.windows.length; i++) {
        coordinates.push(
          [this.windows[i].bottomLeft[0] + this.shift[0], this.windows[i].bottomLeft[1] + this.shift[1], this.windows[i].bottomLeft[2] + this.shift[2]],
          [this.windows[i].topLeft[0] + this.shift[0], this.windows[i].topLeft[1] + this.shift[1], this.windows[i].topLeft[2] + this.shift[2]],
          [this.windows[i].topRight[0] + this.shift[0], this.windows[i].topRight[1] + this.shift[1], this.windows[i].topRight[2] + this.shift[2]],
          [this.windows[i].bottomRight[0] + this.shift[0], this.windows[i].bottomRight[1] + this.shift[1], this.windows[i].bottomRight[2] + this.shift[2]],
        );
      }
      return coordinates;
    }
    
    //Visualiseer windows van algoritmeresultaten in 3D model
    private visualizeWindows(viewer: Cesium.Viewer): void {    
      //Maakt van elke window in de array 3D punten en zet deze in de viewer
      for (let i = 0; i < this.windows.length; i++) {  
        const _window = this.windows[i];
        const bottomLeft: Cesium.Cartesian3 = Cesium.Cartographic.toCartesian(Cesium.Cartographic.fromDegrees(_window.bottomLeft[0], _window.bottomLeft[1], _window.bottomLeft[2]));
        const topLeft: Cesium.Cartesian3 = Cesium.Cartographic.toCartesian(Cesium.Cartographic.fromDegrees(_window.topLeft[0], _window.topLeft[1], _window.topLeft[2]));
        const topRight: Cesium.Cartesian3 = Cesium.Cartographic.toCartesian(Cesium.Cartographic.fromDegrees(_window.topRight[0], _window.topRight[1], _window.topRight[2]));
        const bottomRight: Cesium.Cartesian3 = Cesium.Cartographic.toCartesian(Cesium.Cartographic.fromDegrees(_window.bottomRight[0], _window.bottomRight[1], _window.bottomRight[2]));
        // Maakt polygon van algoresultaat
        const entity = viewer.entities.add({
          polygon: {
            hierarchy: new Cesium.PolygonHierarchy([
              bottomLeft,
              topLeft,
              topRight,
              bottomRight,
            ]),
            material: Cesium.Color.BLUE.withAlpha(0.6),
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            perPositionHeight: true,
          },
        });
        
        //Maakt een positie aan voor de text in het midden van de polygon
        const textPos: Cesium.Cartesian3 = new Cesium.Cartesian3(bottomLeft.x - ((bottomLeft.x - topRight.x) / 2.0), bottomLeft.y - ((bottomLeft.y - topRight.y) / 2.0), bottomLeft.z - ((bottomLeft.z - topRight.z) / 2.0));
        
        //Maakt de label aan die midden in het polygon wordt gevisualiserd
        const textEntity = viewer.entities.add({
          position: textPos,
          label: {
            text: _window._id.toString(),
            translucencyByDistance: new Cesium.NearFarScalar(1, 1.0, 600, 0.0),
            scale: 0.9,
            font: '15px sans-serif',
            backgroundColor: Cesium.Color.BLACK,
            fillColor: Cesium.Color.WHITE,
            showBackground: true,
            eyeOffset: new Cartesian3(undefined, undefined, -1),
            heightReference: 0,
          },
        });
        this.windows[i].labelId = textEntity.id;
        this.windows[i].oppervlakteId = entity.id;
      }
      // console.log(this.windows)
      this.hideAlgo(viewer);
    }
  
    //Inspecteer entity van dichtbij
    public goToEntity(id, visualizeId, viewer:Cesium.Viewer) {
      //Verkrijg label positie
      var label = viewer.entities.getById(id);
      var pos = label?.position?.getValue(Cesium.JulianDate.now())
     //Kijkt of de x,y,z waardes bestaan van label
      if (pos?.x !== undefined && pos?.y !== undefined && pos?.z !== undefined) {
        //Nieuwe camera positie op basis van input
        var cartesianPosition = new Cesium.Cartesian3(pos.x, pos.y, pos.z);
        if(visualizeId > 163) {
          //HPR van camera meegeven
          const heading = Cesium.Math.toRadians(-140);
          const pitch = Cesium.Math.toRadians(0.0);
          const range = 5.0;
          viewer.camera.lookAt(cartesianPosition, new Cesium.HeadingPitchRange(heading, pitch, range));
        } if(visualizeId >= 155 && visualizeId < 163) {
          //HPR van camera meegeven
          const heading = Cesium.Math.toRadians(40);
          const pitch = Cesium.Math.toRadians(0.0);
          const range = 5.0;
          viewer.camera.lookAt(cartesianPosition, new Cesium.HeadingPitchRange(heading, pitch, range));
  
        }
        if(visualizeId < 155){
           //HPR van camera meegeven
           const heading = Cesium.Math.toRadians(110);
           const pitch = Cesium.Math.toRadians(0.0);
           const range = 5.0;
           viewer.camera.lookAt(cartesianPosition, new Cesium.HeadingPitchRange(heading, pitch, range));
        }
        //Zorgt ervoor dat camera niet locked om een comment
        if (viewer.scene.mode !== Cesium.SceneMode.MORPHING) {
          var transform = Cesium.Matrix4.IDENTITY;
          viewer.camera.lookAtTransform(transform);
        }
      }
    }
  
    //Laat algoritme output zien (toggle)
    public showAlgo(viewer:Cesium.Viewer): void {
      for (let i = 0; i < this.windows.length; i++) {
        const oppervlakteId = this.windows[i].oppervlakteId;
        const labelId = this.windows[i].labelId;
        //Kijkt of waardes bestaan en visualiseerd deze als ze bestaan.
        if(oppervlakteId && labelId) {
         var entity = viewer.entities.getById(this.windows[i].oppervlakteId);
         var label = viewer.entities.getById(this.windows[i].labelId);
        if (entity !== undefined && label !== undefined) { 
          entity.show = true; 
          label.show = true; 
        }
      }
      }
    }
  
    //Laat algo output niet zien
    public hideAlgo(viewer: Cesium.Viewer): void {
      for (let i = 0; i < this.windows.length; i++) {
        const oppervlakteId = this.windows[i].oppervlakteId;
        const labelId = this.windows[i].labelId;
          //Kijkt of waardes bestaan en visualiseerd deze niet als ze bestaan.
        if(oppervlakteId && labelId) {
         var entity = viewer.entities.getById(this.windows[i].oppervlakteId);
         var label = viewer.entities.getById(this.windows[i].labelId);
        if (entity !== undefined && label !== undefined) { 
          entity.show = false
          label.show = false
        }
      }
    }
    }
  
    //Toggle voor algoritmeOutput visualisatie
    public toggleAlgo(viewer: Cesium.Viewer): void {
      for (let i = 0; i < this.windows.length; i++) {
        const oppervlakteId = this.windows[i].oppervlakteId;
        const labelId = this.windows[i].labelId;
        //Kijkt of waardes bestaan en visualiseerd deze wel of niet als ze bestaan.
        if(oppervlakteId && labelId) {
         var entity = viewer.entities.getById(this.windows[i].oppervlakteId);
         var label = viewer.entities.getById(this.windows[i].labelId);
        if (entity !== undefined && label !== undefined) { 
          entity.show = !entity.show;
          label.show = !label.show;
        }
      }
      }
    }

  
    //Geeft de user de mogelijkheid om de kleur van algo visualisatie aan te passen
     public changeColorAlgo(event: Event, oppervlakteId, viewer: Cesium.Viewer): void {
      const selectedOption = (event.target as HTMLSelectElement).value;
      const entity = viewer.entities.getById(oppervlakteId);
  
      //Kijkt of meegegeven entity bestaat
      if (entity && entity.polygon) {
        //Parameters voor kleuren in cesium
        var color = Cesium.Color.fromCssColorString(String(selectedOption));
        var opacity = 0.5; 
        color = color.withAlpha(opacity);
        var colorMaterial = new Cesium.ColorMaterialProperty(color);
        //Geeft entity nieuwe kleur
        entity.polygon.material = colorMaterial;
      }
    }
  
    //Download algo results
    async downloadAlgo(asset)  {
      //Maak storage variabele aan
      const storage = getStorage();
      const storageRef = ref(storage, 'Bemmel.csv')
      const storageRef2 = ref(storage, 'Nijmegen.csv')
      
      //Kijkt op basis van assetID welke algoresultaten hierbij horen.
      if(asset == 1604370) {
      try {
        const downloadURL = await getDownloadURL(storageRef);
        const link = document.createElement('a');
        link.href = downloadURL;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
       console.error('Kan de algoritme resultaten niet ophalen...', error);
     }
     } else {
       try {
         const downloadURL = await getDownloadURL(storageRef2);
         const link = document.createElement('a');
         link.href = downloadURL;
         link.target = '_blank';
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
       } catch (error) {
         console.error('Kan de algoritme resultaten niet ophalen...', error);
       }
     }
    }
}
