import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import { Router, RouterLink } from '@angular/router';
import { getStorage, ref, listAll } from "firebase/storage";
import { list } from 'rxfire/database';
import 'firebase/compat/storage'; // Let op de '/compat' toevoeging
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})


export class FireService {

  auth: firebase.auth.Auth;
  firestore: firebase.firestore.Firestore;
  storage: firebase.storage.Storage;
  url: "https://firebasestorage.googleapis.com/v0/b/droneview-a9817.appspot.com/o/Algoritmes%2Ftext.txt?alt=media&token=2d5d2587-fb7b-43fe-8911-96cf8bd5ec72"
  
  
  constructor(private router: Router, private _HTPP: HttpClient) { 
    this.auth = firebase.auth();
    this.firestore = firebase.firestore();
    this.storage = firebase.storage();
  }

  
  //Registreer functie mbh firebase
  public register(email: string, password: string): void {
    this.auth.createUserWithEmailAndPassword(email, password).then( () => {
      this.signOut();
    }, err => {
      alert(err.message);
    });
  }

  //Inlog functie met behulp van Firebase
  public signIn(email: string, password: string):void {
    this.auth.signInWithEmailAndPassword(email, password).then(res => {
      localStorage.setItem('token', 'true');
      this.router.navigate(['/dashboard']);
    }, err => {
      alert(err.message);
      this.router.navigate(['/login'])
    });
  }

  //uitlog functie met behulp van Firebase
  public signOut(): void {
    this.auth.signOut().then( () => {
      this.auth.currentUser?.delete;
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
    }, err => {
      alert(err.message);
    });
  }

  //Storage list alle files
  getCSVFile(): void {
    let listref = ref(this.storage, 'Algoritmes/')
    console.log(listAll(listref));
  
  }

  

}
