
import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Viewer, Cartesian3, Color } from 'cesium';
import { environment } from 'src/environments/environment';
import * as Cesium from 'cesium';
import firebase from 'firebase/compat/app';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FireService } from '../shared/fire.service';
import { CommentsService } from '../shared/comments.service';
import { OppervlakteService } from '../shared/oppervlakte.service';
import { MjopService } from '../shared/mjop.service';
import { AfstandService } from '../shared/afstand.service';
import { LoadingService } from '../shared/loading.service';
import 'firebase/compat/storage'; // Let op de '/compat' toevoeging
import 'firebase/compat/firestore';
import { getStorage, ref, listAll, list, getDownloadURL } from "firebase/storage";
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
import {NsgiService } from '../shared/nsgi.service';
import { AlgoritmeVisualisatieService } from '../shared/algoritme-visualisatie.service';
import { AfbeeldingenService } from '../shared/afbeeldingen.service';
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

@Component({
  selector: 'app-cesium-map',
  templateUrl: './cesium-map.component.html',
  styleUrls: ['./cesium-map.component.scss']
})

export class CesiumMapComponent implements OnInit, AfterViewInit, OnChanges {

  //Basic asset nummer
  @Input() assetId: number = -1;

  //CesiumJS map
  @ViewChild("cesiumMap") el!: ElementRef;

  //Algemene variabelen
  viewer: Viewer;
  enabledMenu: Menu = Menu.NONE;
  initalizedViewer: boolean = false;
  loadedAssets:any = []
  menuOption: Menu
  windows: any[] = []
  isHovered = false;

  //Het veranderen van kleuren
  geselecteerdeKleur: string

  //Laat een div wel of niet zien (naam aanpassen)
  showAlgoVisualisatie: boolean = false;
  showAfbeeldingen: boolean = false;
  showSteigerEnt: boolean = false;

  // Voor afbeeldingen vanuit XML
  xmlData: string | null;
  xmlDataArray: string[] = [];
  coordinatenClick: any[][] = []
  afmetingenArray: string[][] = [];
  firebaseImg: string
  matchingImageUrls: string[] = [];
  coordinatenFoto: any[][] = []
  imageUrl: string = ''; 


  // Voor MJOP recensies
  mjopArray: string[][] = [];
  textareaValue: string = '';
  numberInputValue: number | null = null;
  MJOP_Window:boolean = false


  //Voor meten
  afmetingenWaardes: Array<String> = []
  aantalAfmetingen: Array<Number> = []
  oppervlakteWaardes: Array<Number> = []

  //Entiteiten
  gemaakteEntiteiten: string[] = []
  gemaakteOppervlaktes: string[] = []
  gemaakteEntiteitenOppervlakte: string[] = []

  //Error value voor Screenspaceerror
  errorValue: number = 0

  //Comments
  showCommentWindow:boolean = true
  pointSelected: boolean = false;
  commentCoordx : string
  commentCoordy : string
  commentCoordz : string
  commentWindow:boolean = false
  commentArray: string[][] = [];
  commentEntID: string[][] = [];

  //Firebase
  auth: firebase.auth.Auth;
  firestore: firebase.firestore.Firestore;
  storage: firebase.storage.Storage;
  oppervlakteDBValues: string[][] = [];

  //Services
  comments: CommentsService
  afstand: AfstandService
  oppervlakte: OppervlakteService
  mjop: MjopService
  loading: LoadingService
  nsgiService: NsgiService;
  algoService: AlgoritmeVisualisatieService
  afbeeldingenService: AfbeeldingenService

  //Constructor
  constructor(private http: HttpClient, private router: Router, public fireService: FireService, public ngsiService: NsgiService) {
    this.auth = firebase.auth();
    this.firestore = firebase.firestore();
    this.storage = firebase.storage();
    this.comments = new CommentsService();
    this.afstand = new AfstandService();
    this.oppervlakte = new OppervlakteService();
    this.mjop = new MjopService();
    this.loading = new LoadingService();
    this.algoService = new AlgoritmeVisualisatieService(ngsiService);
    this.afbeeldingenService = new AfbeeldingenService(http);
  }


  //Functie die word aangeroepen bij het laden van de pagina
  ngOnInit(): void {
    // this.setAgloDatatoDB(this.assetId)
    switch (this.assetId) {
      case 1696313:
        this.showAlgoVisualisatie = true;
        this.showSteigerEnt = false;
        this.showAfbeeldingen = true;
        break;
      case 2249730:
        this.showSteigerEnt = true;
        break;
      case 1604370:
        this.showAfbeeldingen = false;
        break;
      case 2273011:
        this.showAfbeeldingen = false;
        this.showAlgoVisualisatie = false;
        this.showSteigerEnt = true;
        break;
      case 2273012:
        this.showAlgoVisualisatie = false;
        break;
      default:  
        this.showAlgoVisualisatie = !(this.assetId == 1696313 || this.assetId == 1604370 || this.assetId == 2273011 || this.assetId == 2273012);
        this.showAfbeeldingen = !this.showAlgoVisualisatie;
        break;
    }
  }

  //Op veranderingen in de URL
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assetId'] && this.initalizedViewer) {
      this.loading.loadModel(this.viewer, this.assetId);
    }
  }

  //Nadat de view geladen is 
  ngAfterViewInit(): void {
    if(this.assetId == 2273076) {
      this.initializeViewer2();
    } else {
      //Laad alle assets
      this.initializeViewer();
    }
    if (this.assetId !== -1) {
      this.loading.loadModel(this.viewer, this.assetId);
    }
    //Verkrijg XML data waneer Asset id klopt
    if (this.assetId == 1696313) {
      this.getXmlData();
    }
    //Load algo data wanneer Asset id klopt
    if (this.assetId == 2273011 || this.assetId == 1604370 || this.assetId == 2273012) {
      this.loadWindows(this.assetId); 
    }
    //Laad meerdere blokken v capelle blokken in als Asset id klopt
    if (this.assetId == 1873836) {
      this.loading.loadModelsCapelle(this.viewer);
    }
    if(this.assetId == 123) {
      this.loading.load3Dworld(this.viewer);
    }
    if(this.assetId == 2272565) {
      this.loading.loadModelsAlkmaar(this.viewer);
    }
    if(this.assetId == 2272565) {
      this.loading.loadModelsNijmegen(this.viewer);
    }
    this.setupClickEvents();
    this.getFirebaseData();
  }

  public setupClickEvents(): void {
    //Luisterd naar de clickevents na init
    this.clickEventAfbeeldingen();
    this.clickEventAfstand();
    this.clickEventOppervlakte();
    this.clickEventImage();
    this.clickComment();
  }

  public getFirebaseData(): void {
    this.getCommentData(this.viewer, this.assetId);
    this.getMJOPData(this.viewer, this.assetId);
    this.getMetingenData(this.viewer, this.assetId);
    this.getOppervlakteData(this.viewer, this.assetId);
  }

  //-------------------Loading---------------------------------------///

  //Maakt viewer aan waarin modellen bekeken kunnen worden.
  public initializeViewer(): void {
    this.initalizedViewer = true;
    //Cesium accestoken
    Cesium.Ion.defaultAccessToken = environment.CesiumAccessToken;
    //Viewer config
    this.viewer = new Viewer(this.el.nativeElement, {
      terrainProvider: Cesium.createWorldTerrain(),
      timeline: false,
      animation: false,
      selectionIndicator: false,
      infoBox: false,
      homeButton: false,
      sceneModePicker: false,
      vrButton: false,
      fullscreenButton: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      geocoder: false,
      imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),
    });
  }

  //Maakt viewer aan waarin modellen bekeken kunnen worden.
  public initializeViewer2(): void {
    this.initalizedViewer = true;
    //Cesium accestoken
    Cesium.Ion.defaultAccessToken = environment.CesiumAccessToken2;
    //Viewer config
    this.viewer = new Viewer(this.el.nativeElement, {
      terrainProvider: Cesium.createWorldTerrain(),
      timeline: false,
      animation: false,
      selectionIndicator: false,
      infoBox: false,
      homeButton: false,
      sceneModePicker: false,
      vrButton: false,
      fullscreenButton: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      geocoder: false,
      imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),
    });
  }

  //Functie die het weergeven van steigers realiseert
  public showSteiger(): void {
    this.loading.steiger3D.show = !this.loading.steiger3D.show;
  }

  //---------------------------einde loading----------------------------//

  //Functie voor knop om de view te resetten van het model
  public flyHomeButton(): void {
    this.viewer.flyTo(this.loading.tileset)
  }

  //Performance slider die de kwaliteit van modellen kan beinvloeden
  public changeScreenSpaceError(event: any = 0): void {
    this.errorValue = event.target.value
    var tempError: number = +this.errorValue;
    this.loadedAssets = this.loading.getLoadedAssets(this.viewer)
    console.log(this.loadedAssets)
    this.loadedAssets.forEach(element => {
      element.maximumScreenSpaceError = tempError;
    });
    this.loading.tileset.maximumScreenSpaceError = tempError;
  }

  //---------------------------------Oppervlakte-------------------------------//

  //Click even om oppervalktes te selecteren
  private clickEventOppervlakte(): void {
    this.oppervlakteDBValues = this.oppervlakte.oppervlakteDBValues;
    this.oppervlakte.clickEventOppervlakte(this.viewer, this.assetId, this.auth.currentUser?.email)
  }

  //Haal gemeten oppervlaktes op.
  public getOppervlakteData(viewer, assetId): void {
    this.oppervlakteDBValues = this.oppervlakte.oppervlakteDBValues;
    this.oppervlakte.getOppervlakteData(this.viewer, this.assetId)
  }

  //Verwijderd de oppervlakte
  public deleteOppervlakte(id): void {
    this.oppervlakte.deleteOppervlakte(id, this.viewer)
  }

  public deleteAllOppervlakte(): void {
    this.oppervlakte.deleteAllOppervlakte(this.viewer);
  }

  //Laat oppervlaktes zien met toggle
  public displayOppervlakte():void {
    this.oppervlakte.displayOppervlakte(this.viewer);
  }

  //Download gemeten oppervlakte data
  public downloadOppervlakte(): void {
    this.oppervlakte.downloadOppervlakte(this.assetId);
  }

  public checkOppervlakte(id: String[]): void {
    this.oppervlakte.checkOppervlakte(id, this.viewer);
  }

  //-------------------------------Einde oppervlakte-----------------------------//

// -------------------------------Comments ------------------------------------//
  
  //Functie waarmee een comment kan worden gegenereerd.
  public createComment(): void {
    // Wordt gebruikt om het punt waarop de gebruiker klikt op te slaan
    this.pointSelected = true
    var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((movement: any) => {
      if (this.enabledMenu == Menu.MESSAGE) {
        const pos: Cesium.Cartesian3 = this.viewer.scene.pickPosition(movement.position);
        //opslaan voor db
        this.commentCoordx = pos.x.toString();
        this.commentCoordy = pos.y.toString();
        this.commentCoordz = pos.z.toString();
        //Popup window functie
        this.commentWindow = true
        this.pointSelected = false
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  //Delete comment with id
  public deleteComment(input: String): void {
    this.comments.deleteComment(input, this.viewer);
  }

  //Navigeren naar een comment met de camera
  public viewComment(input: String): void {
    this.comments.viewComment(input, this.viewer);
  }

  //Add comment gelijk na het plaatsen
  public addCommentData(viewer: Cesium.Viewer, docId: String): void {
    this.comments.addCommentData(this.viewer, docId)
  }

  //Stuur comment waarde naar firebase DB.
  public logToDB(value: String): void {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    //Comment opslaan naar DB
    const commentData = {
      commentValue: value,
      commentProfile: this.auth.currentUser?.email,
      modelID: this.assetId,
      commentCoord_x: this.commentCoordx,
      commentCoord_y: this.commentCoordy,
      commentCoord_z: this.commentCoordz,
      date: day + "/" + month + "/" + year,
    }

    this.togglePopup();
    this.firestore.collection('Comments').add(commentData)
    .then((docRef) => {
      console.log('Comment added with ID: ', docRef.id);
      const id = docRef.id
      this.addCommentData(this.viewer, docRef.id, );
    })
    .catch((error) => {
      console.error('Error adding comment: ', error);
    });

    this.firestore.collection('Comments')
  }

  //Clickevent voor popup window comment
  private clickComment(): void {
    if (this.enabledMenu == Menu.MESSAGE) {
      this.createComment()
    }
}

public togglePopup(): void {
  this.commentWindow = !this.commentWindow
}

public toggleComment(): void {
  this.showCommentWindow = !this.showCommentWindow
}

public togglewindowPopup(): void {
  this.showCommentWindow = !this.showCommentWindow
}

//Haalt comment data op na het inladen van het model
public getCommentData(viewer: Cesium.Viewer, assetId: Number): void {
  this.commentArray = this.comments.commentArray;
  this.comments.getCommentData(viewer, assetId);
}

  // -------------------------Einde comments-------------------------------//


  //------------------------------MJOP-----------------------------------------//

  // Laat MJOP window zien waardoor gebruiker input kan invullen
  public createMJOP(): void {
    this.MJOP_Window = true;
  }

  //Log MJOP Data naar DB gekoppeld aan model
  public mjopToDB(): void {
    this.mjopArray = this.mjop.mjopArray;
    this.MJOP_Window = this.mjop.MJOP_Window;
    this.mjop.mjopToDB(this.auth.currentUser?.email, this.assetId, this.textareaValue, this.numberInputValue)
  }

  //Maakt PDF aan op basis van MJOP waardes
  public createPDF(): void {
    this.mjopArray = this.mjop.mjopArray;
    this.mjop.createPDF(this.assetId);
  }

  //Haalt comment data op na het inladen van het model
  public getMJOPData(viewer: Cesium.Viewer, assetId: Number): void {
    this.mjopArray = this.mjop.mjopArray;
    this.mjop.getMJOPData(viewer, assetId)
  }

  //Delete comment met id
  public deleteMJOP(input: String): void {
    this.mjopArray = this.mjop.mjopArray;
    this.mjop.deleteMJOP(input)
  }
  //------------------------------------------Einde MJOP------------------------------------//

  //Toggle functie voor icons in navigatie
  public toggleCase(menuItem): void {
    switch (menuItem) {
      case 'measure':
        this.toggleMenu(Menu.MEASUREMENT);
        this.algoService.hideAlgo(this.viewer);
        break;
      case 'message':
        this.toggleMenu(Menu.MESSAGE);
        this.algoService.hideAlgo(this.viewer);
        break;
      case 'oppervlaktes':
        this.toggleMenu(Menu.OPPERVLAKTES);
        this.algoService.hideAlgo(this.viewer);
        break;
      case 'points':
        this.toggleMenu(Menu.POINTS);
        this.algoService.hideAlgo(this.viewer);
        break; 
      case 'performance':
        console.log('performance toggle')
        this.toggleMenu(Menu.PERFORMANCE);
        this.algoService.hideAlgo(this.viewer);
        break; 
      case 'windows':
        this.toggleMenu(Menu.WINDOWS);
        break;
      case 'pictures':
        this.toggleMenu(Menu.PICTURES);
        this.algoService.hideAlgo(this.viewer);
        break;  
      case 'pen':
        this.toggleMenu(Menu.PEN);
        break;  
      case 'mjop':
        this.toggleMenu(Menu.MJOP);
        this.algoService.hideAlgo(this.viewer);
        break;
      case 'steiger':
        this.toggleMenu(Menu.STEIGER);        
        break;
    }    
  }

  // Functie om menu aan of uit te zetten
  public toggleMenu(menuType: Menu) {
    if (menuType == this.enabledMenu) {
      this.enabledMenu = Menu.NONE;
      this.afstand.enabledMenu = Menu.NONE;
      this.oppervlakte.enabledMenu = Menu.NONE;
    }
    else {
      this.enabledMenu = menuType;
      this.afstand.enabledMenu = menuType;
      this.oppervlakte.enabledMenu = menuType;
    }
  }

  //----------------------------------Afbeeldingen----------------------------------//

    //Foto's uit XML halen 
    private getXmlData(): void {
      this.afbeeldingenService.getXmlData(this.assetId);
      this.coordinatenFoto = this.afbeeldingenService.coordinatenFoto;
    }
    
    //Event handler voor right clicks: afbeeldingen
    private clickEventAfbeeldingen(): void {
      var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      //Maakt lijst van coordinaten om foto's van te selecteren wanneer de user klikt
      handler.setInputAction((movement: any) => {
        if (this.enabledMenu == Menu.PICTURES) {
          const pos: Cesium.Cartesian3 = this.viewer.scene.pickPosition(movement.position);
          //Error afhandeling wanneer geen valide positie is geselecteerd
          if (!pos) {
            alert('Deze positie kan niet geselecteerd worden, probeer opnieuw!');
            return;
          }
          //Voegt coordinaat toe aan de lijst met coordinaten.
          this.coordinatenClick.shift();
          this.coordinatenClick.shift();
          this.coordinatenClick.push([Number(pos.x), Number(pos.x + 4.5), Number(pos.x - 4.5)], [Number(pos.y), Number(pos.y + 4.5), Number(pos.y - 4.5)])
        }
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    }

  //Functie die de foto's weergeeft bij een locatie in het model
  async getPicturesOnClick() {
    const storage = getStorage(); // Initialize Firebase storage
    for (let i = 0; i < this.coordinatenFoto.length; i++) { 
      //Kijkt of de foto's binnen de marge vallen en voegt deze op basis van laatste getal van url toe aan arraylist
      if (((this.coordinatenFoto[i][1] < this.coordinatenClick[0][1]) && (this.coordinatenFoto[i][1] > this.coordinatenClick[0][2])) && ((this.coordinatenFoto[i][2] < this.coordinatenClick[1][1]) && (this.coordinatenFoto[i][2] > this.coordinatenClick[1][2]))) {
        this.xmlData = this.coordinatenFoto[i][0]
          //Voegt afbeelding toe aan de array om te laten zien in de front-end
          this.xmlDataArray.unshift(this.coordinatenFoto[i][0]);
          const imageRef = ref(storage, String(this.coordinatenFoto[i][0]));
          try {
            this.imageUrl = await getDownloadURL(imageRef);
            this.matchingImageUrls.unshift(this.imageUrl);
            //Error afhandeling
          } catch (error) {
            console.error('Error loading image:', error);
          }
        //Haalt laatst bekeken foto uit de array als de array > 8
        if (this.matchingImageUrls.length > 8) {
          this.matchingImageUrls.pop();
        }
      }
    }
  }

  //Ga naar Locatie met camera met behulp van de XML (WIP)
  public goToPictureLocation(data: String): void {
    this.afbeeldingenService.goToPictureLocation(data, this.viewer);
}

//Event handler wanneer afbeeldingen button is geselcteerd
private clickEventImage(): void {
  var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
  handler.setInputAction((movement: any) => {
    if (this.enabledMenu == Menu.PICTURES) {
      this.getPicturesOnClick()
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
} 

//-----------------------------------Einde afbeeldingen----------------------------------//
  //------------------------------Afstand------------------------------------//

  //Metingen laten zien / hiden
  public toggleOppervlaktes2(): void {
    this.gemaakteOppervlaktes.forEach(element => {
      var entity = this.viewer.entities.getById(element);
      if (entity !== undefined) { entity.show = !entity.show; }
    });
  }

  //Metingen verwijderen (oppervlaktes)
  public deleteOppervlaktes(): void {
    this.gemaakteOppervlaktes.forEach(element => {
      this.viewer.entities.removeById(element);
    });
    this.oppervlakteWaardes = []
  }

  //Metingen laten zien / hiden
  public toggleMeasurements(): void {
    this.gemaakteEntiteiten.forEach(element => {
      var entity = this.viewer.entities.getById(element);
      if (entity !== undefined) { entity.show = !entity.show; }
    });
  }

  //Metingen verwijderen (afstand)
  public deleteMeasurements(): void {
    this.gemaakteEntiteiten.forEach(element => {
      this.viewer.entities.removeById(element);
    });
    this.afmetingenWaardes = []
  }


  //Event handler om afmetingen te doen in Cesium
  private clickEventAfstand(): void {
    this.gemaakteEntiteiten = this.afstand.gemaakteEntiteiten;
    this.afmetingenArray = this.afstand.afmetingenArray;
    this.afstand.clickEventAfstand(this.viewer, this.auth.currentUser?.email, this.assetId, this.enabledMenu, this.menuOption)
  }

  //Haal meet data op uit DB
  public getMetingenData(viewer: Cesium.Viewer, assetId: Number): void {
    this.afstand.getMetingenData(this.viewer, this.assetId)
  } 

  //Navigeert naar de meting die is gedaan of in de tabel staat
  public checkMeting(id: String[]): void {
    this.afstand.checkMeting(id, this.viewer)
  }

  public downloadMeting(): void {
    this.afstand.downloadMeting(this.assetId)
  }

  //Show / hide alle metingen
  public displayMeting(): void {
    this.afstand.displayMeting(this.viewer);
  }

  //Haalt alle metingen uit de DB en uit het 3D model
  public deleteAllMeting(): void {
    this.afstand.deleteAllMeting(this.viewer)
  }

  //Delete meting afzonderlijk
  public deleteAfmeting(id: String): void {
    this.afstand.deleteAfmeting(id, this.viewer)
  }

  //-------------------------------Afstand einde----------------------------//

  //------------------------------NSGI----------------------------//

  //Haalt windows op wanneer assetId is voorzien van algoritme
  private async loadWindows(asset: Number): Promise<void> {
    this.algoService.loadWindows(this.assetId, this.viewer)
    this.windows = this.algoService.windows;
  }

  //Mogelijkheid om window van dichtbij te inspecteren
  public goToEntity(id: Number, visualizeId: String) {
    this.algoService.goToEntity(id, visualizeId, this.viewer)
  }

  //Visualiseerd algoritme
  public showAlgo(): void {
    this.algoService.showAlgo(this.viewer)
  }

  //Hide het algoritmevisualisatie
  public hideAlgo(viewer): void {
    this.algoService.hideAlgo(this.viewer)
  }

  //Toggle algoritmevisualisatie
  public toggleAlgo(): void {
    this.algoService.toggleAlgo(this.viewer)
  }
     
  //Mogelijkheid om kleur te veranderen van de algoritmevisualisatie
   public changeColorAlgo(event: Event, oppervlakteId: String): void {
    this.algoService.changeColorAlgo(event, oppervlakteId, this.viewer)
  }

  //Download algo results
  async downloadAlgo()  {
    this.algoService.downloadAlgo(this.assetId)
  }
}




