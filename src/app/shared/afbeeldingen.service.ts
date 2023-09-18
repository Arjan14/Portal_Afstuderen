import { Injectable } from '@angular/core';
import * as Cesium from 'cesium';
import { Cartesian3 } from 'cesium';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getStorage, listAll, ref } from 'firebase/storage';
import { HttpClient } from '@angular/common/http';

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
export class AfbeeldingenService {
  firestore: firebase.firestore.Firestore;
  storage: firebase.storage.Storage;

  constructor(private http: HttpClient) {
    this.firestore = firebase.firestore();
    this.storage = firebase.storage();
  }

  coordinatenFoto: any[][] = []
  firebaseImg: string
  matchingImageUrls: string[] = [];
  xmlData: string | null;
  xmlDataArray: string[] = [];
  coordinatenClick: any[][] = []

  //Foto's uit XML halen 
  public getXmlData(asset: Number): void {
    //Initieer firebase storage
    const storage = getStorage();
    const imageRef = ref(storage, '' + asset + '/');
    // Zet alle images van firebase in lijst
    listAll(imageRef)
      .then((result) => {
        const imagesStorage: string[] = result.items.map((itemRef) => itemRef.fullPath);

        // Haalt xml data op
        this.http.get('../../assets/xml/yprUdenhoutFB.xml', { responseType: 'text' }).subscribe((data) => {
          const parser = new DOMParser();
          const xml = parser.parseFromString(data, 'text/xml');
          const imagePaths = xml.querySelectorAll("ImagePath");
          // Gaat door alle images heen
          imagesStorage.forEach((element) => {
            for (let i = 0; i < imagePaths.length; i++) {
              const imageUrl = imagePaths[i].textContent;
              // Kijkt of de afbeelding in de XML staat
              if (element === imageUrl) {
                const coordImage = xml.getElementsByTagName('Center')[i * 2];
                const x = coordImage.getElementsByTagName('x')[0].textContent;
                const y = coordImage.getElementsByTagName('y')[0].textContent;
                const z = coordImage.getElementsByTagName('z')[0].textContent;
                //voegt de afbeelding en bijbehorende coordinaten toe aan de array
                this.coordinatenFoto.push([imageUrl, Number(x), Number(y), Number(z)]);
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('Error listing files in folder:', error);
      });
  }

  //Ga naar Locatie met camera met behulp van de XML (WIP)
  public goToPictureLocation(data: String, viewer: Cesium.Viewer): void {
    //Sliced de filename om te vergelijken met het XML
    const filename = data.substring(data.lastIndexOf("%2F") + 3, data.indexOf("?"));
    this.http.get('../../assets/xml/udenhoutAxml.xml', { responseType: 'text' }).subscribe((input) => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(input, 'text/xml');
      const imagePaths = xml.querySelectorAll("ImagePath");
      const numImagePaths = imagePaths.length;

      //Haalt alle imagePaths en bijbehorende coordinaten op vanuit een XML bestand
      for (let i = 1; i < numImagePaths; i++) {
        const imageUrl = xml.getElementsByTagName('ImagePath')[i].textContent;
        if (imageUrl?.endsWith(filename)) {
          const ypr = xml.getElementsByTagName('Rotation')[i];
          const newLongLat = xml.getElementsByTagName('Metadata')[i]
          const centerInfo = newLongLat.getElementsByTagName('Center')[0]
          const longTest = Number(centerInfo.getElementsByTagName('x')[0].textContent)
          const latTest = Number(centerInfo.getElementsByTagName('y')[0].textContent)
          const altTest = Number(centerInfo.getElementsByTagName('z')[0].textContent)
          const heading = Number(ypr.getElementsByTagName('Yaw')[0].textContent)
          const pitch = Number(ypr.getElementsByTagName('Pitch')[0].textContent)
          const roll = Number(ypr.getElementsByTagName('Roll')[0].textContent)

          //Navigeert camera naar de verkegen posities vanaf het xml
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(longTest, latTest, altTest + 2),
            orientation: {
              heading: heading * Math.PI / 180,
              pitch: pitch * Math.PI / 180,
              roll: roll * Math.PI / 180,
            }
          })
        }
      }
    })
  }
}
