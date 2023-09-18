import { Injectable, NgModule } from '@angular/core';
import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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

export class CommentsService {

  firestore: firebase.firestore.Firestore;

  constructor() {
    this.firestore = firebase.firestore();
  }

  commentArray: string[][] = [];
  commentEntID: string[][] = [];
  showCommentWindow: boolean = true
  enabledMenu: Menu

  //Haalt comment data op na het inladen van het model
  public getCommentData(viewer: Cesium.Viewer, assetId: Number): void {
    // Referentie naar firestore
    var db = firebase.firestore();
    const commentData = this.commentArray;

    // Referentie naar collectie comments
    var collectionRef = db.collection("Comments");

    // Haalt de data op van comments
    collectionRef.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {

        // Laat alleen opmerkingen zien die bij het model horen
        if (Number(doc.data()['modelID']) == assetId) {
          var coordDatax = Number(doc.data()['commentCoord_x'])
          var coordDatay = Number(doc.data()['commentCoord_y'])
          var coordDataz = Number(doc.data()['commentCoord_z'])

          // Zet de comment bovenaan in de lijst
          commentData.unshift([doc.id, doc.data()['commentValue'], doc.data()['commentProfile'], doc.data()['date']])

          // Entiteit voor comment
          viewer.entities.add({
            position: new Cartesian3(coordDatax, coordDatay, coordDataz),
            id: doc.id,
            billboard: {
              image: "../../assets/circleMarker.png",
              show: true,
              eyeOffset: new Cartesian3(undefined, undefined, -1),
              scale: 0.6,
              width: 100,
              height: 100,
              sizeInMeters: false,
              translucencyByDistance: new Cesium.NearFarScalar(1, 1.0, 600, 0.0),

            },
          });

          // Entiteit voor comment
          viewer.entities.add({
            position: new Cartesian3(coordDatax, coordDatay, coordDataz),
            id: doc.id + 1,
            label: {
              text: (doc.id).substring(0, 4),
              translucencyByDistance: new Cesium.NearFarScalar(1, 1.0, 600, 0.0),
              scale: 0.6,
              font: '12px sans-serif',
              fillColor: Cesium.Color.WHITE,
              showBackground: true,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.9),
              eyeOffset: new Cartesian3(undefined, -0.03, -1),
              heightReference: 0,
            }
          })

        }
      });
      // Error catch
    }).catch(function (error) {
      console.log("Error getting documents:", error);
    });
  }

  //Navigeren naar een comment met de camera
  public viewComment(input, viewer: Cesium.Viewer): void {
    // Referentie naar firestore
    var db = firebase.firestore();
    var collectionRef = db.collection('Comments')
    // Coordinaten voor view
    var coordX, coordY, coordZ: number
    // Koppel comment data aan coordinaten
    collectionRef.get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        if (input == doc.id) {
          coordX = Number(doc.data()['commentCoord_x']);
          coordY = Number(doc.data()['commentCoord_y']);
          coordZ = Number(doc.data()['commentCoord_z']);
        }
      });
      // Check if all coordinates are defined before positioning the camera
      if (coordX !== undefined && coordY !== undefined && coordZ !== undefined) {
        //Nieuwe camera positie op basis van input
        var cartesianPosition = new Cesium.Cartesian3(coordX, coordY, coordZ);
        //HPR aan camera meegeven
        const heading = Cesium.Math.toRadians(50.0);
        const pitch = Cesium.Math.toRadians(-90.0);
        const range = 5.0;
        viewer.camera.lookAt(cartesianPosition, new Cesium.HeadingPitchRange(heading, pitch, range));
        // Camera unlocken na inspecteren
        if (viewer.scene.mode !== Cesium.SceneMode.MORPHING) {
          var transform = Cesium.Matrix4.IDENTITY;
          viewer.camera.lookAtTransform(transform);
        }
      }
    });
  }

  // Add comment in viewer na het plaatsen
  public addCommentData(viewer: Cesium.Viewer, docId): void {
    // Referentie naar firestore
    var db = firebase.firestore();
    const commentData = this.commentArray;
    // Referentie naar collectie
    var collectionRef = db.collection("Comments");
    // Haal data op van collectie
    collectionRef.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        // laat alleen opmerkingen zien die bij het model horen
        if (doc.id == docId) {
          // Koppel data aan variabel
          var coordDatax = Number(doc.data()['commentCoord_x'])
          var coordDatay = Number(doc.data()['commentCoord_y'])
          var coordDataz = Number(doc.data()['commentCoord_z'])
          //Zet de comment bovenaan in de lijst
          commentData.unshift([doc.id, doc.data()['commentValue'], doc.data()['commentProfile'], doc.data()['date']])
          //Comment entiteit
          viewer.entities.add({
            position: new Cartesian3(coordDatax, coordDatay, coordDataz),
            id: docId + 1,
            billboard: {
              // id: doc.id.toString(),
              image: "../../assets/circleMarker.png",
              show: true,
              eyeOffset: new Cartesian3(undefined, undefined, -1),
              scale: 0.6,
              width: 100,
              height: 100,
              sizeInMeters: false,
              translucencyByDistance: new Cesium.NearFarScalar(1, 1.0, 600, 0.0),
            },
          });
          // Comment entiteit
          viewer.entities.add({
            position: new Cartesian3(coordDatax, coordDatay, coordDataz),
            id: docId,
            label: {
              text: (doc.id).substring(0, 4),
              translucencyByDistance: new Cesium.NearFarScalar(1, 1.0, 600, 0.0),
              scale: 0.6,
              font: '12px sans-serif',
              fillColor: Cesium.Color.WHITE,
              showBackground: true,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.9),
              eyeOffset: new Cartesian3(undefined, -0.03, -1),
              heightReference: 0,
            }
          })
        }
      });
      // Error catch
    }).catch(function (error) {
      console.log("Error getting documents:", error);
    });
    // Voeg comment toe aan entiteiten lijst voor verwijderen
    this.commentEntID.push(docId)
    this.showCommentWindow = true
  }

  //Delete comment met ID
  public deleteComment(input, viewer: Cesium.Viewer): void {
    // Referentie naar collectie comments
    const collectionRef = this.firestore.collection('Comments');
    // Delete uit comments met input ID
    collectionRef.doc(input).delete()
      .then(() => {
        this.commentArray.forEach((element, index) => {
          if (element[0] == input) {
            this.commentArray.splice(index, 1);
          }
        });
        // Comment verwijderd
        alert("Comment met ID: " + input + ', verwijderd!')
      })
      .catch((error) => {
        console.error('Error deleting document: ', error);
      });

    // Haalt comments uit entiteiten lijst
    viewer.entities.removeById(input);
    viewer.entities.removeById(input + 1);
    }
}
