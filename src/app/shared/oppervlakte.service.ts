import { Injectable, NgModule } from '@angular/core';
import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import * as XLSX from 'xlsx';

//Menu tabbladen ENUM
export enum Menu {
  NONE = 'NONE',
  MEASUREMENT = 'MEASUREMENT',
  PERFORMANCE = 'PERFORMANCE',
  WINDOWS = 'WINDOWS',
  PICTURES = 'PICTURES',
  POINTS = 'POINTS',
  OPPERVLAKTES = 'OPPERVLAKTES',
  MESSAGE = 'MESSAGE',
  PEN = 'PEN',
  MJOP = 'MJOP',
  STEIGER = 'STEIGER'
}

@Injectable({
  providedIn: 'root'
})

export class OppervlakteService {
  firestore: firebase.firestore.Firestore;
  oppervlakteDBValues: string[][] = [];
  gemaakteEntiteiten: string[] = []
  gemaakteOppervlaktes: string[] = []
  gemaakteEntiteitenOppervlakte: string[] = []
  oppervlakteWaardes: Array<Number> = []
  enabledMenu: Menu

  constructor() {
    this.firestore = firebase.firestore();
  }

  //Aanmaken van een oppervlakte meting
  public clickEventOppervlakte(viewer: Cesium.Viewer, assetId: number, userMail): void {
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const metingenTijdelijkArray: Array<Cartesian3> = []
    var counter = 1;

    //Vekrijg geklikt punt door gebruiker
    handler.setInputAction((movement: any) => {
      const pos: Cesium.Cartesian3 = viewer.scene.pickPosition(movement.position);
      if (this.enabledMenu == Menu.OPPERVLAKTES) {
        if (!pos) {
          alert('Deze positie kan niet geselecteerd worden, probeer opnieuw!');
          return;
        }
        // Maakt 4 punten aan waar tussen gemeten moet worden.
        var hoekPunt = viewer.entities.add({
          position: pos,
          point: {
            pixelSize: 10,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
          }
        });
        //Zet punten in lijst om te kunnen togglen of verwijderen
        this.gemaakteOppervlaktes.push(hoekPunt.id)
        metingenTijdelijkArray.push(pos)
        console.log(counter)
        //Wanneer 4 punten zijn gemaakt genereer polygon
        if (counter % 4 == 0) {
          console.log('heij')
          var point1 = new Cesium.Cartesian3(metingenTijdelijkArray[0].x, metingenTijdelijkArray[0].y, metingenTijdelijkArray[0].z,)
          var point2 = new Cesium.Cartesian3(metingenTijdelijkArray[1].x, metingenTijdelijkArray[1].y, metingenTijdelijkArray[1].z,)
          var point3 = new Cesium.Cartesian3(metingenTijdelijkArray[2].x, metingenTijdelijkArray[2].y, metingenTijdelijkArray[2].z,)
          var point4 = new Cesium.Cartesian3(metingenTijdelijkArray[3].x, metingenTijdelijkArray[3].y, metingenTijdelijkArray[3].z,)
          var hierarchy = new Cesium.PolygonHierarchy([point1, point2, point3, point4]);
          //Genereer polygon tussen de 4 hoekpunten dmv. een hierarchy
          const polyGon4punt = viewer.entities.add({
            polygon: {
              hierarchy: hierarchy,
              material: Cesium.Color.RED.withAlpha(0.5),
              perPositionHeight: true,
            },
          });
          //Zet polygon in lijst om te kunnen togglen of verwijderen
          this.gemaakteOppervlaktes.push(polyGon4punt.id)
          // Vector van elk hoekpunt (nodig voor berekening)
          const edge1 = Cesium.Cartesian3.subtract(point2, point1, new Cesium.Cartesian3());
          const edge2 = Cesium.Cartesian3.subtract(point3, point2, new Cesium.Cartesian3());
          const edge3 = Cesium.Cartesian3.subtract(point4, point3, new Cesium.Cartesian3());
          const edge4 = Cesium.Cartesian3.subtract(point1, point4, new Cesium.Cartesian3());
          //Wiskunde
          const crossProduct1 = Cesium.Cartesian3.cross(edge1, edge2, new Cesium.Cartesian3());
          const crossProduct2 = Cesium.Cartesian3.cross(edge2, edge3, new Cesium.Cartesian3());
          // Bereken het oppervlakte van de polygon
          const surfaceArea = (Cesium.Cartesian3.magnitude(crossProduct1) + Cesium.Cartesian3.magnitude(crossProduct2)) / 2;
          //Rond surfacearea af
          this.oppervlakteWaardes.push(Math.round(surfaceArea * 100) / 100)
          //Geef de entiteiten.ids mee aan array
          var lastFiveValues = this.gemaakteOppervlaktes.slice(-5);
          //Oppervlakte meegeven aan DB
          const oppervlakteData = {
            assetId: assetId,
            user: userMail,
            oppervlakte: Math.round(surfaceArea * 100) / 100,
            punt1_x: metingenTijdelijkArray[0].x,
            punt1_y: metingenTijdelijkArray[0].y,
            punt1_z: metingenTijdelijkArray[0].z,
            punt2_x: metingenTijdelijkArray[1].x,
            punt2_y: metingenTijdelijkArray[1].y,
            punt2_z: metingenTijdelijkArray[1].z,
            punt3_x: metingenTijdelijkArray[2].x,
            punt3_y: metingenTijdelijkArray[2].y,
            punt3_z: metingenTijdelijkArray[2].z,
            punt4_x: metingenTijdelijkArray[3].x,
            punt4_y: metingenTijdelijkArray[3].y,
            punt4_z: metingenTijdelijkArray[3].z,
            ent1: lastFiveValues[0],
            ent2: lastFiveValues[0],
            ent3: lastFiveValues[0],
            ent4: lastFiveValues[0],
            ent5: lastFiveValues[0],
          }

          //Zet gemeten oppervlakte in Firebase DB
          this.firestore.collection('Oppervlaktes').add(oppervlakteData)
            .then((docRef) => {
              console.log('Oppervlakte added with ID: ', docRef.id);
              const id = docRef.id
              this.oppervlakteDBValues.push([String(id), String(userMail), String(Math.round(surfaceArea * 100) / 100), lastFiveValues[0], lastFiveValues[1], lastFiveValues[2], lastFiveValues[3], lastFiveValues[4]])
            })
            //Error afhandeling
            .catch((error) => {
              console.error('Error adding afmeting: ', error);
            });

          //Haal waardes uit de array (maak even korter)
          metingenTijdelijkArray.shift()
          metingenTijdelijkArray.shift()
          metingenTijdelijkArray.shift()
          metingenTijdelijkArray.shift()
        }
      }
      counter++
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //Haal gemeten oppervlaktes op uit Firebase db
  public getOppervlakteData(viewer: Cesium.Viewer, assetId: number): void {
    // Maak connectie met firestore db en collectie
    var db = firebase.firestore();
    var collectionRef = db.collection("Oppervlaktes");
    const oppervlakteData = this.oppervlakteDBValues;
    //Haal data op vanuit db en maakt (hoek)punten
    collectionRef.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        //Maak punten met data vanuit db wanneer assetid gelijk is
        if (Number(doc.data()['assetId']) == assetId) {
          var punt1Coord = new Cartesian3(Number(doc.data()['punt1_x']), Number(doc.data()['punt1_y']), Number(doc.data()['punt1_z']))
          var punt2Coord = new Cartesian3(Number(doc.data()['punt2_x']), Number(doc.data()['punt2_y']), Number(doc.data()['punt2_z']))
          var punt3Coord = new Cartesian3(Number(doc.data()['punt3_x']), Number(doc.data()['punt3_y']), Number(doc.data()['punt3_z']))
          var punt4Coord = new Cartesian3(Number(doc.data()['punt4_x']), Number(doc.data()['punt4_y']), Number(doc.data()['punt4_z']))
          var hierarchy = new Cesium.PolygonHierarchy([punt1Coord, punt2Coord, punt3Coord, punt4Coord]);
          //De verschillende punten waarin het polygon verschijnt (hoekpunten)
          var meetpunt1 = viewer.entities.add({
            position: punt1Coord,
            point: {
              pixelSize: 10,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
            }
          });
          var meetpunt2 = viewer.entities.add({
            position: punt2Coord,
            point: {
              pixelSize: 10,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
            }
          });
          var meetpunt3 = viewer.entities.add({
            position: punt3Coord,
            point: {
              pixelSize: 10,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
            }
          });
          var meetpunt4 = viewer.entities.add({
            position: punt4Coord,
            point: {
              pixelSize: 10,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
            }
          });
          //Initialiseer polygon tussen de 4 hoekpunten
          var polygon = viewer.entities.add({
            polygon: {
              hierarchy: hierarchy,
              material: Cesium.Color.RED.withAlpha(0.5),
              perPositionHeight: true,
            },
          });
          //Voeg toe aan de Array, zodat deze in de lijst verschijnt
          oppervlakteData.push([String(doc.id), doc.data()['user'], doc.data()['oppervlakte'], meetpunt1.id, meetpunt2.id, meetpunt3.id, meetpunt4.id, polygon.id])

        }
      })
    })
  }

  //Verwijderd de oppervlakte op basis van ID
  public deleteOppervlakte(id: string, viewer: Cesium.Viewer): void {
    //Maakt connectie met firebase DB
    const collectionRef = this.firestore.collection('Oppervlaktes');
    //Delete entity met meegegeven ID van DB
    collectionRef.doc(id).delete()
      .then(() => {
        this.oppervlakteDBValues.forEach((element, index) => {
          //Checkt of meegegeven ID gelijk is aan DB id
          if (element[0] == id) {
            this.oppervlakteDBValues.splice(index, 1);
            //Zet de entity's in variabelen.
            var punt1 = viewer.entities.getById(element[3])
            var punt2 = viewer.entities.getById(element[4])
            var punt3 = viewer.entities.getById(element[5])
            var punt4 = viewer.entities.getById(element[6])
            var polygon = viewer.entities.getById(element[7])
            //Kijkt of de punten bestaan en verwijderd deze.
            if (punt1 && punt2 && punt3 && punt4 && polygon) {
              viewer.entities.remove(punt1)
              viewer.entities.remove(punt2)
              viewer.entities.remove(punt3)
              viewer.entities.remove(punt4)
              viewer.entities.remove(polygon)
            }

          }
        });
        alert("Oppervlakte met ID: " + id + ', verwijderd!')
      })
      //Error afhandeling
      .catch((error) => {
        console.error('Kan oppervlakte niet verwijderen: ', error);
      });
  }

  //Haalt alle gemeten oppervlaktes van een bepaalde asset uit de db en visualisatie
  public deleteAllOppervlakte(viewer: Cesium.Viewer): void {
    //Maakt connectie met DB
    const collectionRef = this.firestore.collection('Oppervlaktes');
    //Gaat door de lijst met afmetingen
    this.oppervlakteDBValues.forEach(element => {
      //Delete elke ID uit de DB
      collectionRef.doc(element[0]).delete()
        .then(() => {
          this.oppervlakteDBValues.forEach((element, index) => {
            //Haalt uit lijst
            this.oppervlakteDBValues.splice(index, 1);
            //Haalt entity ID's op
            var point1 = viewer.entities.getById(element[3]);
            var point2 = viewer.entities.getById(element[4]);
            var point3 = viewer.entities.getById(element[5]);
            var point4 = viewer.entities.getById(element[6]);
            var polygon = viewer.entities.getById(element[7]);
            //Verijderd de entity's wanneer zij bestaan
            if (point1 && point2 && point3 && point4 && polygon) {
              viewer.entities.remove(point1);
              viewer.entities.remove(point2);
              viewer.entities.remove(point3);
              viewer.entities.remove(point4);
              viewer.entities.remove(polygon);
            }
          });
        })
        //Error afhandeling
        .catch((error) => {
          console.error('Kan entity (opp) niet verwijderen: ', error);
        });
    });
  }

  //Laat oppervlaktes zien met toggle
  public displayOppervlakte(viewer: Cesium.Viewer): void {
    //Loop waarbij alle metingen aan of uit worden gezet
    this.oppervlakteDBValues.forEach(element => {
      var point1 = viewer.entities.getById(element[3]);
      var point2 = viewer.entities.getById(element[4]);
      var point3 = viewer.entities.getById(element[5]);
      var point4 = viewer.entities.getById(element[6]);
      var polygon = viewer.entities.getById(element[7]);
      //Wanneer deze entiteiten bestaan zet aan/uit
      if (point1 && point2 && point3 && point4 && polygon) {
        point1.show = !point1.show;
        point2.show = !point2.show;
        point3.show = !point3.show;
        point4.show = !point4.show;
        polygon.show = !polygon.show;
      }
    })
  }

  //Download gemeten oppervlakte data en zet in excel bestand
  public downloadOppervlakte(assetId: number): void {
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.oppervlakteDBValues);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Oppervlaktedata' + assetId + '.xlsx');
  }

  //Camera navigeert naar geselecteerde oppervlakte
  public checkOppervlakte(id, viewer: Cesium.Viewer): void {
    //Verkrijg label positie
    var polygon = viewer.entities.getById(id[3]);
    var pos = polygon?.position?.getValue(Cesium.JulianDate.now())
    //Kijkt of de x,y,z waardes bestaan van label
    if (pos?.x !== undefined && pos?.y !== undefined && pos?.z !== undefined) {
      //Nieuwe camera positie op basis van input
      var cartesianPosition = new Cesium.Cartesian3(pos.x, pos.y, pos.z);
      //HPR van camera meegeven
      const heading = Cesium.Math.toRadians(50.0);
      const pitch = Cesium.Math.toRadians(-90.0);
      const range = 5.0;
      viewer.camera.lookAt(cartesianPosition, new Cesium.HeadingPitchRange(heading, pitch, range));
      //Zorgt ervoor dat camera niet locked om een comment
      if (viewer.scene.mode !== Cesium.SceneMode.MORPHING) {
        var transform = Cesium.Matrix4.IDENTITY;
        viewer.camera.lookAtTransform(transform);
      }
    }
  }
}
