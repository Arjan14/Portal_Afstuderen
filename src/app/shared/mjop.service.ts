import { Injectable } from '@angular/core';

import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import * as XLSX from 'xlsx';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

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

export class MjopService {
  firestore: firebase.firestore.Firestore;
  textareaValue: string = '';
  numberInputValue: number | null = null;
  MJOP_Window:boolean = false
  mjopArray: string[][] = [];

  constructor() { 
    this.firestore = firebase.firestore();
  }

  //Haalt comment data op na het inladen van het model
  public getMJOPData(viewer:Cesium.Viewer, assetId: Number): void {
      //Referentie naar firebase DB
      var db = firebase.firestore();
      const mjopData = this.mjopArray;
      //Referentie naar collectie in DB
      var collectionRef = db.collection("Mjop");
      //Haalt data op van de collectie
      collectionRef.get().then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
          //Check dat comments bij correcte asset worden ingeladen
          if(Number(doc.data()['modelId']) == assetId) {
              var mjopValue = String([doc.data()['mjopText']])
              var mjopValue2 = String([doc.data()['mjopValue']])
              var mjopValue3 = String([doc.data()['user']])
              var mjopValue4 = String([doc.data()['date']])
              //Zet de waardes in de mjopDataArray voor frontend
              mjopData.unshift([doc.id, mjopValue, mjopValue2, mjopValue3, mjopValue4])
        }
        });
        //Error afhandeling
      }).catch(function(error) {
        console.log("Error getting documents:", error);
      });      
  }
  
  //MJOP Data naar Firebase DB
  public mjopToDB(user, assetId: Number, textareaValue: string, numberInputValue): void {
    //Datum initialisatie 
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    //Wanneer numberinputvalue leeg blijft == 4
    if(numberInputValue == null)  {
      numberInputValue = 4 
    }
    //Preset voor MJOP Data
    const mjopData = {
      mjopText: textareaValue,
      mjopValue: numberInputValue,
      modelId: assetId,
      user: user,
      date: day + "/" + month + "/" + year,
    }
    //Haalt venster weg
    this.MJOP_Window = false;
    //Voegt MJOP Data toe aan firebase 
    this.firestore.collection('Mjop').add(mjopData)
    .then((docRef) => {
      console.log('MJOP added with ID: ', docRef.id);
      const id = docRef.id
      this.mjopArray.push([id, textareaValue, String(numberInputValue), String(user), String(day + "/" + month + "/" + year)])

    })
    //Error afhandeling
    .catch((error) => {
      console.error('Error adding MJOP: ', error);
    });

  }
  
  //Maakt PDF van MJOP waardes
   public createPDF(assetId: number): void {
    //Check of er MJOP data is
    if (this.mjopArray.length > 0) {
      //PDF outline
      const documentDefinition = {
        content: [
          { text: 'MJOP voor model: ' + assetId, style: 'header' },
          '\n', // Add a newline
          {
            table: {
              headerRows: 1,
              // widths: [ 'auto', 'auto', 'auto', 'auto', 'auto'],
              body: [
                ['Code', 'Opmerking', 'Kwaliteitscore', 'Gebruiker', 'Datum'],
                ...this.mjopArray.map(row => [...row]),
              ],
            },
          },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
          },
        },
      };
      //Genereer PDF
      pdfMake.createPdf(documentDefinition).download('mjop' + assetId + '_.pdf');
    } else {
      alert('Er zijn geen MJOP')
    }
  }

  //Delete MJOP op basis van doc.ID
  public deleteMJOP(input): void {
    //Referentie naar MJOP collecite
    const collectionRef = this.firestore.collection('Mjop');
    //Delete uit collectie op basis van doc.id
    collectionRef.doc(input).delete()
      .then(()=> {
        this.mjopArray.forEach((element, index) => {
          if(element[0]==input) {
            this.mjopArray.splice(index, 1);
          }
        });
        //Notificatie verwijdering
        alert("Mjop met ID: " + input + ', verwijderd!')
      })
      //Error afhandeling
      .catch((error) => {
        console.error('Error deleting document: ', error);
      });
  }
}
