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

export class AfstandService {
  firestore: firebase.firestore.Firestore;
  gemaakteEntiteiten: string[] = []
  afmetingenWaardes: Array<String> = []
  aantalAfmetingen: Array<Number> = []
  auth: firebase.auth.Auth;
  afmetingenArray: string[][] = [];
  viewer: Cesium.Viewer
  enabledMenu: Menu

  constructor() {
    this.firestore = firebase.firestore();
  }

  //Haal metingen op uit Firebase db
  public getMetingenData(viewer: Cesium.Viewer, assetId: Number): void {
    const afmetingenData = this.afmetingenArray;
    //Referentie naar firebase DB en collectie
    var db = firebase.firestore();
    var collectionRef = db.collection("Afstanden");
    //Haalt data op van de collectie
    collectionRef.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        // (check) laat alleen opmerkingen zien die bij het model horen
        if (Number(doc.data()['assetId']) == assetId) {
          // Haalt DB data op en zet in vatiabelen
          var coord1Datax = Number(doc.data()['x1'])
          var coord1Datay = Number(doc.data()['y1'])
          var coord1Dataz = Number(doc.data()['z1'])
          var coord2Datax = Number(doc.data()['x2'])
          var coord2Datay = Number(doc.data()['y2'])
          var coord2Dataz = Number(doc.data()['z2'])
          //Maakt punten (Cart3) met verkeregen data
          var pos1 = new Cartesian3(coord1Datax, coord1Datay, coord1Dataz)
          var pos2 = new Cartesian3(coord2Datax, coord2Datay, coord2Dataz)

          //Initialiseert de meetpunten aan met de verkregen data
          var meetpunt = viewer.entities.add({
            position: pos1,
            point: {
              pixelSize: 10,
              color: Cesium.Color.GOLD,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
            }
          });
          var meetpunt2 = viewer.entities.add({
            position: pos2,
            point: {
              pixelSize: 10,
              color: Cesium.Color.GOLD,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
            }
          });
          //Initialiseert polyline tussen de opgehaalde punten
          var lineEntity = viewer.entities.add({
            polyline: {
              positions: [pos1, pos2],
              width: 5,
              material: new Cesium.PolylineDashMaterialProperty({
                color: Cesium.Color.GOLD,
                dashLength: 75,
                gapColor: Cesium.Color.BLACK,
              }),
            }
          })
          //Calculeert het midden van de gegenereerde polyline voor de label positie
          let addedCart = new Cartesian3;
          Cartesian3.add(pos1, pos2, addedCart);
          let labelPos = new Cartesian3;
          Cartesian3.divideByScalar(addedCart, 2, labelPos)
          //Label met afstand tussen de 2 punten midden in de polyline
          var labelEntity = viewer.entities.add({
            position: labelPos,
            label: {
              text: String(doc.data()['afstand']),
              translucencyByDistance: new Cesium.NearFarScalar(1, 1.0, 600, 0.0),
              scale: 0.9,
              font: '15px sans-serif',
              backgroundColor: Cesium.Color.BLACK,
              fillColor: Cesium.Color.WHITE,
              showBackground: true,
              eyeOffset: new Cartesian3(undefined, undefined, -1),
              heightReference: 0,
            }
          })
          //Zet de opgehaalde (gegenereerde) data in een lijst voor de front-end
          afmetingenData.push([String(doc.id), String(pos1), String(pos2), doc.data()['user'], doc.data()['afstand'], meetpunt.id, meetpunt2.id, lineEntity.id, labelEntity.id])
        }
      });
      //Error afhandeling
    }).catch(function (error) {
      console.log("Error getting documents:", error);
    });
  }

  //Event handler om punten te plaatsen in Cesium
  public clickEventAfstand(viewer: Cesium.Viewer, userMail, assetId, enabledMenu, menu): void {
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    const metingenArray: Cartesian3[][] = []
    const metingenTijdelijkArray: Array<Cartesian3> = []
    var counter = 0

    //Handler voor klik in de viewer
    handler.setInputAction((movement: any) => {
      //Genereert positie op basis van clickpositie
      const pos: Cesium.Cartesian3 = viewer.scene.pickPosition(movement.position);
      //Check of menu measurement is ingeschakeld
      if (this.enabledMenu == Menu.MEASUREMENT) {
        console.log(enabledMenu)
        if (!pos) {
          alert('Deze positie kan niet geselecteerd worden, probeer opnieuw!');
          return;
        }
        //Genereert pointEntity op positie die is gelickd
        var pointEntity = viewer.entities.add({
          position: pos,
          point: {
            pixelSize: 10,
            color: Cesium.Color.GOLD,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
          }
        });
        //Voegt entity.id toe aan array
        this.gemaakteEntiteiten.push(pointEntity.id)
        metingenTijdelijkArray.push(pos)

        //Genereert polyline na 2 clicks (punten)
        if (counter % 2 == 1 && counter > 0) {
          const lastTwoValues: Cartesian3[] = metingenTijdelijkArray.slice(-2);
          metingenArray.push(lastTwoValues)
          //Als meer dan 2 punten zijn geselecteerd
          if (metingenArray.length >= 2) {
            metingenArray.shift()
          }
          //Creeert polyline tussen de 2 geselecteerde punten
          if (metingenArray.length = 1) {
            var lineEntity = viewer.entities.add({
              polyline: {
                positions: lastTwoValues,
                width: 5,
                material: new Cesium.PolylineDashMaterialProperty({
                  color: Cesium.Color.GOLD,
                  dashLength: 75,
                  gapColor: Cesium.Color.BLACK,
                }),
              }
            })
            this.gemaakteEntiteiten.push(lineEntity.id)
            //Afstanden tussen verschillende posities en de label in het midden van deze posities.
            let pos1 = new Cartesian3(lastTwoValues[0].x, lastTwoValues[0].y, lastTwoValues[0].z)
            let pos2 = new Cartesian3(lastTwoValues[1].x, lastTwoValues[1].y, lastTwoValues[1].z)
            let afstand = String(Math.round((Cartesian3.distance(pos2, pos1)) * 1000) / 1000 + " M")
            let addedCart = new Cartesian3;
            Cartesian3.add(pos1, pos2, addedCart);
            let labelPos = new Cartesian3;
            Cartesian3.divideByScalar(addedCart, 2, labelPos)
            //Label met afstand tussen de 2 punten midden in de polyline
            var labelEntity = viewer.entities.add({
              position: labelPos,
              label: {
                text: afstand,
                translucencyByDistance: new Cesium.NearFarScalar(1, 1.0, 600, 0.0),
                scale: 0.9,
                font: '15px sans-serif',
                backgroundColor: Cesium.Color.BLACK,
                fillColor: Cesium.Color.WHITE,
                showBackground: true,
                eyeOffset: new Cartesian3(undefined, undefined, -1),
                heightReference: 0,
              }
            })
            this.afmetingenWaardes.push(afstand);
            this.aantalAfmetingen.push(this.afmetingenWaardes.length)
            this.gemaakteEntiteiten.push(labelEntity.id)
            //Verkrijg de laatste 4 geplaatste id's van de entity's
            var lastFourValues = this.gemaakteEntiteiten.slice(-4);
            //Data naar DB
            var dateObj = new Date();
            var month = dateObj.getUTCMonth() + 1; //months from 1-12
            var day = dateObj.getUTCDate();
            var year = dateObj.getUTCFullYear();
            // afstanddata voor db
            const afstandenData = {
              x1: lastTwoValues[0].x,
              y1: lastTwoValues[0].y,
              z1: lastTwoValues[0].z,
              x2: lastTwoValues[1].x,
              y2: lastTwoValues[1].y,
              z2: lastTwoValues[1].z,
              afstand: afstand,
              assetId: assetId,
              user: userMail,
              date: day + "/" + month + "/" + year,
              ent1: lastFourValues[0],
              ent2: lastFourValues[1],
              ent3: lastFourValues[2],
              ent4: lastFourValues[3],
            }
            //Voegt gegenereerde data toe aan de firebase DB
            this.firestore.collection('Afstanden').add(afstandenData)
              .then((docRef) => {
                console.log('Comment added with ID: ', docRef.id);
                const id = docRef.id
                this.afmetingenArray.push([String(id), String(pos1), String(pos2), String(userMail), afstand, pointEntity.id, this.gemaakteEntiteiten[this.gemaakteEntiteiten.length - 4], lineEntity.id, labelEntity.id])
              })
              //Error afhandeling
              .catch((error) => {
                console.error('Error adding afmeting: ', error);
              });
            this.firestore.collection('Afstanden')
          }
        }
      }
      counter++
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //Navigeert naar de meting die is gedaan of in de tabel staat
  public checkMeting(id, viewer: Cesium.Viewer): void {
    //Verkrijg label positie
    var label = viewer.entities.getById(id[8]);
    var pos = label?.position?.getValue(Cesium.JulianDate.now())
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

  //Download alle metingen in Excel bestand
  public downloadMeting(assetId: Number): void {
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(this.afmetingenArray);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'Meetdata' + assetId + '.xlsx');
  }

  //Het aan en uit kunnen zetten van metingen in een model
  public displayMeting(viewer: Cesium.Viewer): void {
    //Loop waarbij alle metingen aan of uit worden gezet
    this.afmetingenArray.forEach(element => {
      //Haalt entity ID's op (4)
      var label = viewer.entities.getById(element[5]);
      var point1 = viewer.entities.getById(element[6]);
      var point2 = viewer.entities.getById(element[7]);
      var line = viewer.entities.getById(element[8]);
      //Verijderd de entity's wanneer zij bestaan
      if (label && point1 && point2 && line) {
        label.show = !label.show;
        point1.show = !point1.show;
        point2.show = !point2.show;
        line.show = !line.show;
      }
    })
  }

  //Haalt alle metingen uit de DB en uit het 3D model
  public deleteAllMeting(viewer: Cesium.Viewer): void {
    //Maakt connectie met DB
    const collectionRef = this.firestore.collection('Afstanden');
    //Gaat door de lijst met afmetingen
    this.afmetingenArray.forEach(element => {
      //Delete elke ID uit de DB
      collectionRef.doc(element[0]).delete()
        .then(() => {
          this.afmetingenArray.forEach((element, index) => {
            //Haalt uit lijst
            this.afmetingenArray.splice(index, 1);
            //Haalt entity ID's op
            var point1 = viewer.entities.getById(element[5]);
            var point2 = viewer.entities.getById(element[6]);
            var point3 = viewer.entities.getById(element[7]);
            var point4 = viewer.entities.getById(element[8]);
            //Verijderd de entity's wanneer zij bestaan
            if (point1 && point2 && point3 && point4) {
              viewer.entities.remove(point1);
              viewer.entities.remove(point2);
              viewer.entities.remove(point3);
              viewer.entities.remove(point4);
            }
          });
        })
        .catch((error) => {
          console.error('Kan entity niet verwijderen: ', error);
        });
    });
  }

  //Delete meting afzonderlijk
  public deleteAfmeting(id, viewer: Cesium.Viewer): void {
    //Maakt connectie met DB
    const collectionRef = this.firestore.collection('Afstanden');
    //Delete entity met meegegeven ID van DB
    collectionRef.doc(id).delete()
      .then(() => {
        this.afmetingenArray.forEach((element, index) => {
          //Checkt of meegegeven ID gelijk is aan DB id
          if (element[0] == id) {
            this.afmetingenArray.splice(index, 1);
            var label = viewer.entities.getById(element[5]);
            var point1 = viewer.entities.getById(element[6]);
            var point2 = viewer.entities.getById(element[7]);
            var line = viewer.entities.getById(element[8]);
            //Kijkt of entity's bestaan
            if (point1 && point2 && line && label) {
              viewer.entities.remove(point1);
              viewer.entities.remove(point2);
              viewer.entities.remove(label);
              viewer.entities.remove(line);
            }
          }
        });
        alert("Afmeting met ID: " + id + ', verwijderd!')
      })
      .catch((error) => {
        console.error('Kan meting niet verwijderen: ', error);
      });
  }
}
