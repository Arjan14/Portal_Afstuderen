import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {setTheme} from "ngx-bootstrap/utils";
import {Router} from '@angular/router';
import {ModelComponent} from "src/app/model/model.component";
import {FireService} from "../shared/fire.service";
import { Observable } from 'rxjs';
import { GoogleMap } from '@angular/google-maps';
import firebase from 'firebase/compat/app';
import { FirebaseStorage } from 'firebase/storage';
import { getStorage, ref, getDownloadURL } from '@firebase/storage';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  imageUrlInstructies: string
  imageUrlDrone: string
  username: string = "";
  password: string = "";
  mapCenter: google.maps.LatLngLiteral = { lat: -34.397, lng: 150.644 };
  mapZoom = 8;
  display: google.maps.LatLngLiteral;
  latitude = 51.678418;
  longitude = 51.678418;
  map: google.maps.Map
  viewableTable: boolean;
  auth: firebase.auth.Auth;

  constructor(private formBuilder: FormBuilder, private router: Router, public fireService: FireService) {
    this.auth = firebase.auth();
  }


  async ngOnInit() {

      //Stuurt user terug wanneer deze niet is ingelogd
      if(this.fireService.auth.currentUser == null) {
        this.router.navigate(['/login']);
      } 

      //Heeft user email nodig om weer te geven in de front-end
      if(this.fireService.auth.currentUser) {
        this.username = this.fireService.auth.currentUser.email!
      }

      //Google maps config.
      const mapOptions = {
        center: { lat:  51.694638326444, lng: 5.445165693110882 }, 
        zoom: 9,
        disableDefaultUI: true,
      };
  
      //google Map
      this.map = new google.maps.Map(
        document.getElementById('googleMap') as HTMLElement,
        mapOptions
      );

      //Markers voor op de google maps
      const bemmelMarker = new google.maps.Marker({
        position: {lat: 51.89583769790886, lng:5.898914706943712},
        map: this.map,
        title: 'Bemmel blok A'
      })

      const udenhoutMarker = new google.maps.Marker({
        position: {lat: 51.60987254378173, lng:5.1337594432610425},
        map: this.map,
        title: 'Udenhout'
      })

      const cappele1 = new google.maps.Marker({
        position: {lat: 51.933065676356314, lng: 4.56514131720447},
        map: this.map,
        title: 'Capelle flat'
      })

      const cappele2 = new google.maps.Marker({
        position: {lat: 51.93307180888899, lng: 4.565815223806953},
        map: this.map,
        title: 'Capelle flat'
      })

      const cappele3 = new google.maps.Marker({
        position: {lat: 51.932597320557036, lng: 4.565564961178663},
        map: this.map,
        title: 'Capelle flat'
      })

      const cappele4 = new google.maps.Marker({
        position: {lat: 51.93321705688334, lng: 4.568307622984045},
        map: this.map,
        title: 'Capelle flat'
      })

      const cappele5 = new google.maps.Marker({
        position: {lat: 51.933542479436454, lng: 4.567637402411073},
        map: this.map,
        title: 'Capelle flat'
      })

      const Cottwicherbrug = new google.maps.Marker({
        position: {lat: 52.251869783365564, lng: 6.649507296756615},
        map: this.map,
        title: 'Cottwicherbrug'
      })

      const EgmondMarker = new google.maps.Marker({
        position: {lat: 52.61927086024187,lng: 4.625428475100176},
        map: this.map,
        title: 'EgmondMarker'
      })

      //Dashboard image laden vanaf firestore
      const storage = getStorage(); // Initialize Firebase storage
      const imageRef = ref(storage, 'test3.jpg'); // Replace with the actual path to your image in Firebase Storage
      const imageRefDrone = ref(storage, 'M300Drone.jpg')

      try {
        this.imageUrlInstructies = await getDownloadURL(imageRef);
        this.imageUrlDrone = await getDownloadURL(imageRefDrone)
      } catch (error) {
        console.error('Error loading image:', error);
      }
  }
  
  //Asset inladen met behulp van assetID
  public loadAsset(assetId: number) {
    this.router.navigate(["model", {assetId: assetId}]);
  }

  //Portal handleiding met een knop weergeven in een nieuw scherm
  async downloadFile() {
    
    //Maak storage variabele aan
    const storage = getStorage();
    const storageRef = ref(storage, 'User manual portal-1.pdf')
    
    try {
      const downloadURL = await getDownloadURL(storageRef);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Kan de heindleiding niet ophalen...', error);
    }
  }


 

}
